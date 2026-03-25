import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Question, User
from auth import get_current_user

router = APIRouter(prefix="/api/questions", tags=["questions"])


class QuestionCreate(BaseModel):
    title: str
    problem_expr: str
    difficulty: str = "medium"
    topic: str = "Calculus"
    problem_type: str = "integral"
    hints: list[str] = []
    allow_copy_paste: bool = True


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
    return [
        {
            "id": q.id,
            "title": q.title,
            "problem_expr": q.problem_expr,
            "difficulty": q.difficulty,
            "topic": q.topic,
            "problem_type": q.problem_type,
            "hints": json.loads(q.hints) if q.hints else [],
            "allow_copy_paste": q.allow_copy_paste,
            "created_by": q.creator.username if q.creator else None,
            "created_at": str(q.created_at)
        }
        for q in questions
    ]


@router.get("/{question_id}")
def get_question(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return {
        "id": q.id,
        "title": q.title,
        "problem_expr": q.problem_expr,
        "difficulty": q.difficulty,
        "topic": q.topic,
        "problem_type": q.problem_type,
        "hints": json.loads(q.hints) if q.hints else [],
        "allow_copy_paste": q.allow_copy_paste,
        "created_by": q.creator.username if q.creator else None,
        "created_at": str(q.created_at)
    }


@router.post("")
def create_question(
    req: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create questions")

    question = Question(
        title=req.title,
        problem_expr=req.problem_expr,
        difficulty=req.difficulty,
        topic=req.topic,
        problem_type=req.problem_type,
        hints=json.dumps(req.hints),
        allow_copy_paste=req.allow_copy_paste,
        created_by=current_user.id
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return {
        "message": "Question created successfully",
        "question": {
            "id": question.id,
            "title": question.title,
            "problem_expr": question.problem_expr,
            "difficulty": question.difficulty,
            "topic": question.topic,
            "problem_type": question.problem_type,
            "hints": req.hints,
            "allow_copy_paste": question.allow_copy_paste
        }
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
