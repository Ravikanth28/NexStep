import json
import warnings
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Question, Submission, StepLog, User
from auth import get_current_user
from validation_engine import build_learning_feedback, validate_steps, get_hint, compute_correct_answer, generate_solution_steps, infer_problem_type
from syllabus_engine import build_validation_notes, analyze_question_text, deserialize_concept_tags
from ai_engine import evaluate_student_solution

router = APIRouter(prefix="/api", tags=["validation"])


# ── LaTeX → SymPy pre-processing table ─────────────────────────────────────
# parse_latex chokes on several common MathLive outputs; we normalise them
# before handing off to the parser.
import re as _re

_LATEX_REPLACEMENTS = [
    # Absolute value: \left|x\right| → |x|
    (_re.compile(r'\\left\s*\|'), '|'),
    (_re.compile(r'\\right\s*\|'), '|'),
    # Evaluated bracket [F(x)]_a^b  → F(b) - F(a) representation stripped to inner expr
    # We just unwrap the inner expression so SymPy can parse it as a valid expr
    (_re.compile(r'\\left\[(.+?)\\right\]_\{([^}]*)\}\^\{([^}]*)\}'), r'(\1)'),
    (_re.compile(r'\\left\[(.+?)\\right\]'), r'(\1)'),
    # Arrows (used as "therefore" / implication steps) – strip them cleanly
    (_re.compile(r'\\(to|rightarrow|Rightarrow|longrightarrow|Longrightarrow)\b'), ''),
    # \, \; \! thin spaces – remove
    (_re.compile(r'\\[,;!]'), ' '),
    # \text{...} – keep the inner text
    (_re.compile(r'\\text\{([^}]*)\}'), r'\1'),
    # \cdot → *
    (_re.compile(r'\\cdot'), '*'),
]


def _preprocess_latex(latex: str) -> str:
    s = latex.strip()
    for pattern, repl in _LATEX_REPLACEMENTS:
        s = pattern.sub(repl, s)
    return s.strip()


def _latex_to_sympy_str(latex: str) -> str:
    """Convert a LaTeX expression string to a SymPy-parseable string.
    Applies known normalisations before calling parse_latex, then falls
    back to the original string if conversion still fails."""
    cleaned = _preprocess_latex(latex)
    # If the step is empty after stripping arrow/space noise, return as-is
    if not cleaned:
        return latex
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from sympy.parsing.latex import parse_latex
            expr = parse_latex(cleaned)
            return str(expr)
    except Exception:
        # Second chance: try the original unmodified latex
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                from sympy.parsing.latex import parse_latex
                expr = parse_latex(latex)
                return str(expr)
        except Exception:
            return latex


def _needs_ai_evaluation(result: dict | None) -> bool:
    """Return True only when local validation could not meaningfully evaluate."""
    if not result or not result.get("steps"):
        return True
    if result.get("verdict") == "Correct":
        return False

    unsupported_markers = (
        "not in a supported pattern",
        "not yet available",
        "could not parse",
        "unable to compute",
    )
    for step in result.get("steps", []):
        message = " ".join(
            str(step.get(key) or "")
            for key in ("error", "feedback")
        ).lower()
        if any(marker in message for marker in unsupported_markers):
            return True
    return False


def _normalize_probability_text(text: str) -> str:
    return _re.sub(r"\s+", "", (text or "").lower())


def _probability_postcheck(result: dict, problem_text: str) -> dict:
    """Catch simple probability count contradictions that AI may under-propagate."""
    lowered_problem = (problem_text or "").lower()
    if not result or "probability" not in lowered_problem:
        return result

    is_king_deck = "king" in lowered_problem and any(token in lowered_problem for token in ["card", "deck"])
    if not is_king_deck:
        return result

    saw_bad_king_count = False
    for step in result.get("steps", []):
        compact = _normalize_probability_text(step.get("expression", ""))
        if any(token in compact for token in ["n(a)=5", "favorableoutcomes=5", "favourableoutcomes=5", "5kings"]):
            saw_bad_king_count = True
            step["valid"] = False
            step["error"] = "A standard deck has 4 kings, not 5."

    if saw_bad_king_count:
        for step in result.get("steps", []):
            compact = _normalize_probability_text(step.get("expression", ""))
            if any(token in compact for token in ["5/52", "=0.096", "=0.0961"]):
                step["valid"] = False
                step["error"] = "This final probability uses the incorrect count of 5 kings."
        result["verdict"] = "Incorrect"
        result["overall_feedback"] = "Recheck the favorable-outcome count; later probability steps must use the corrected count."

    return result


class ValidateRequest(BaseModel):
    question_id: int
    steps: list[str]
    latex_steps: Optional[list[str]] = None   # visual-editor LaTeX steps
    time_taken: int = 0


class HintRequest(BaseModel):
    question_id: int
    step_number: int = 0


def _resolve_user(user_data: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Resolve JWT payload to a full User ORM object."""
    user = db.query(User).filter(User.id == int(user_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/validate")
async def validate_solution(
    req: ValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    # Get the question
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Keep the original LaTeX steps for the AI evaluator (human-readable),
    # but convert them to SymPy strings for the symbolic engine.
    original_latex_steps = req.latex_steps or req.steps
    if req.latex_steps:
        req.steps = [_latex_to_sympy_str(s) for s in req.latex_steps if s.strip()]

    if not req.steps or len(req.steps) == 0:
        raise HTTPException(status_code=400, detail="No steps provided")

    # Validate steps using SymPy engine
    analysis = analyze_question_text(question.title, question.problem_expr, question.topic)
    # evaluation_strategy is the AI evaluation mode (e.g. "ai_against_sympy_reference")
    # problem_type is the math domain (e.g. "integral", "series", "ode") used by SymPy
    evaluation_strategy = question.validation_strategy or question.problem_type or analysis.strategy
    problem_type = question.problem_type or analysis.strategy or infer_problem_type(question.problem_expr or "")
    solution_steps = generate_solution_steps(
        question.problem_expr,
        problem_type,
    )
    correct_answer = compute_correct_answer(
        question.problem_expr,
        problem_type,
    )

    template_only_reference = correct_answer is None
    result = None
    evaluation_mode = "symbolic_fallback"

    if template_only_reference:
        # When the reference engine only has a template/no answer key, AI should
        # evaluate the student's actual reasoning first.
        ai_result = await evaluate_student_solution(
            problem=question.problem_expr,
            student_steps=original_latex_steps,  # send readable LaTeX to AI
            reference_steps=solution_steps,
            correct_answer=correct_answer,
            strategy=evaluation_strategy,
        )
        if ai_result:
            result = ai_result
            evaluation_mode = "ai_against_template"

    if result is None:
        result = validate_steps(
            req.steps,
            question.problem_expr,
            problem_type,
        )
        if "correct_answer" not in result or result.get("correct_answer") is None:
            result["correct_answer"] = correct_answer

        if not template_only_reference and _needs_ai_evaluation(result):
            ai_result = await evaluate_student_solution(
                problem=question.problem_expr,
                student_steps=original_latex_steps,  # send readable LaTeX to AI
                reference_steps=solution_steps,
                correct_answer=correct_answer,
                strategy=evaluation_strategy,
            )
            if ai_result:
                result = ai_result
                evaluation_mode = "ai_against_sympy_reference"

    # Always trust the SymPy-computed correct_answer over whatever the AI returned
    if correct_answer:
        result["correct_answer"] = correct_answer

    result = _probability_postcheck(result, question.problem_expr)

    # Save submission
    is_correct = result["verdict"] == "Correct"
    correct_count = sum(1 for s in result["steps"] if s["valid"])
    score = (correct_count / len(result["steps"])) * 100 if result["steps"] else 0

    submission = Submission(
        user_id=current_user.id,
        question_id=question.id,
        steps_json=json.dumps(req.steps),
        is_correct=is_correct,
        score=score,
        time_taken=req.time_taken
    )
    db.add(submission)

    # --- Gamification Logic: Neural XP ---
    xp_gained = correct_count * 10  # 10 XP per valid step
    if is_correct:
        xp_gained += 100  # 100 XP bonus for full proof
    
    current_user.xp += xp_gained
    
    # Leveling logic: Level = 1 + floor(XP / 1000)
    new_level = 1 + (current_user.xp // 1000)
    leveled_up = new_level > current_user.level
    current_user.level = new_level
    
    db.commit()
    db.refresh(submission)
    db.refresh(current_user)

    # Save step logs
    for step_result in result["steps"]:
        step_log = StepLog(
            submission_id=submission.id,
            step_number=step_result["step"],
            expression=step_result["expression"],
            is_valid=step_result["valid"],
            error_message=step_result.get("error")
        )
        db.add(step_log)
    db.commit()

    return {
        "submission_id": submission.id,
        "steps": result["steps"],
        "verdict": result["verdict"],
        "score": score,
        "correct_answer": result.get("correct_answer"),
        "error": result.get("error"),
        "feedback": build_learning_feedback(
            result,
            question.topic or analysis.topic,
            problem_type,
        ),
        "question_analysis": {
            "subject": question.subject or analysis.subject,
            "topic": question.topic or analysis.topic,
            "unit_name": question.unit_name or analysis.unit_name,
            "problem_type": question.problem_type or problem_type,
            "validation_strategy": question.validation_strategy or evaluation_strategy,
            "concept_tags": deserialize_concept_tags(question.concept_tags) or analysis.concept_tags,
            "analysis_confidence": question.analysis_confidence or analysis.confidence,
            "notes": build_validation_notes(analysis),
        },
        "gamification": {
            "xp_gained": xp_gained,
            "total_xp": current_user.xp,
            "level": current_user.level,
            "leveled_up": leveled_up
        },
        "solution_steps": solution_steps,
        "evaluation_mode": evaluation_mode,
        "overall_feedback": result.get("overall_feedback"),
    }


@router.post("/hint")
async def get_hint_for_question(
    req: HintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    hint = get_hint(question.problem_expr, req.step_number)

    # Ask AI for relevant formulas to solve this problem
    from ai_engine import get_ai_response
    formula_system = (
        "You are a mathematics tutor. Given a math problem, list the key formulas a student needs to solve it. "
        "Return a JSON object with exactly two keys:\n"
        "  \"formulas\": an array of objects, each with \"name\" (formula name) and \"latex\" (the formula in LaTeX).\n"
        "  \"approach\": one sentence describing the overall approach.\n"
        "Return only valid JSON, no markdown fences."
    )
    formula_prompt = f"Problem: {question.problem_expr}\nTopic: {question.topic or ''}"

    formulas = []
    approach = ""
    try:
        raw = await get_ai_response(formula_prompt, formula_system)
        import json as _json
        # strip markdown fences if present
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()
        parsed = _json.loads(clean)
        formulas = parsed.get("formulas", [])
        approach = parsed.get("approach", "")
    except Exception:
        pass

    return {"hint": hint, "formulas": formulas, "approach": approach}


class StepHintRequest(BaseModel):
    question_id: int
    step_index: int        # 0-based index of the step the student wants a hint for
    latex_steps: list[str] # all steps entered so far (LaTeX)


@router.post("/step-hint")
async def get_step_hint(
    req: StepHintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Convert submitted steps to readable strings
    steps_text = [_latex_to_sympy_str(s) for s in req.latex_steps if s.strip()]
    current_step = steps_text[req.step_index] if req.step_index < len(steps_text) else ""

    from ai_engine import get_ai_response
    system_prompt = (
        "You are a helpful mathematics tutor. "
        "Given a problem and the student's work so far, suggest a short, clear hint for what the next step should be. "
        "Do NOT give the full answer. Give only a one or two sentence guiding hint. Be encouraging."
    )
    steps_summary = "\n".join(f"Step {i+1}: {s}" for i, s in enumerate(steps_text))
    user_prompt = (
        f"Problem: {question.problem_expr}\n"
        f"Student's steps so far:\n{steps_summary if steps_summary else '(none yet)'}\n"
        f"The student is currently on step {req.step_index + 1}. "
        "What should their next step be? Give a short hint only."
    )

    hint = await get_ai_response(user_prompt, system_prompt)
    if hint.startswith("Error: All AI systems"):
        from validation_engine import get_hint as get_local_hint
        hint = get_local_hint(question.problem_expr, req.step_index)
        
    return {"hint": hint}


@router.get("/submissions")
def get_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    submissions = db.query(Submission).filter(
        Submission.user_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).all()

    return [
        {
            "id": s.id,
            "question_id": s.question_id,
            "question_title": s.question.title if s.question else "Unknown",
            "is_correct": s.is_correct,
            "score": s.score,
            "time_taken": s.time_taken,
            "steps": json.loads(s.steps_json),
            "submitted_at": str(s.submitted_at)
        }
        for s in submissions
    ]


@router.get("/submissions/{submission_id}")
def get_submission_detail(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.user_id == current_user.id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    step_logs = sorted(submission.step_logs, key=lambda step: step.step_number)
    steps = [
        {
            "step": step.step_number,
            "expression": step.expression,
            "valid": step.is_valid,
            "error": step.error_message,
        }
        for step in step_logs
    ]
    question = submission.question

    return {
        "id": submission.id,
        "question_id": submission.question_id,
        "question_title": question.title if question else "Unknown",
        "problem_expr": question.problem_expr if question else "",
        "topic": question.topic if question else "",
        "subject": question.subject if question else "",
        "unit_name": question.unit_name if question else "",
        "validation_strategy": question.validation_strategy if question else "",
        "is_correct": submission.is_correct,
        "score": submission.score,
        "time_taken": submission.time_taken,
        "submitted_at": str(submission.submitted_at),
        "steps": steps,
        "verdict": "Correct" if submission.is_correct else "Incorrect",
        "correct_answer": compute_correct_answer(
            question.problem_expr if question else "",
            question.validation_strategy if question else "",
        ),
    }


@router.delete("/submissions/{submission_id}")
def delete_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.user_id == current_user.id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    db.delete(submission)
    db.commit()
    return {"message": "Submission deleted successfully"}


class VisionRequest(BaseModel):
    image_b64: str


@router.post("/vision-parse")
async def vision_parse_math(
    req: VisionRequest,
    current_user: User = Depends(_resolve_user)
):
    """Use the configured AI provider to ingest handwritten math images."""
    from ai_engine import get_ai_response
    
    system_prompt = """
    You are the NexStep Vision Ingest Module. 
    Analyze the provided image (represented by base64) of a mathematical derivation.
    Extract the symbolic steps line-by-line.
    Output a JSON object ONLY with:
    {
      "steps": ["step1", "step2", ...],
      "confidence": 0.95
    }
    Convert to SymPy-readable format (e.g. x**2, integrate(x, x), etc).
    """
    
    # Simulation: We send the request to the AI engine.
    # In a production environment, we'd pass the actual base64 to a vision-capable model.
    full_str = str(req.image_b64)
    short_str = full_str[0:100] if len(full_str) > 100 else full_str
    prompt = f"Extract steps from this mathematical image (Base64 data provided: {short_str}...)"
    response_text = await get_ai_response(prompt, system_prompt)

    if not response_text:
        return {"steps": [], "error": "AI providers are currently unavailable."}

    try:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        data = json.loads(response_text)
        return data
    except Exception as e:
        return {"steps": [], "error": f"Failed to parse neural vision: {str(e)}"}
