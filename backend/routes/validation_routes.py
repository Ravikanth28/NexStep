import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Question, Submission, StepLog, User
from auth import get_current_user
from validation_engine import build_learning_feedback, validate_steps, get_hint
from syllabus_engine import build_validation_notes, analyze_question_text, deserialize_concept_tags

router = APIRouter(prefix="/api", tags=["validation"])


class ValidateRequest(BaseModel):
    question_id: int
    steps: list[str]


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
def validate_solution(
    req: ValidateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    # Get the question
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if not req.steps or len(req.steps) == 0:
        raise HTTPException(status_code=400, detail="No steps provided")

    # Validate steps using SymPy engine
    analysis = analyze_question_text(question.title, question.problem_expr, question.topic)
    result = validate_steps(
        req.steps,
        question.problem_expr,
        question.validation_strategy or question.problem_type or analysis.strategy,
    )

    # Save submission
    is_correct = result["verdict"] == "Correct"
    correct_count = sum(1 for s in result["steps"] if s["valid"])
    score = (correct_count / len(result["steps"])) * 100 if result["steps"] else 0

    submission = Submission(
        user_id=current_user.id,
        question_id=question.id,
        steps_json=json.dumps(req.steps),
        is_correct=is_correct,
        score=score
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

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
            question.validation_strategy or analysis.strategy,
        ),
        "question_analysis": {
            "subject": question.subject or analysis.subject,
            "topic": question.topic or analysis.topic,
            "unit_name": question.unit_name or analysis.unit_name,
            "problem_type": question.problem_type or analysis.strategy,
            "validation_strategy": question.validation_strategy or analysis.strategy,
            "concept_tags": deserialize_concept_tags(question.concept_tags) or analysis.concept_tags,
            "analysis_confidence": question.analysis_confidence or analysis.confidence,
            "notes": build_validation_notes(analysis),
        },
    }


@router.post("/hint")
def get_hint_for_question(
    req: HintRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    hint = get_hint(question.problem_expr, req.step_number)
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
        "submitted_at": str(submission.submitted_at),
        "steps": steps,
        "verdict": "Correct" if submission.is_correct else "Incorrect",
        "correct_answer": None,
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
