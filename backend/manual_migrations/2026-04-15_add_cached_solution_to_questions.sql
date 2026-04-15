-- Add cached solution columns to questions table
-- Run once against your database

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS cached_explanation     TEXT,
  ADD COLUMN IF NOT EXISTS cached_steps           TEXT,
  ADD COLUMN IF NOT EXISTS cached_voice_script    TEXT,
  ADD COLUMN IF NOT EXISTS cached_correct_answer  TEXT;
