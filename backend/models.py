from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")  # "student" or "teacher"
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    questions = relationship("Question", back_populates="creator")
    submissions = relationship("Submission", back_populates="user")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    problem_expr = Column(String(500), nullable=False)  # e.g. "x**2"
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    subject = Column(String(120), default="Engineering Mathematics")
    topic = Column(String(100), default="Calculus")  # e.g., Matrices, Integral
    unit_name = Column(String(150), default="General Problem Solving")
    concept_tags = Column(Text, default="[]")
    problem_type = Column(String(50), default="integral")  # e.g., integral, matrix, ode
    validation_strategy = Column(String(50), default="integral")
    analysis_confidence = Column(Float, default=0.0)
    hints = Column(Text, default="[]")  # JSON array of hints
    allow_copy_paste = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="questions")
    submissions = relationship("Submission", back_populates="question")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    steps_json = Column(Text, nullable=False)  # JSON array of step strings
    is_correct = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    time_taken = Column(Integer, default=0) # in seconds
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")
    step_logs = relationship("StepLog", back_populates="submission", cascade="all, delete-orphan")


class StepLog(Base):
    __tablename__ = "step_logs"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    expression = Column(String(500), nullable=False)
    is_valid = Column(Boolean, default=False)
    error_message = Column(String(500), default=None)

    submission = relationship("Submission", back_populates="step_logs")
