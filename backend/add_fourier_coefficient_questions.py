"""
Add 3 Fourier coefficient questions for f(x) = x^2 on [0, 2pi].
Each question evaluates one coefficient (a0, an, bn) with strict step validation.

Run: python add_fourier_coefficient_questions.py
"""
import json
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Question, User

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

teacher = db.query(User).filter_by(role="teacher").first()
if not teacher:
    print("No teacher found. Create a teacher account first.")
    exit(1)

QUESTIONS = [
    {
        "title": "Fourier Series: Find a₀ for f(x) = x² in [0, 2π]",
        "problem_expr": "Find a0 of the Fourier Series of f(x)=x^2 in [0, 2*pi]",
        "difficulty": "medium",
        "subject": "Engineering Mathematics",
        "topic": "Fourier Series",
        "unit_name": "Fourier Coefficients",
        "concept_tags": json.dumps(["fourier series", "a0 coefficient", "definite integral", "x squared"]),
        "problem_type": "fourier_a0",
        "validation_strategy": "fourier_a0",
        "hints": json.dumps([
            "The formula for a₀ is: a₀ = (1/π) ∫₀²π f(x) dx",
            "Substitute f(x) = x² and integrate to get x³/3",
            "Evaluate the definite integral from 0 to 2π",
            "The final answer is a₀ = 8π²/3",
        ]),
        "allow_copy_paste": True,
    },
    {
        "title": "Fourier Series: Find aₙ for f(x) = x² in [0, 2π]",
        "problem_expr": "Find an of the Fourier Series of f(x)=x^2 in [0, 2*pi]",
        "difficulty": "hard",
        "subject": "Engineering Mathematics",
        "topic": "Fourier Series",
        "unit_name": "Fourier Coefficients",
        "concept_tags": json.dumps(["fourier series", "an coefficient", "integration by parts", "cosine coefficient"]),
        "problem_type": "fourier_an",
        "validation_strategy": "fourier_an",
        "hints": json.dumps([
            "The formula for aₙ is: aₙ = (1/π) ∫₀²π f(x)cos(nx) dx",
            "Substitute f(x) = x² → integrate x²cos(nx) dx using IBP",
            "After integration by parts (twice), evaluate from 0 to 2π",
            "Use sin(2nπ) = 0 and cos(2nπ) = 1 to simplify",
            "The final answer is aₙ = 4/n²",
        ]),
        "allow_copy_paste": True,
    },
    {
        "title": "Fourier Series: Find bₙ for f(x) = x² in [0, 2π]",
        "problem_expr": "Find bn of the Fourier Series of f(x)=x^2 in [0, 2*pi]",
        "difficulty": "hard",
        "subject": "Engineering Mathematics",
        "topic": "Fourier Series",
        "unit_name": "Fourier Coefficients",
        "concept_tags": json.dumps(["fourier series", "bn coefficient", "integration by parts", "sine coefficient"]),
        "problem_type": "fourier_bn",
        "validation_strategy": "fourier_bn",
        "hints": json.dumps([
            "The formula for bₙ is: bₙ = (1/π) ∫₀²π f(x)sin(nx) dx",
            "Substitute f(x) = x² → integrate x²sin(nx) dx using IBP",
            "After integration by parts (twice), evaluate from 0 to 2π",
            "Use sin(2nπ) = 0 and cos(2nπ) = 1 to simplify",
            "The final answer is bₙ = -4π/n",
        ]),
        "allow_copy_paste": True,
    },
]

added = 0
for q_data in QUESTIONS:
    existing = db.query(Question).filter(Question.title == q_data["title"]).first()
    if existing:
        print(f"  [SKIP] Already exists: {q_data['title']} (id={existing.id})")
        continue

    question = Question(
        title=q_data["title"],
        problem_expr=q_data["problem_expr"],
        difficulty=q_data["difficulty"],
        subject=q_data["subject"],
        topic=q_data["topic"],
        unit_name=q_data["unit_name"],
        concept_tags=q_data["concept_tags"],
        problem_type=q_data["problem_type"],
        validation_strategy=q_data["validation_strategy"],
        analysis_confidence=1.0,
        hints=q_data["hints"],
        allow_copy_paste=q_data["allow_copy_paste"],
        created_by=teacher.id,
    )
    db.add(question)
    added += 1

db.commit()
print(f"\nAdded {added} Fourier coefficient questions.")

# Verify
for q_data in QUESTIONS:
    q = db.query(Question).filter(Question.title == q_data["title"]).first()
    if q:
        print(f"  ✓ id={q.id}  type={q.problem_type}  title={q.title}")

db.close()
