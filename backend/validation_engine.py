"""
SymPy-based step validation engine for integral calculus and related topics.
"""
import ast
import re

from sympy import (
    E,
    Matrix,
    cos,
    cot,
    csc,
    diff,
    exp,
    expand,
    fourier_transform,
    integrate,
    inverse_laplace_transform,
    laplace_transform,
    log,
    pi,
    sec,
    simplify,
    sin,
    sqrt,
    symbols,
    tan,
    trigsimp,
)
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

x = symbols("x")
C = symbols("C")

TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)

LOCAL_DICT = {
    "x": x,
    "C": C,
    "e": E,
    "pi": pi,
    "sin": sin,
    "cos": cos,
    "tan": tan,
    "sec": sec,
    "csc": csc,
    "cot": cot,
    "exp": exp,
    "log": log,
    "ln": log,
    "sqrt": sqrt,
    "Matrix": Matrix,
    "laplace_transform": laplace_transform,
    "inverse_laplace_transform": inverse_laplace_transform,
    "fourier_transform": fourier_transform,
}


def preprocess_text(text: str) -> str:
    """Clean up student input for parsing."""
    text = text.strip()
    text = re.sub(r"^(step\s*\d+\s*[:\.]?\s*)", "", text, flags=re.IGNORECASE)
    text = text.replace("âˆ«", "∫")
    text = text.replace("Ã—", "*").replace("×", "*")
    text = text.replace("Ã·", "/").replace("÷", "/")
    text = text.replace("−", "-").replace("–", "-").replace("âˆ’", "-")
    text = re.sub(r"[∫]\s*", "", text)
    text = re.sub(r"\s+dx\s*$", "", text)
    text = re.sub(r"^=\s*", "", text)
    text = text.replace("^", "**")
    return text.strip()


def parse_expression(text: str):
    """Parse a text expression into a SymPy expression."""
    cleaned = preprocess_text(text)
    if not cleaned:
        return None

    try:
        return parse_expr(cleaned, local_dict=LOCAL_DICT, transformations=TRANSFORMATIONS)
    except Exception:
        return None


def parse_expression_candidate(text: str):
    """Parse the whole line, or the right-hand side if the user wrote an equality."""
    parsed = parse_expression(text)
    if parsed is not None:
        return parsed

    cleaned = preprocess_text(text)
    if "=" in cleaned:
        rhs = cleaned.split("=")[-1].strip()
        if rhs:
            return parse_expression(rhs)

    return None


def expressions_equal(expr1, expr2) -> bool:
    """Check if two expressions are mathematically equivalent."""
    if expr1 is None or expr2 is None:
        return False

    try:
        e1 = expr1.subs(C, 0)
        e2 = expr2.subs(C, 0)
        if simplify(e1 - e2) == 0:
            return True
        if simplify(expand(e1) - expand(e2)) == 0:
            return True
        if trigsimp(simplify(e1 - e2)) == 0:
            return True
        return False
    except Exception:
        return False


def is_valid_antiderivative(expr, integrand) -> bool:
    """Check if expr is a valid antiderivative of integrand by differentiating."""
    try:
        expr_no_c = expr.subs(C, 0)
        derivative = diff(expr_no_c, x)
        return expressions_equal(derivative, integrand)
    except Exception:
        return False


def format_expression(expr) -> str:
    """Convert a SymPy expression to a readable string."""
    return str(expr).replace("**", "^").replace("*", "·")


def parse_matrix_problem(problem_expr_str: str):
    """Support both SymPy expressions and plain-English matrix prompts."""
    parsed = parse_expression(problem_expr_str)
    if parsed is not None:
        return parsed

    matrix_match = re.search(r"(\[\s*\[.*\]\s*\])", problem_expr_str)
    if not matrix_match:
        return None

    try:
        matrix_data = ast.literal_eval(matrix_match.group(1))
        matrix = Matrix(matrix_data)
    except Exception:
        raw_matrix = matrix_match.group(1)
        row_matches = re.findall(r"\[([^\[\]]+)\]", raw_matrix)
        parsed_rows = []

        for row_text in row_matches:
            cleaned_row = row_text.replace(",", " ")
            values = [value for value in cleaned_row.split() if value]
            if not values:
                continue

            try:
                parsed_rows.append([
                    parse_expr(value, local_dict=LOCAL_DICT, transformations=TRANSFORMATIONS)
                    for value in values
                ])
            except Exception:
                return None

        if not parsed_rows:
            return None

        row_lengths = {len(row) for row in parsed_rows}
        if len(row_lengths) != 1:
            return None

        matrix = Matrix(parsed_rows)

    lowered = problem_expr_str.lower()
    if "determinant" in lowered or re.search(r"\bdet\b", lowered):
        return matrix.det()

    return matrix


def extract_matrix_from_problem(problem_expr_str: str):
    """Extract the raw matrix from a problem statement."""
    matrix_match = re.search(r"(\[\s*\[.*\]\s*\])", problem_expr_str)
    if not matrix_match:
        return None

    try:
        return Matrix(ast.literal_eval(matrix_match.group(1)))
    except Exception:
        raw_matrix = matrix_match.group(1)
        row_matches = re.findall(r"\[([^\[\]]+)\]", raw_matrix)
        parsed_rows = []

        for row_text in row_matches:
            cleaned_row = row_text.replace(",", " ")
            values = [value for value in cleaned_row.split() if value]
            if not values:
                continue

            try:
                parsed_rows.append([
                    parse_expr(value, local_dict=LOCAL_DICT, transformations=TRANSFORMATIONS)
                    for value in values
                ])
            except Exception:
                return None

        if not parsed_rows:
            return None

        row_lengths = {len(row) for row in parsed_rows}
        if len(row_lengths) != 1:
            return None

        return Matrix(parsed_rows)


def parse_assignment_step(step_text: str):
    """Parse a line like 'a=1,b=2,c=3,d=4' into symbol assignments."""
    cleaned = preprocess_text(step_text)
    if not cleaned or "," not in cleaned or "=" not in cleaned:
        return None

    assignments = {}
    parts = [part.strip() for part in cleaned.split(",") if part.strip()]
    for part in parts:
        if "=" not in part:
            return None
        left, right = [token.strip() for token in part.split("=", 1)]
        if not re.fullmatch(r"[A-Za-z]", left):
            return None

        parsed_right = parse_expression(right)
        if parsed_right is None:
            return None
        assignments[symbols(left)] = parsed_right

    return assignments if assignments else None


def parse_matrix_step_expression(step_text: str, symbolic_formula):
    """Parse determinant-style step expressions."""
    cleaned = preprocess_text(step_text)
    if not cleaned:
        return None

    rhs = cleaned.split("=", 1)[1].strip() if "=" in cleaned else cleaned
    compact_rhs = rhs.replace(" ", "").lower()

    if compact_rhs == "ad-bc":
        a, b, c, d = symbols("a b c d")
        return a * d - b * c
    if compact_rhs == "bc-ad":
        a, b, c, d = symbols("a b c d")
        return b * c - a * d

    parsed = parse_expression(rhs)
    if parsed is not None:
        return parsed

    if compact_rhs == str(symbolic_formula).replace(" ", "").lower():
        return symbolic_formula

    return None


def validate_integral_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validate a list of student steps for an integral problem."""
    problem = parse_expression(problem_expr_str)
    if problem is None:
        return {
            "steps": [],
            "verdict": "Error",
            "error": f"Could not parse problem expression: {problem_expr_str}",
            "correct_answer": None,
        }

    try:
        correct_integral = integrate(problem, x)
    except Exception:
        return {
            "steps": [],
            "verdict": "Error",
            "error": "Could not compute the integral of the problem.",
            "correct_answer": None,
        }

    results = []
    all_valid = True
    stopped = False

    for i, step_text in enumerate(steps):
        if stopped:
            results.append(
                {
                    "step": i + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "Skipped (previous step had error)",
                }
            )
            continue

        parsed = parse_expression(step_text)
        if parsed is None:
            results.append(
                {
                    "step": i + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": f"Could not parse expression: '{step_text}'",
                }
            )
            all_valid = False
            stopped = True
            continue

        if i == 0:
            if expressions_equal(parsed, problem) or is_valid_antiderivative(parsed, problem):
                results.append({"step": 1, "expression": step_text, "valid": True, "error": None})
                continue

            results.append(
                {
                    "step": 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "First step does not match the integrand or a valid antiderivative.",
                }
            )
            all_valid = False
            stopped = True
            continue

        prev_parsed = parse_expression(steps[i - 1])

        if expressions_equal(parsed, prev_parsed):
            results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
            continue

        if is_valid_antiderivative(parsed, problem):
            results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
            continue

        try:
            d_curr = diff(parsed.subs(C, 0), x)
            d_prev = diff(prev_parsed.subs(C, 0), x) if prev_parsed else None
            if d_prev is not None and expressions_equal(d_curr, d_prev):
                results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
                continue
        except Exception:
            pass

        if expressions_equal(parsed, correct_integral):
            results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
            continue

        results.append(
            {
                "step": i + 1,
                "expression": step_text,
                "valid": False,
                "error": "Invalid transformation - this step does not follow from the previous step.",
            }
        )
        all_valid = False
        stopped = True

    if all_valid and results:
        last_step = parse_expression(steps[-1])
        if last_step is not None and not is_valid_antiderivative(last_step, problem):
            if not expressions_equal(last_step, correct_integral):
                results[-1]["valid"] = False
                results[-1]["error"] = "Final answer does not match the correct integral."
                all_valid = False

    return {
        "steps": results,
        "verdict": "Correct" if all_valid else "Incorrect",
        "correct_answer": format_expression(correct_integral) + " + C",
    }


def validate_matrix_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validate matrix evaluation problems such as determinants."""
    problem = parse_matrix_problem(problem_expr_str)
    if problem is None:
        return {"steps": [], "verdict": "Error", "error": "Invalid matrix problem", "correct_answer": None}

    try:
        correct_ans = simplify(problem)
    except Exception as exc:
        return {"steps": [], "verdict": "Error", "error": f"Matrix eval failed: {exc}", "correct_answer": None}

    matrix = extract_matrix_from_problem(problem_expr_str)
    a, b, c, d = symbols("a b c d")
    expected_formula = a * d - b * c
    expected_assignments = None
    if matrix is not None and matrix.shape == (2, 2):
        expected_assignments = {
            a: matrix[0, 0],
            b: matrix[0, 1],
            c: matrix[1, 0],
            d: matrix[1, 1],
        }

    results = []
    all_valid = True
    stopped = False
    substitutions = {}
    previous_expr = None

    for i, step_text in enumerate(steps):
        if stopped:
            results.append(
                {
                    "step": i + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "Skipped (previous step had error)",
                }
            )
            continue

        assignments = parse_assignment_step(step_text)
        if assignments is not None:
            if expected_assignments is None:
                results.append(
                    {
                        "step": i + 1,
                        "expression": step_text,
                        "valid": False,
                        "error": "Assignments are only supported for 2x2 determinant problems.",
                    }
                )
                all_valid = False
                stopped = True
                continue

            mismatch = False
            for symbol, value in assignments.items():
                expected_value = expected_assignments.get(symbol)
                if expected_value is None or simplify(value - expected_value) != 0:
                    mismatch = True
                    break

            if mismatch:
                results.append(
                    {
                        "step": i + 1,
                        "expression": step_text,
                        "valid": False,
                        "error": "Variable assignments do not match the matrix entries.",
                    }
                )
                all_valid = False
                stopped = True
                continue

            substitutions.update(assignments)
            results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
            continue

        parsed = parse_matrix_step_expression(step_text, expected_formula)
        if parsed is None:
            results.append(
                {
                    "step": i + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "Could not parse this matrix step.",
                }
            )
            all_valid = False
            stopped = True
            continue

        try:
            parsed_eval = simplify(parsed.subs(substitutions))
            formula_eval = simplify(expected_formula.subs(substitutions))

            if previous_expr is None:
                if expressions_equal(parsed, expected_formula) or expressions_equal(parsed_eval, formula_eval) or expressions_equal(parsed_eval, correct_ans):
                    results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
                    previous_expr = parsed
                else:
                    results.append(
                        {
                            "step": i + 1,
                            "expression": step_text,
                            "valid": False,
                            "error": "First matrix step does not match the determinant setup or the correct value.",
                        }
                    )
                    all_valid = False
                    stopped = True
            else:
                previous_eval = simplify(previous_expr.subs(substitutions))
                if expressions_equal(parsed_eval, previous_eval) or expressions_equal(parsed_eval, correct_ans):
                    results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
                    previous_expr = parsed
                else:
                    results.append(
                        {
                            "step": i + 1,
                            "expression": step_text,
                            "valid": False,
                            "error": "This step does not follow from the previous step.",
                        }
                    )
                    all_valid = False
                    stopped = True
        except Exception:
            results.append(
                {
                    "step": i + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "Could not verify this matrix step.",
                }
            )
            all_valid = False
            stopped = True

    if all_valid and results:
        last_expr = parse_matrix_step_expression(steps[-1], expected_formula)
        if last_expr is None:
            results[-1]["valid"] = False
            results[-1]["error"] = "Final answer could not be parsed"
            all_valid = False
        else:
            last_eval = simplify(last_expr.subs(substitutions))
            if not expressions_equal(last_eval, correct_ans):
                results[-1]["valid"] = False
                results[-1]["error"] = "Final answer is incorrect"
                all_valid = False

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": format_expression(correct_ans),
    }


def validate_transform_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validate transform evaluations (Laplace, Fourier)."""
    problem = parse_expression(problem_expr_str)
    if problem is None:
        return {
            "steps": [],
            "verdict": "Error",
            "error": f"Invalid transform problem: {problem_expr_str}",
            "correct_answer": None,
        }

    try:
        correct_ans = simplify(problem)
    except Exception as exc:
        return {
            "steps": [],
            "verdict": "Error",
            "error": f"Transform evaluation failed: {exc}",
            "correct_answer": None,
        }

    results = []
    all_valid = True
    stopped = False

    for i, step_text in enumerate(steps):
        if stopped:
            results.append({"step": i + 1, "expression": step_text, "valid": False, "error": "Skipped"})
            continue

        parsed = parse_expression(step_text)
        if parsed is None:
            results.append({"step": i + 1, "expression": step_text, "valid": False, "error": "Parse error"})
            all_valid = False
            stopped = True
            continue

        if expressions_equal(parsed, correct_ans) or expressions_equal(parsed, problem):
            results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
        else:
            results.append({"step": i + 1, "expression": step_text, "valid": False, "error": "Incorrect transformation"})
            all_valid = False
            stopped = True

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": format_expression(correct_ans),
    }


def validate_steps(steps: list[str], problem_expr_str: str, problem_type: str = "integral") -> dict:
    """Dispatch validation based on problem type."""
    if problem_type == "matrix":
        return validate_matrix_steps(steps, problem_expr_str)
    if problem_type in ["transform", "vector", "stats"]:
        return validate_transform_steps(steps, problem_expr_str)
    return validate_integral_steps(steps, problem_expr_str)


def get_hint(problem_expr_str: str, step_number: int = 0) -> str:
    """Generate a hint for the given problem."""
    matrix_problem = parse_matrix_problem(problem_expr_str)
    if matrix_problem is not None and not problem_expr_str.strip().startswith(("x", "sin", "cos", "tan", "exp", "log")):
        matrix_hints = [
            "Write the determinant formula for a 2x2 matrix: ad - bc.",
            "Substitute the matrix entries carefully into ad - bc.",
            f"The final determinant is {format_expression(matrix_problem)}.",
        ]
        if step_number < len(matrix_hints):
            return matrix_hints[step_number]
        return matrix_hints[-1]

    problem = parse_expression(problem_expr_str)
    if problem is None:
        return "Could not parse the problem expression."

    hints = []
    if problem.is_polynomial(x):
        hints.append("Try applying the power rule: integral of x^n is x^(n+1)/(n+1) + C.")
        hints.append(f"The integrand is: {format_expression(problem)}")
        try:
            result = integrate(problem, x)
            terms = str(result).split("+")
            if terms:
                hints.append(f"Hint: The first term of the answer involves {terms[0].strip()}")
        except Exception:
            pass
    elif problem.has(sin) or problem.has(cos):
        hints.append("This involves trigonometric functions.")
        hints.append("Remember: integral of sin(x) is -cos(x) + C and integral of cos(x) is sin(x) + C.")
    elif problem.has(exp):
        hints.append("This involves exponential functions.")
        hints.append("Remember: integral of e^x is e^x + C.")
    elif problem.has(log):
        hints.append("This involves logarithmic functions.")
        hints.append("Consider integration by parts or substitution.")
    else:
        hints.append("Try breaking the expression into simpler parts.")
        hints.append("Consider substitution or integration by parts.")

    if step_number < len(hints):
        return hints[step_number]
    return hints[-1] if hints else "Try simplifying the expression step by step."
