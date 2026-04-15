"""
Migration: consolidate step_logs from one-row-per-step to one-row-per-submission.

Run once:  python manual_migrations/run_step_logs_migration.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # 1. Add the new column (nullable TEXT) - safe to repeat
    conn.execute(text("ALTER TABLE step_logs ADD COLUMN IF NOT EXISTS steps_json TEXT"))
    conn.commit()
    print("Column steps_json added (or already exists).")

    # 2. Aggregate all per-step rows into JSON on the MIN(id) row for each submission
    #    Uses PostgreSQL json_agg — one single UPDATE statement, no round trips per row.
    conn.execute(text("""
        UPDATE step_logs
        SET steps_json = agg.json_data
        FROM (
            SELECT
                submission_id,
                json_agg(
                    json_build_object(
                        'step',       step_number,
                        'expression', expression,
                        'valid',      is_valid,
                        'error',      error_message
                    ) ORDER BY step_number
                )::text AS json_data
            FROM step_logs
            WHERE step_number IS NOT NULL
            GROUP BY submission_id
        ) agg
        WHERE step_logs.submission_id = agg.submission_id
          AND step_logs.id = (
              SELECT MIN(id) FROM step_logs sl2
              WHERE sl2.submission_id = step_logs.submission_id
          )
    """))
    conn.commit()
    print("JSON aggregation done.")

    # 3. Delete all duplicate rows (keep only MIN(id) per submission)
    conn.execute(text("""
        DELETE FROM step_logs
        WHERE id NOT IN (
            SELECT MIN(id) FROM step_logs GROUP BY submission_id
        )
    """))
    conn.commit()
    print("Duplicate rows deleted.")

    # 4. Set '[]' for any rows with NULL steps_json (submissions with no old step data)
    conn.execute(text("UPDATE step_logs SET steps_json = '[]' WHERE steps_json IS NULL"))
    conn.commit()

    # 5. Add UNIQUE constraint on submission_id
    try:
        conn.execute(text(
            "ALTER TABLE step_logs "
            "ADD CONSTRAINT step_logs_submission_id_unique UNIQUE (submission_id)"
        ))
        conn.commit()
        print("UNIQUE constraint on submission_id added.")
    except Exception as e:
        conn.rollback()
        print("UNIQUE constraint skipped (may already exist):", e)

    # 6. Drop old individual-step columns
    for col in ("step_number", "expression", "is_valid", "error_message"):
        try:
            conn.execute(text(f"ALTER TABLE step_logs DROP COLUMN IF EXISTS {col}"))
            conn.commit()
            print(f"Dropped column: {col}")
        except Exception as e:
            conn.rollback()
            print(f"Could not drop column {col}:", e)

print("Migration complete.")
