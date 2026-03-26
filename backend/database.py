import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=ENV_PATH)

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise RuntimeError(f"DATABASE_URL is not set. Expected it in {ENV_PATH}.")

if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql://", 1)

if DB_URL.startswith("sqlite"):
    raise RuntimeError("SQLite is disabled for this backend. Set DATABASE_URL to the hosted PostgreSQL database.")

engine = create_engine(DB_URL, pool_pre_ping=True, pool_recycle=300, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema():
    """Backfill columns that were added after the original tables were created."""
    inspector = inspect(engine)

    if not inspector.has_table("questions"):
        return

    question_columns = {column["name"] for column in inspector.get_columns("questions")}
    statements = []

    if "allow_copy_paste" not in question_columns:
        statements.append(
            text("ALTER TABLE questions ADD COLUMN allow_copy_paste BOOLEAN NOT NULL DEFAULT TRUE")
        )
    if "subject" not in question_columns:
        statements.append(
            text("ALTER TABLE questions ADD COLUMN subject VARCHAR(120) NOT NULL DEFAULT 'Engineering Mathematics'")
        )
    if "unit_name" not in question_columns:
        statements.append(
            text("ALTER TABLE questions ADD COLUMN unit_name VARCHAR(150) NOT NULL DEFAULT 'General Problem Solving'")
        )
    if "concept_tags" not in question_columns:
        statements.append(
            text("ALTER TABLE questions ADD COLUMN concept_tags TEXT NOT NULL DEFAULT '[]'")
        )
    if "validation_strategy" not in question_columns:
        statements.append(
            text("ALTER TABLE questions ADD COLUMN validation_strategy VARCHAR(50) NOT NULL DEFAULT 'integral'")
        )
    if "analysis_confidence" not in question_columns:
        statements.append(
            text("ALTER TABLE questions ADD COLUMN analysis_confidence DOUBLE PRECISION NOT NULL DEFAULT 0")
        )

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(statement)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
