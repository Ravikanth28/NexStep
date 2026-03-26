import json

from database import SessionLocal
from models import Question, User
from syllabus_engine import analyze_question_text, serialize_concept_tags


TITLE = "Fourier Series of f(x)=x on (-pi, pi)"
PROBLEM_EXPR = "Find the Fourier series of f(x)=x for -pi < x < pi"
HINTS = [
    "First identify whether the function is odd or even.",
    "For an odd function on (-pi, pi), a0 = 0 and an = 0.",
    "Use bn = (1/pi) * integral from -pi to pi of x sin(nx) dx.",
]


def main():
    db = SessionLocal()
    try:
        teacher = db.query(User).filter_by(role="teacher").first()
        if not teacher:
            print("No teacher found to assign the Fourier sample question.")
            return

        existing = db.query(Question).filter(Question.title == TITLE).first()
        if existing:
            print(f"Sample question already exists with id={existing.id}")
            return

        analysis = analyze_question_text(TITLE, PROBLEM_EXPR, "Fourier Series")

        question = Question(
            title=TITLE,
            problem_expr=PROBLEM_EXPR,
            difficulty="medium",
            subject=analysis.subject,
            topic="Fourier Series",
            unit_name="Odd and Even Functions",
            concept_tags=serialize_concept_tags(
                ["fourier series", "odd function", "bn coefficient", "sine series"]
            ),
            problem_type="transform",
            validation_strategy="transform",
            analysis_confidence=analysis.confidence,
            hints=json.dumps(HINTS),
            allow_copy_paste=True,
            created_by=teacher.id,
        )

        db.add(question)
        db.commit()
        db.refresh(question)
        print(f"Added Fourier sample question with id={question.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
