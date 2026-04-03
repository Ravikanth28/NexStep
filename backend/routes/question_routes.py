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
        "You are a math OCR engine. The user provides a base64-encoded image of a mathematical "
        "expression or equation. Extract the expression and return ONLY a JSON object:\n"
        '{"expression": "<sympy_expression>", "confidence": 0.95}\n'
        "Convert to SymPy-compatible syntax (e.g. x**2, integrate(x**2, (x, 0, 1)), sin(x), etc.)."
    )
    short_b64 = req.image_b64[:200] if len(req.image_b64) > 200 else req.image_b64
    prompt = f"Extract the math expression from this image (base64 prefix): {short_b64}..."
    response_text = await get_ai_response(prompt, system_prompt)

    try:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        data = json.loads(response_text)
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
    strategy = q.validation_strategy or q.problem_type
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
        validation_strategy=req.problem_type or analysis.strategy,
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
