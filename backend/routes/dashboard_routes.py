import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Question, Submission
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _resolve_user(user_data: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Resolve JWT payload to a full User ORM object."""
    user = db.query(User).filter(User.id == int(user_data["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/teacher")
def teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this dashboard")

    # Get all submissions
    submissions = db.query(Submission).order_by(Submission.submitted_at.desc()).all()

    # Get student stats
    students = db.query(User).filter(User.role == "student").all()
    student_stats = []
    for student in students:
        student_submissions = [s for s in submissions if s.user_id == student.id]
        total = len(student_submissions)
        correct = sum(1 for s in student_submissions if s.is_correct)
        avg_score = sum(s.score for s in student_submissions) / total if total > 0 else 0

        student_stats.append({
            "id": student.id,
            "username": student.username,
            "email": student.email,
            "total_submissions": total,
            "correct_submissions": correct,
            "accuracy": round((correct / total) * 100, 1) if total > 0 else 0,
            "avg_score": round(avg_score, 1)
        })

    # Sort by accuracy (ascending) to show weak students first
    student_stats.sort(key=lambda s: s["accuracy"])

    # Overall stats
    total_questions = db.query(Question).count()
    total_submissions = len(submissions)
    total_correct = sum(1 for s in submissions if s.is_correct)

    # Recent submissions
    recent = []
    for s in submissions[:20]:
        recent.append({
            "id": s.id,
            "student": s.user.username if s.user else "Unknown",
            "question": s.question.title if s.question else "Unknown",
            "is_correct": s.is_correct,
            "score": s.score,
            "submitted_at": str(s.submitted_at)
        })

    return {
        "overview": {
            "total_questions": total_questions,
            "total_submissions": total_submissions,
            "total_correct": total_correct,
            "overall_accuracy": round((total_correct / total_submissions) * 100, 1) if total_submissions > 0 else 0
        },
        "student_stats": student_stats,
        "recent_submissions": recent
    }


@router.get("/student")
def student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    submissions = db.query(Submission).filter(
        Submission.user_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).all()

    total = len(submissions)
    correct = sum(1 for s in submissions if s.is_correct)
    avg_score = sum(s.score for s in submissions) / total if total > 0 else 0

    # Per-question breakdown
    question_stats = {}
    for s in submissions:
        qid = s.question_id
        if qid not in question_stats:
            question_stats[qid] = {
                "question_id": qid,
                "question_title": s.question.title if s.question else "Unknown",
                "attempts": 0,
                "best_score": 0,
                "solved": False
            }
        question_stats[qid]["attempts"] += 1
        question_stats[qid]["best_score"] = max(question_stats[qid]["best_score"], s.score)
        if s.is_correct:
            question_stats[qid]["solved"] = True

    recent = []
    for s in submissions[:10]:
        recent.append({
            "id": s.id,
            "question_id": s.question_id,
            "question_title": s.question.title if s.question else "Unknown",
            "is_correct": s.is_correct,
            "score": s.score,
            "steps": json.loads(s.steps_json),
            "submitted_at": str(s.submitted_at)
        })

    return {
        "overview": {
            "total_submissions": total,
            "correct_submissions": correct,
            "accuracy": round((correct / total) * 100, 1) if total > 0 else 0,
            "avg_score": round(avg_score, 1)
        },
        "question_stats": list(question_stats.values()),
        "recent_submissions": recent
    }


from fastapi.responses import StreamingResponse
import io
import csv

@router.get("/teacher/report")
def download_teacher_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(_resolve_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this report")

    submissions = db.query(Submission).order_by(Submission.submitted_at.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Submission ID", "Student Username", "Question Title", "Score", "Is Correct", "Submitted At"])
    
    for s in submissions:
        student_name = s.user.username if s.user else "Unknown"
        question_title = s.question.title if s.question else "Unknown"
        writer.writerow([s.id, student_name, question_title, s.score, s.is_correct, str(s.submitted_at)])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_performance_report.csv"}
    )
