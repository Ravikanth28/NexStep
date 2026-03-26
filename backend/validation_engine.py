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




def infer_problem_type(problem_expr_str: str) -> str:
    lowered = (problem_expr_str or "").lower()
    if "fourier series" in lowered:
        return "series"
    if any(keyword in lowered for keyword in ["matrix", "[[", "det(", "determinant", "eigen", "rank"]):
        return "matrix"
    if any(keyword in lowered for keyword in ["laplace", "fourier", "z_transform", "inverse_laplace"]):
        return "transform"
    if any(keyword in lowered for keyword in ["probability", "bayes", "chi", "anova", "normal(", "poisson", "binomial", "p("]):
        return "stats"
    if any(keyword in lowered for keyword in ["gradient", "divergence", "curl", "vector", "del"]):
        return "vector"
    if any(keyword in lowered for keyword in ["lagrange", "partial derivative", "total derivative", "maxima", "minima", "double integral", "triple integral", "change of order"]):
        return "multivariable"
    if any(keyword in lowered for keyword in ["dy/dx", "d2y", "differential equation"]):
        return "ode"
    return "integral"


def preprocess_text(text: str) -> str:
    """Clean up student input for parsing."""
    text = text.strip()
    text = re.sub(r"^(step\s*\d+\s*[:\.]?\s*)", "", text, flags=re.IGNORECASE)
    text = text.replace("\u222b", "∫")
    text = text.replace("\u00d7", "*").replace("×", "*")
    text = text.replace("\u00f7", "/").replace("÷", "/")
    text = text.replace("−", "-").replace("–", "-").replace("\u2212", "-")
    text = re.sub(r"[∫]\s*", "", text)
    text = re.sub(r"\s+dx\s*$", "", text)
    text = re.sub(r"^=\s*", "", text)
    text = text.replace("^", "**")
    # Convert L[expr] shorthand to laplace_transform(expr, x, s)[0]
    text = re.sub(r"L\[([^\]]+)\]", r"laplace_transform(\1, x, s)[0]", text)

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


def _parse_comma_separated_values(step_text: str):
    cleaned = preprocess_text(step_text)
    if not cleaned:
        return None

    rhs = cleaned.split("=", 1)[1].strip() if "=" in cleaned else cleaned
    parts = [part.strip() for part in rhs.split(",") if part.strip()]
    if len(parts) < 1:
        return None

    values = []
    for part in parts:
        parsed = parse_expression_candidate(part)
        if parsed is None:
            return None
        values.append(parsed)
    return values


def validate_advanced_matrix_steps(steps: list[str], problem_expr_str: str, matrix: Matrix) -> dict:
    """Validate characteristic polynomial and eigenvalue style workflows."""
    lowered_problem = (problem_expr_str or "").lower()
    results = []
    all_valid = True

    characteristic_poly = matrix.charpoly(lam).as_expr()
    eigen_values = list(matrix.eigenvals().keys())
    normalized_expected = {simplify(value) for value in eigen_values}
    progress = {"char_eq": False, "eigenvalues": False, "final": False}

    for index, step_text in enumerate(steps):
        lowered = preprocess_text(step_text).lower()
        parsed = parse_expression_candidate(step_text)
        valid = False
        message = None

        if any(token in lowered_problem for token in ["characteristic equation", "characteristic polynomial", "eigen"]):
            if any(token in lowered for token in ["det(", "lambda", "char", "|a", "i)"]):
                valid = True
                message = "Good setup for the characteristic equation."
                progress["char_eq"] = True

            if parsed is not None and expressions_equal(parsed, characteristic_poly):
                valid = True
                message = "Correct characteristic polynomial."
                progress["char_eq"] = True

            values = _parse_comma_separated_values(step_text)
            if values is not None:
                normalized_values = {simplify(value) for value in values}
                if normalized_values == normalized_expected:
                    valid = True
                    message = "Correct eigenvalue set."
                    progress["eigenvalues"] = True
                    progress["final"] = True

            for eigen_value in normalized_expected:
                if parsed is not None and simplify(parsed - eigen_value) == 0:
                    valid = True
                    message = "One correct eigenvalue identified."
                    progress["eigenvalues"] = True

        if not valid:
            all_valid = False
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "This matrix step is not yet consistent with the characteristic-polynomial or eigenvalue workflow.",
                }
            )
        else:
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": message,
                }
            )

    if results and any(token in lowered_problem for token in ["eigen", "characteristic"]) and not progress["eigenvalues"]:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Eigenvalues",
                "valid": False,
                "error": "Finish by giving the eigenvalues obtained from the characteristic equation.",
            }
        )

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": f"Characteristic polynomial: {format_expression(characteristic_poly)}; Eigenvalues: {', '.join(format_expression(v) for v in eigen_values)}",
    }


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
    matrix = extract_matrix_from_problem(problem_expr_str)
    lowered_problem = (problem_expr_str or "").lower()

    if matrix is not None and any(token in lowered_problem for token in ["eigen", "characteristic", "cayley", "diagonal"]):
        return validate_advanced_matrix_steps(steps, problem_expr_str, matrix)

    problem = parse_matrix_problem(problem_expr_str)
    if problem is None:
        return {"steps": [], "verdict": "Error", "error": "Invalid matrix problem", "correct_answer": None}

    try:
        correct_ans = simplify(problem)
    except Exception as exc:
        return {"steps": [], "verdict": "Error", "error": f"Matrix eval failed: {exc}", "correct_answer": None}

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


def _line_mentions(line: str, *patterns: str) -> bool:
    lowered = preprocess_text(line).lower()
    compact = lowered.replace(" ", "")
    for pattern in patterns:
        normalized = pattern.lower()
        if normalized in lowered or normalized.replace(" ", "") in compact:
            return True
    return False


def validate_fourier_series_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Heuristic validation for common Fourier series derivations from the syllabus."""
    problem_lower = (problem_expr_str or "").lower()
    supports_standard_x_series = "f(x)=x" in problem_lower.replace(" ", "") or "f(x) = x" in problem_lower

    if not supports_standard_x_series:
        return {
            "steps": [
                {
                    "step": index + 1,
                    "expression": step,
                    "valid": True,
                    "error": "Accepted for teacher review. A specialized validator for this Fourier-series form is not yet available.",
                }
                for index, step in enumerate(steps)
            ],
            "verdict": "Review Required",
            "correct_answer": "x = 2*sum(((-1)^(n+1)*sin(n*x))/n, (n,1,oo))",
            "error": "This Fourier-series question needs a dedicated formula template that is not implemented yet.",
        }

    results = []
    progress = {
        "odd_even": False,
        "a0": False,
        "an": False,
        "bn_setup": False,
        "bn_formula": False,
        "final_series": False,
    }
    all_valid = True

    for index, step_text in enumerate(steps):
        lowered = preprocess_text(step_text).lower()

        if _line_mentions(lowered, "odd function", "f(-x)=-f(x)", "f(-x) = -f(x)"):
            progress["odd_even"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Correct: identifying odd symmetry is the right first step.",
            })
            continue

        if _line_mentions(lowered, "even function", "f(-x)=f(x)", "f(-x) = f(x)"):
            all_valid = False
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": False,
                "error": "This function is odd on (-pi, pi), not even.",
            })
            continue

        if _line_mentions(lowered, "a0=0", "a0 = 0"):
            progress["a0"] = True
            valid = progress["odd_even"] or progress["a0"]
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": valid,
                "error": None if valid else "Explain the odd-function property before setting a0 = 0.",
            })
            all_valid = all_valid and valid
            continue

        if _line_mentions(lowered, "an=0", "an = 0"):
            progress["an"] = True
            valid = progress["odd_even"] or progress["an"]
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": valid,
                "error": None if valid else "Show why the cosine coefficients vanish first.",
            })
            all_valid = all_valid and valid
            continue

        if "bn" in lowered and ("integral" in lowered or "sin(n*x)" in lowered or "sin(nx)" in lowered):
            progress["bn_setup"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Good: this sets up the sine coefficient computation.",
            })
            continue

        if _line_mentions(lowered, "2*(-1)^(n+1)/n", "2*(-1)**(n+1)/n", "2(-1)^(n+1)/n"):
            progress["bn_formula"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Correct bn coefficient for the standard Fourier series of x.",
            })
            continue

        if (
            ("sum(" in lowered and "sin(n*x)" in lowered and "(-1)^(n+1)" in lowered)
            or ("sin(x)" in lowered and "sin(2*x)" in lowered and "sin(3*x)" in lowered)
        ):
            progress["final_series"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Correct final sine-series form.",
            })
            continue

        results.append({
            "step": index + 1,
            "expression": step_text,
            "valid": False,
            "error": "This Fourier-series step does not match the expected odd-function, coefficient, or final-series pattern.",
        })
        all_valid = False

    if results and not progress["final_series"]:
        all_valid = False
        results.append({
            "step": len(results) + 1,
            "expression": "Final Fourier series",
            "valid": False,
            "error": "Finish by writing the final series: x = 2*sum(((-1)^(n+1)*sin(n*x))/n, (n,1,oo)).",
        })

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": "x = 2*sum(((-1)^(n+1)*sin(n*x))/n, (n,1,oo))",
    }


def validate_laplace_family_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validation for Laplace, inverse Laplace, Fourier transform, and Z-transform style answers."""
    parsed_problem = parse_expression_candidate(problem_expr_str)
    if parsed_problem is not None:
        return validate_transform_steps(steps, problem_expr_str)

    lowered = (problem_expr_str or "").lower()
    results = []
    all_valid = True

    for index, step_text in enumerate(steps):
        line = preprocess_text(step_text).lower()
        valid = False
        message = None

        if "laplace" in lowered and "exp(3" in lowered:
            if _line_mentions(line, "1/(s-3)", "1/(s - 3)"):
                valid = True
                message = "Correct transform pair for e^(3t) or e^(3x)."
            elif "laplace" in line or "l{" in line:
                valid = True
                message = "Good setup for the Laplace transform."

        elif "inverse laplace" in lowered:
            if any(token in line for token in ["partial", "fraction", "1/(s", "a/(s", "b/(s"]):
                valid = True
                message = "Good: partial-fraction style decomposition is a common first step."
            elif any(token in line for token in ["exp(", "e^", "sin(", "cos("]):
                valid = True
                message = "This looks like a reasonable time-domain inverse-transform step."

        elif "z-transform" in lowered or "z transform" in lowered:
            if any(token in line for token in ["sum(", "z/(z-1)", "z/(z - 1)", "residue", "partial"]):
                valid = True
                message = "Good Z-transform progression."

        elif "fourier transform" in lowered:
            if parse_expression_candidate(step_text) is not None:
                valid = True
                message = "Parsed symbolic Fourier-transform step."

        else:
            if parse_expression_candidate(step_text) is not None:
                valid = True
                message = "Accepted symbolic transform step."

        if not valid:
            all_valid = False
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "This transform step does not match a supported Laplace/Fourier/Z-transform pattern yet.",
                }
            )
        else:
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": message,
                }
            )

    correct_answer = None
    if "laplace" in lowered and "exp(3" in lowered and "inverse" not in lowered:
        correct_answer = "1/(s - 3)"

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": correct_answer,
    }


def validate_probability_stats_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validation for probability, distributions, and hypothesis-testing workflows."""
    lowered_problem = (problem_expr_str or "").lower()
    bayes_problem = "bayes" in lowered_problem or "p(a|b)" in lowered_problem or "conditional probability" in lowered_problem
    test_problem = any(token in lowered_problem for token in ["t-test", "t test", "chi-square", "chi square", "f-test", "f test", "anova", "regression", "correlation"])
    distribution_problem = any(token in lowered_problem for token in ["binomial", "poisson", "normal", "mgf", "mean", "variance", "random variable", "distribution"])

    results = []
    all_valid = True
    saw_final = False
    saw_formula = False

    for index, step_text in enumerate(steps):
        line = preprocess_text(step_text).lower()
        compact = line.replace(" ", "")
        valid = False
        message = None

        if bayes_problem:
            if _line_mentions(line, "p(a|b)=p(a and b)/p(b)", "p(a|b) = p(a and b)/p(b)", "p(a|b)=p(b|a)p(a)/p(b)", "p(a|b)=p(b|a)*p(a)/p(b)"):
                valid = True
                message = "Correct conditional-probability or Bayes-theorem formula."
                saw_formula = True
            elif any(token in line for token in ["p(a)", "p(b)", "p(b|a)", "p(a|b)", "total probability"]):
                valid = True
                message = "Good probability substitution step."
                if "p(a|b)" in compact and any(ch.isdigit() for ch in compact):
                    saw_final = True
        elif test_problem:
            if any(token in line for token in ["h0", "h1", "null hypothesis", "alternative hypothesis"]):
                valid = True
                message = "Good: hypothesis statement identified."
                saw_formula = True
            elif any(token in line for token in ["test statistic", "t =", "z =", "chi", "f ="]):
                valid = True
                message = "Appropriate test-statistic step."
                saw_formula = True
                if any(ch.isdigit() for ch in compact):
                    saw_final = True
            elif any(token in line for token in ["critical value", "p-value", "p value", "significance level", "alpha ="]):
                valid = True
                message = "Good decision-threshold step."
            elif any(token in line for token in ["reject", "accept", "conclusion", "significant"]):
                valid = True
                message = "Good conclusion step."
                saw_final = True
        elif distribution_problem:
            if any(token in line for token in ["p(x", "f(x", "pdf", "pmf", "normal(", "binomial", "poisson"]):
                valid = True
                message = "Good distribution formula/setup step."
                saw_formula = True
            elif any(token in line for token in ["mean", "variance", "mgf", "e(x)", "v(x)", "moment"]):
                valid = True
                message = "Good parameter/moment computation step."
                if any(ch.isdigit() for ch in compact) or "=" in compact:
                    saw_final = True
        else:
            if parse_expression_candidate(step_text) is not None or any(token in line for token in ["mean", "variance", "mgf", "binomial", "poisson", "normal"]):
                valid = True
                message = "Accepted statistics step."

        if not valid:
            all_valid = False
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "This probability/statistics step is not in a supported pattern yet.",
                }
            )
        else:
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": message,
                }
            )

    if bayes_problem and not saw_formula and results:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Bayes formula",
                "valid": False,
                "error": "Start by writing the Bayes/conditional-probability formula explicitly.",
            }
        )

    if bayes_problem and not saw_final and results:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Final probability result",
                "valid": False,
                "error": "Finish by computing and writing the final conditional probability.",
            }
        )

    if test_problem and not saw_final and results:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Decision / conclusion",
                "valid": False,
                "error": "Finish with the test conclusion: reject or fail to reject the null hypothesis.",
            }
        )

    if distribution_problem and not saw_final and results:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Final parameter/result",
                "valid": False,
                "error": "Finish by writing the final mean, variance, MGF, or requested distribution result.",
            }
        )

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": None,
    }


def validate_ode_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Heuristic validator for higher-order linear differential equations."""
    lowered_problem = (problem_expr_str or "").lower()
    results = []
    all_valid = True
    progress = {"classification": False, "aux": False, "cf": False, "pi": False, "solution": False}
    expected_flow = []

    if any(token in lowered_problem for token in ["constant coefficient", "d2y", "dy/dx", "differential equation"]):
        expected_flow = ["auxiliary equation", "roots", "complementary function", "particular integral", "final solution"]

    for index, step_text in enumerate(steps):
        line = preprocess_text(step_text).lower()
        valid = False
        message = None

        if any(token in line for token in ["linear differential equation", "homogeneous", "non-homogeneous", "auxiliary equation"]):
            progress["classification"] = True
            valid = True
            message = "Good problem classification/setup."
        elif any(token in line for token in ["m^2", "m**2", "auxiliary", "characteristic equation", "root", "m=", "m ="]):
            progress["aux"] = True
            valid = True
            message = "Good auxiliary/characteristic equation step."
        elif any(token in line for token in ["cf =", "complementary function", "c1", "c2", "y_c", "yc ="]):
            progress["cf"] = True
            valid = True
            message = "Complementary function identified."
        elif any(token in line for token in ["pi =", "particular integral", "variation of parameters", "particular solution", "y_p", "yp ="]):
            progress["pi"] = True
            valid = True
            message = "Particular integral/solution step recognized."
        elif any(token in line for token in ["y =", "general solution", "complete solution"]):
            progress["solution"] = True
            valid = True
            message = "Final differential-equation solution form recognized."

        if not valid:
            all_valid = False
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "This ODE step is outside the currently supported rule set.",
                }
            )
        else:
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": message,
                }
            )

    if results and not progress["solution"]:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Final solution",
                "valid": False,
                "error": "Finish by writing the complete solution y = CF + PI (or equivalent final form).",
            }
        )

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": "Expected flow: " + " -> ".join(expected_flow) if expected_flow else None,
    }


def validate_vector_multivariable_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validation for vector calculus, multivariable calculus, and multiple-integral workflows."""
    lowered_problem = (problem_expr_str or "").lower()
    results = []
    all_valid = True
    saw_final = False
    progress = {
        "partials": False,
        "operator": False,
        "limits": False,
        "conclusion": False,
    }

    for index, step_text in enumerate(steps):
        line = preprocess_text(step_text).lower()
        compact = line.replace(" ", "")
        valid = False
        message = None

        if any(token in lowered_problem for token in ["gradient", "grad", "∇"]):
            if any(token in line for token in ["gradient", "grad", "del", "partial", "fx", "fy", "fz"]):
                valid = True
                progress["operator"] = True
                progress["partials"] = progress["partials"] or any(token in compact for token in ["fx", "fy", "fz", "partial"])
                message = "Gradient computation step recognized."
                saw_final = saw_final or "gradient" in line or "=" in line

        elif any(token in lowered_problem for token in ["divergence", "curl", "gauss", "stokes", "directional derivative"]):
            if any(token in line for token in ["div", "divergence", "curl", "directional", "unit vector", "normal vector", "partial"]):
                valid = True
                progress["operator"] = True
                progress["partials"] = progress["partials"] or "partial" in line
                message = "Relevant vector-calculus step recognized."
                if any(token in line for token in ["solenoidal", "irrotational", "directional derivative =", "divergence =", "curl ="]):
                    progress["conclusion"] = True
                saw_final = saw_final or "=" in line or progress["conclusion"]

        elif any(token in lowered_problem for token in ["lagrange", "maxima", "minima", "partial derivative", "total derivative"]):
            if any(token in line for token in ["partial", "fx", "fy", "fz", "total derivative", "lambda", "critical point", "stationary"]):
                valid = True
                progress["partials"] = True
                message = "Optimization or multivariable derivative step recognized."
                if any(token in line for token in ["maximum", "minimum", "critical point", "hence"]):
                    progress["conclusion"] = True
                saw_final = saw_final or "=" in line or progress["conclusion"]

        elif any(token in lowered_problem for token in ["double integral", "triple integral", "change of order", "volume", "area"]):
            if any(token in line for token in ["integral", "limits", "jacobian", "dx", "dy", "dz", "dr", "dtheta", "polar", "spherical", "cylindrical"]):
                valid = True
                progress["limits"] = progress["limits"] or "integral" in line or "limits" in line
                message = "Multiple-integral setup recognized."
                if any(token in line for token in ["area =", "volume =", "=", "hence"]):
                    progress["conclusion"] = True
                saw_final = saw_final or "=" in line or progress["conclusion"]

        if not valid:
            all_valid = False
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "This vector/multivariable step is not yet in a supported detailed pattern for the detected topic.",
                }
            )
        else:
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": message,
                }
            )

    if results and not saw_final:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Final result",
                "valid": False,
                "error": "Finish by writing the evaluated final result or theorem conclusion clearly.",
            }
        )

    if any(token in lowered_problem for token in ["double integral", "triple integral", "change of order", "volume", "area"]) and results and not progress["limits"]:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Integral limits",
                "valid": False,
                "error": "Show the integration limits clearly before giving the final value.",
            }
        )

    if any(token in lowered_problem for token in ["lagrange", "maxima", "minima", "partial derivative", "total derivative", "gradient"]) and results and not progress["partials"]:
        all_valid = False
        results.append(
            {
                "step": len(results) + 1,
                "expression": "Derivative conditions",
                "valid": False,
                "error": "Show the required partial-derivative or stationarity conditions explicitly.",
            }
        )

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": None,
    }


def validate_general_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Fallback validator for questions that are hard to classify exactly."""
    parsed_problem = parse_expression_candidate(problem_expr_str)
    if parsed_problem is None:
        return {
            "steps": [
                {
                    "step": index + 1,
                    "expression": step,
                    "valid": True,
                    "error": None,
                }
                for index, step in enumerate(steps)
            ],
            "verdict": "Review Required",
            "correct_answer": None,
            "error": "The system could not fully parse this advanced problem, so it preserved the student steps for teacher review.",
        }

    results = []
    all_valid = True
    for index, step_text in enumerate(steps):
        parsed_step = parse_expression_candidate(step_text)
        if parsed_step is None:
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "Could not parse this step. Try using keyboard symbols or a simpler SymPy-style expression.",
                }
            )
            all_valid = False
            continue

        if index == len(steps) - 1 and expressions_equal(parsed_step, parsed_problem):
            results.append({"step": index + 1, "expression": step_text, "valid": True, "error": None})
        else:
            results.append(
                {
                    "step": index + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": "Accepted as an intermediate step under general validation.",
                }
            )

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Needs Review",
        "correct_answer": format_expression(parsed_problem),
    }


def validate_steps(steps: list[str], problem_expr_str: str, problem_type: str = "integral") -> dict:
    """Dispatch validation based on problem type."""
    resolved_type = problem_type or infer_problem_type(problem_expr_str)
    if problem_type == "matrix":
        return validate_matrix_steps(steps, problem_expr_str)
    if resolved_type == "matrix":
        return validate_matrix_steps(steps, problem_expr_str)
    if resolved_type == "series":
        return validate_fourier_series_steps(steps, problem_expr_str)
    if resolved_type == "transform":
        return validate_laplace_family_steps(steps, problem_expr_str)
    if resolved_type == "stats":
        return validate_probability_stats_steps(steps, problem_expr_str)
    if resolved_type in ["vector", "multivariable"]:
        return validate_vector_multivariable_steps(steps, problem_expr_str)
    if resolved_type == "ode":
        return validate_ode_steps(steps, problem_expr_str)
    if resolved_type == "integral":
        return validate_integral_steps(steps, problem_expr_str)
    return validate_general_steps(steps, problem_expr_str)


def build_learning_feedback(validation_result: dict, topic: str = "", strategy: str = "") -> dict:
    """Convert raw validation output into student-friendly coaching."""
    steps = validation_result.get("steps", [])
    strengths = [f"Line {step['step']}: {step['error']}" for step in steps if step.get("valid") and step.get("error")]
    clean_correct = [f"Line {step['step']} is correct." for step in steps if step.get("valid") and not step.get("error")]
    mistakes = [f"Line {step['step']}: {step['error']}" for step in steps if not step.get("valid") and step.get("error")]

    strengths = (strengths + clean_correct)[:4]
    mistakes = mistakes[:4]

    next_step = None
    if mistakes:
        next_step = mistakes[0]
    elif strategy == "series" or "fourier" in (topic or "").lower():
        next_step = "Now check whether you justified symmetry, coefficients, and the final series clearly."
    else:
        next_step = "Your steps are on the right track. Try to keep each transformation mathematically explicit."

    if validation_result.get("verdict") == "Correct":
        summary = "All checked steps are valid."
    elif validation_result.get("verdict") in {"Incorrect", "Needs Review", "Review Required"}:
        summary = "Some steps need correction or teacher review before the solution is complete."
    else:
        summary = "Validation finished with limited confidence."

    return {
        "summary": summary,
        "strengths": strengths,
        "mistakes": mistakes,
        "next_step": next_step,
    }


def get_hint(problem_expr_str: str, step_number: int = 0) -> str:
    """Generate a hint for the given problem."""
    lowered_problem = (problem_expr_str or "").lower()
    if "fourier series" in lowered_problem and ("f(x)=x" in lowered_problem.replace(" ", "") or "f(x) = x" in lowered_problem):
        hints = [
            "Check whether f(x)=x is odd or even on (-pi, pi).",
            "For an odd function, a0 = 0 and an = 0.",
            "Now compute bn and write the sine-series form.",
            "The final answer is x = 2*sum(((-1)^(n+1)*sin(n*x))/n, (n,1,oo)).",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

    if "laplace" in lowered_problem:
        hints = [
            "Identify the transform pair or property you want to use first.",
            "Write the Laplace/inverse-Laplace expression explicitly before simplifying.",
            "Check whether the final answer should be in the s-domain or time-domain.",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

    if any(token in lowered_problem for token in ["bayes", "conditional probability", "chi-square", "t-test", "anova", "regression"]):
        hints = [
            "Start by writing the relevant probability or test-statistic formula.",
            "Substitute the known values clearly.",
            "End with the final probability or statistical conclusion.",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

    if any(token in lowered_problem for token in ["binomial", "poisson", "normal", "mgf", "random variable", "variance", "mean"]):
        hints = [
            "Write the PMF/PDF or the distribution formula first.",
            "Then compute the requested mean, variance, or moment carefully.",
            "Finish with the exact final value or parameter expression.",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

    if any(token in lowered_problem for token in ["differential equation", "dy/dx", "d2y", "auxiliary equation"]):
        hints = [
            "Classify the differential equation and write the auxiliary equation if applicable.",
            "Find the complementary function before the particular integral.",
            "Finish with the complete solution in y.",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

    if any(token in lowered_problem for token in ["characteristic equation", "eigen", "cayley", "diagonal"]):
        hints = [
            "Begin with det(A - lambda I) = 0 or the appropriate theorem statement.",
            "Simplify the characteristic polynomial carefully before solving it.",
            "Then state the eigenvalues or final theorem result clearly.",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

    if any(token in lowered_problem for token in ["gradient", "divergence", "curl", "directional derivative", "gauss", "stokes"]):
        hints = [
            "Write the vector operator or formula you are applying first.",
            "Compute the required partial derivatives carefully.",
            "Then conclude with the final vector/scalar result or theorem statement.",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

    if any(token in lowered_problem for token in ["double integral", "triple integral", "change of order", "volume", "area", "lagrange", "maxima", "minima", "partial derivative", "total derivative"]):
        hints = [
            "Set up the limits or derivative conditions clearly first.",
            "Show the key transformation, Jacobian, or stationarity equations.",
            "Finish with the final area, volume, optimum value, or requested conclusion.",
        ]
        if step_number < len(hints):
            return hints[step_number]
        return hints[-1]

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
