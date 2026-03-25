import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Question, User, Base
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Get the teacher
teacher = db.query(User).filter_by(role="teacher").first()
if not teacher:
    print("No teacher found to assign questions.")
    exit(1)

# Add Matrix Question
q_matrix = Question(
    title="Matrix Determinant",
    problem_expr="det(Matrix([[1, 2], [3, 4]]))",
    difficulty="easy",
    topic="Matrices",
    problem_type="matrix",
    hints=json.dumps(["Use the formula ad-bc"]),
    created_by=teacher.id
)

# Add Laplace Question
q_laplace = Question(
    title="Laplace of Exponential",
    problem_expr="laplace_transform(exp(3*x), x, s)[0]",
    difficulty="medium",
    topic="Transforms",
    problem_type="transform",
    hints=json.dumps(["Remember laplace of e^(at) is 1/(s-a)"]),
    created_by=teacher.id
)

db.add(q_matrix)
db.add(q_laplace)
db.commit()

print("Successfully added advanced engineering math questions!")
