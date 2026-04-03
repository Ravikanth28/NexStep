-- Migration: add problem_image column to questions table
ALTER TABLE questions ADD COLUMN problem_image TEXT NULL;
