-- Fix existing questions where validation_strategy was accidentally set to
-- a problem_type value (e.g. "integral", "ode", "series") instead of the
-- correct evaluation mode "ai_against_sympy_reference".
--
-- Safe to run multiple times (idempotent).

UPDATE questions
SET validation_strategy = 'ai_against_sympy_reference'
WHERE validation_strategy IS NULL
   OR validation_strategy NOT IN ('ai_against_sympy_reference', 'ai_only', 'sympy_only');
