import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Question, User
from auth import get_current_user
from syllabus_engine import (
    SUBJECTS,
    analyze_question_text,
    deserialize_concept_tags,
    serialize_concept_tags,
)

router = APIRouter(prefix="/api/questions", tags=["questions"])


class QuestionCreate(BaseModel):
    title: str
    problem_expr: str
    difficulty: str | None = None
    topic: str | None = None
    problem_type: str | None = None
    subject: str | None = None
    unit_name: str | None = None
    concept_tags: list[str] = []
    hints: list[str] = []
    allow_copy_paste: bool = True
    problem_image: str | None = None  # base64-encoded image of the expression


def _serialize_question(q: Question):
    return {
        "id": q.id,
        "title": q.title,
        "problem_expr": q.problem_expr,
        "difficulty": q.difficulty,
        "subject": q.subject,
        "topic": q.topic,
        "unit_name": q.unit_name,
        "concept_tags": deserialize_concept_tags(q.concept_tags),
        "problem_type": q.problem_type,
        "validation_strategy": q.validation_strategy,
        "analysis_confidence": q.analysis_confidence,
        "hints": json.loads(q.hints) if q.hints else [],
        "allow_copy_paste": q.allow_copy_paste,
        "problem_image": q.problem_image,
        "created_by": q.creator.username if q.creator else None,
        "created_at": str(q.created_at),
    }


def _resolve_user(user_data: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Resolve JWT payload to a full User ORM object."""
    user = db.query(User).filter(User.id == int(user_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("")
def list_questions(difficulty: str = None, topic: str = None, db: Session = Depends(get_db)):
    query = db.query(Question)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if topic and topic != "All":
        query = query.filter(Question.topic == topic)
        
    questions = query.order_by(Question.created_at.desc()).all()
    return [_serialize_question(q) for q in questions]


@router.get("/meta/syllabus")
def get_syllabus_meta():
    return {"subjects": SUBJECTS}


@router.post("/analyze")
def analyze_question_payload(req: QuestionCreate):
    analysis = analyze_question_text(req.title, req.problem_expr, req.topic)
    return {
        "analysis": analysis.to_dict(),
        "teacher_overrides": {
            "subject": req.subject,
            "topic": req.topic,
            "unit_name": req.unit_name,
            "problem_type": req.problem_type,
            "concept_tags": req.concept_tags,
        },
    }


class ParseImageRequest(BaseModel):
    image_b64: str


class NaturalQuestionFormatRequest(BaseModel):
    question: str


def _fallback_format_natural_question(question: str) -> dict:
    text = (question or "").strip()
    lowered = text.lower()

    if any(token in lowered for token in ["coin", "toss", "heads", "tails"]):
        event = "heads" if "head" in lowered else "tails" if "tail" in lowered else "heads"
        title_event = "Heads" if event == "heads" else "Tails"
        return {
            "title": f"Probability of Getting {title_event}",
            "problem_expr": text,
            "difficulty": "easy",
            "topic": "Probability",
            "subject": "Probability and Statistics",
            "unit_name": "Probability",
            "problem_type": "stats",
            "concept_tags": ["probability", "sample space", "equally likely outcomes", "coin toss"],
            "hints": [
                "List the possible outcomes for one coin toss.",
                f"Count how many outcomes give {title_event.lower()}.",
                "Use probability = favorable outcomes / total outcomes.",
            ],
            "allow_copy_paste": True,
        }

    if any(token in lowered for token in ["card", "deck", "king", "queen", "ace"]):
        title = "Probability of Drawing a King" if "king" in lowered else "Card Probability"
        return {
            "title": title,
            "problem_expr": text,
            "difficulty": "easy",
            "topic": "Probability",
            "subject": "Probability and Statistics",
            "unit_name": "Probability",
            "problem_type": "stats",
            "concept_tags": ["probability", "sample space", "equally likely outcomes", "standard deck"],
            "hints": [
                "A standard deck has 52 cards.",
                "Count the favorable cards requested by the problem.",
                "Use probability = favorable outcomes / total outcomes.",
            ],
            "allow_copy_paste": True,
        }

    analysis = analyze_question_text(text, text, None)
    return {
        "title": text[:80] or "Untitled Question",
        "problem_expr": text,
        "difficulty": analysis.difficulty,
        "topic": analysis.topic,
        "subject": analysis.subject,
        "unit_name": analysis.unit_name,
        "problem_type": analysis.strategy,
        "concept_tags": analysis.concept_tags,
        "hints": [],
        "allow_copy_paste": True,
    }


def _extract_json_object(raw_text: str) -> dict | None:
    clean = (raw_text or "").strip()
    if not clean:
        return None
    if "```" in clean:
        parts = clean.split("```")
        clean = parts[1] if len(parts) > 1 else clean
        if clean.lstrip().startswith("json"):
            clean = clean.lstrip()[4:]
    start = clean.find("{")
    end = clean.rfind("}")
    if start >= 0 and end > start:
        clean = clean[start:end + 1]
    try:
        parsed = json.loads(clean)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


@router.post("/format-natural")
async def format_natural_question(
    req: NaturalQuestionFormatRequest,
    current_user: User = Depends(_resolve_user),
):
    """Convert a teacher's natural-language question into form fields.

    This does not grade or solve the problem for students; it only fills metadata
    and parser-friendly fields. Local deterministic formatting remains available
    if AI providers are down.
    """
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can format questions")

    fallback = _fallback_format_natural_question(req.question)

    from ai_engine import get_ai_response

    system_prompt = (
        "You format teacher-authored math questions into app form fields. "
        "Do not provide a full solution and do not evaluate student work. "
        "Return ONLY JSON with keys: title, problem_expr, difficulty, topic, subject, "
        "unit_name, problem_type, concept_tags, hints, allow_copy_paste. "
        "problem_type must be one of: integral, series, transform, matrix, stats, vector, "
        "multivariable, ode, algebra, other. "
        "For simple probability questions, preserve the natural-language problem_expr and set problem_type to stats."
    )
    prompt = f"Format this question for the NexStep form:\n{req.question}"
    response_text = await get_ai_response(prompt, system_prompt)
    ai_fields = _extract_json_object(response_text)

    if not ai_fields:
        return {"fields": fallback, "source": "local"}

    fields = {**fallback, **{key: value for key, value in ai_fields.items() if value not in (None, "", [])}}
    if not isinstance(fields.get("concept_tags"), list):
        fields["concept_tags"] = fallback["concept_tags"]
    if not isinstance(fields.get("hints"), list):
        fields["hints"] = fallback["hints"]
    fields["problem_expr"] = fields.get("problem_expr") or req.question
    return {"fields": fields, "source": "ai"}


@router.post("/parse-image")
async def parse_expression_image(
    req: ParseImageRequest,
    current_user: User = Depends(_resolve_user),
):
    """Use AI to extract a SymPy-compatible math expression from a base64 image."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can use this feature")

    from ai_engine import get_ai_response

    system_prompt = (
        "You are a math OCR engine. The user provides a base64-encoded image of a math problem. "
        "Extract all relevant information and return ONLY a JSON object with these fields:\n"
        '{"expression": "<sympy_expression>", "title": "<short question title>", '
        '"topic": "<math topic e.g. Calculus, Algebra, Differential Equations>", '
        '"difficulty": "<easy|medium|hard>", '
        '"problem_type": "<integral|series|ode|matrix|transform|algebra|geometry|other>", '
        '"confidence": 0.95}\n'
        "Convert the expression to SymPy-compatible syntax (e.g. x**2, integrate(x**2, (x, 0, 1)), sin(x), etc.). "
        "Return only the JSON object, no markdown fences."
    )
    prompt = f"Extract the math problem from this image. Image base64: data:image/png;base64,{req.image_b64}"
    response_text = await get_ai_response(prompt, system_prompt)

    if not response_text:
        return {"expression": "", "error": "AI providers are currently unavailable. Please enter the expression manually."}

    try:
        clean = response_text.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()
        data = json.loads(clean)
        return data
    except Exception as e:
        return {"expression": "", "error": f"Failed to parse image: {str(e)}"}


@router.get("/{question_id}/answer")
def get_question_answer(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user),
):
    """Teacher-only: return the engine-computed correct answer for a question."""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view correct answers on question cards")

    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    from validation_engine import compute_correct_answer
    strategy = q.problem_type or q.validation_strategy
    answer = compute_correct_answer(q.problem_expr, strategy)
    return {"question_id": question_id, "correct_answer": answer, "strategy": strategy}


@router.get("/{question_id}")
def get_question(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return _serialize_question(q)


@router.post("")
def create_question(
    req: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create questions")

    analysis = analyze_question_text(req.title, req.problem_expr, req.topic)
    concept_tags = req.concept_tags or analysis.concept_tags

    question = Question(
        title=req.title,
        problem_expr=req.problem_expr,
        difficulty=req.difficulty or analysis.difficulty,
        subject=req.subject or analysis.subject,
        topic=req.topic or analysis.topic,
        unit_name=req.unit_name or analysis.unit_name,
        concept_tags=serialize_concept_tags(concept_tags),
        problem_type=req.problem_type or analysis.strategy,
        validation_strategy="ai_against_sympy_reference",
        analysis_confidence=analysis.confidence,
        hints=json.dumps(req.hints),
        allow_copy_paste=req.allow_copy_paste,
        problem_image=req.problem_image,
        created_by=current_user.id
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return {
        "message": "Question created successfully",
        "question": _serialize_question(question)
    }


@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete questions")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}
