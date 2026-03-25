"""
SymPy-based step validation engine for integral calculus.
Parses student expressions, validates each step, and compares final answers.
"""
import re
from sympy import (
    symbols, integrate, simplify, diff, Eq, solve, Matrix,
    sin, cos, tan, sec, csc, cot, exp, log, ln, sqrt, pi, E,
    trigsimp, expand, laplace_transform, inverse_laplace_transform, fourier_transform
)
from sympy.parsing.sympy_parser import (
    parse_expr, standard_transformations,
    implicit_multiplication_application, convert_xor
)

x = symbols('x')
C = symbols('C')

TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)

LOCAL_DICT = {
    'x': x, 'C': C, 'e': E, 'pi': pi,
    'sin': sin, 'cos': cos, 'tan': tan,
    'sec': sec, 'csc': csc, 'cot': cot,
    'exp': exp, 'log': log, 'ln': ln, 'sqrt': sqrt,
    'Matrix': Matrix, 'laplace_transform': laplace_transform,
    'inverse_laplace_transform': inverse_laplace_transform,
    'fourier_transform': fourier_transform
}


def preprocess_text(text: str) -> str:
    """Clean up student input for parsing."""
    text = text.strip()
    # Remove step labels like "Step 1:", "Step 2:", etc.
    text = re.sub(r'^(step\s*\d+\s*[:\.]?\s*)', '', text, flags=re.IGNORECASE)
    # Remove integral notation: ∫ ... dx  →  just the integrand or result
    text = re.sub(r'[∫]\s*', '', text)
    # Only strip trailing 'dx' that stands alone (not part of a variable)
    text = re.sub(r'\s+dx\s*$', '', text)
    # Remove leading = signs
    text = re.sub(r'^=\s*', '', text)
    # Replace ^ with ** for exponentiation
    text = text.replace('^', '**')
    # Replace × with *
    text = text.replace('×', '*')
    # Replace ÷ with /
    text = text.replace('÷', '/')
    return text.strip()


def parse_expression(text: str):
    """Parse a text expression into a SymPy expression."""
    cleaned = preprocess_text(text)
    if not cleaned:
        return None

    try:
        expr = parse_expr(cleaned, local_dict=LOCAL_DICT, transformations=TRANSFORMATIONS)
        return expr
    except Exception:
        return None


def expressions_equal(expr1, expr2) -> bool:
    """Check if two expressions are mathematically equivalent."""
    if expr1 is None or expr2 is None:
        return False
    try:
        # Strip any constant C from both for comparison
        e1 = expr1.subs(C, 0)
        e2 = expr2.subs(C, 0)
        diff_expr = simplify(e1 - e2)
        if diff_expr == 0:
            return True
        # Try expanding and simplifying
        diff_expr = simplify(expand(e1) - expand(e2))
        if diff_expr == 0:
            return True
        # Try trigsimp
        diff_expr = trigsimp(simplify(e1 - e2))
        if diff_expr == 0:
            return True
        return False
    except Exception:
        return False


def is_valid_antiderivative(expr, integrand) -> bool:
    """Check if expr is a valid antiderivative of integrand by differentiating."""
    try:
        # Remove constant of integration for differentiation
        expr_no_c = expr.subs(C, 0)
        derivative = diff(expr_no_c, x)
        return expressions_equal(derivative, integrand)
    except Exception:
        return False


def format_expression(expr) -> str:
    """Convert a SymPy expression to human-readable string (use ^ instead of **)."""
    s = str(expr)
    s = s.replace('**', '^')
    s = s.replace('*', '·')
    return s


def validate_integral_steps(steps: list[str], problem_expr_str: str) -> dict:
    """
    Validate a list of student steps for an integral problem.
    
    Returns:
        {
            "steps": [
                {"step": 1, "expression": "...", "valid": True/False, "error": None/"..."},
                ...
            ],
            "verdict": "Correct" / "Incorrect",
            "correct_answer": "..."
        }
    """
    # Parse the problem
    problem = parse_expression(problem_expr_str)
    if problem is None:
        return {
            "steps": [],
            "verdict": "Error",
            "error": f"Could not parse problem expression: {problem_expr_str}",
            "correct_answer": None
        }

    # Compute the correct integral
    try:
        correct_integral = integrate(problem, x)
    except Exception:
        return {
            "steps": [],
            "verdict": "Error",
            "error": "Could not compute the integral of the problem.",
            "correct_answer": None
        }

    results = []
    all_valid = True
    stopped = False

    for i, step_text in enumerate(steps):
        if stopped:
            results.append({
                "step": i + 1,
                "expression": step_text,
                "valid": False,
                "error": "Skipped (previous step had error)"
            })
            continue

        parsed = parse_expression(step_text)

        if parsed is None:
            results.append({
                "step": i + 1,
                "expression": step_text,
                "valid": False,
                "error": f"Could not parse expression: '{step_text}'"
            })
            all_valid = False
            stopped = True
            continue

        # For the first step, check if it restates the integral or is a valid transformation
        if i == 0:
            # Check if it's the integrand restated
            if expressions_equal(parsed, problem):
                results.append({
                    "step": 1,
                    "expression": step_text,
                    "valid": True,
                    "error": None
                })
                continue
            # Or if it's already the correct antiderivative
            if is_valid_antiderivative(parsed, problem):
                results.append({
                    "step": 1,
                    "expression": step_text,
                    "valid": True,
                    "error": None
                })
                continue
            # Or if it's a valid algebraic rewrite of the integrand
            # (e.g. expanding or factoring)
            if expressions_equal(parsed, problem):
                results.append({
                    "step": 1,
                    "expression": step_text,
                    "valid": True,
                    "error": None
                })
                continue
            # First step doesn't match anything valid
            results.append({
                "step": 1,
                "expression": step_text,
                "valid": False,
                "error": "First step does not match the integrand or a valid antiderivative."
            })
            all_valid = False
            stopped = True
            continue

        # For subsequent steps, check transformation validity
        prev_parsed = parse_expression(steps[i - 1])

        # Check if this step is mathematically consistent
        # Option 1: Same as previous (valid simplification / algebraic rewrite)
        if expressions_equal(parsed, prev_parsed):
            results.append({
                "step": i + 1,
                "expression": step_text,
                "valid": True,
                "error": None
            })
            continue

        # Option 2: The current step is a valid antiderivative of the integrand
        if is_valid_antiderivative(parsed, problem):
            results.append({
                "step": i + 1,
                "expression": step_text,
                "valid": True,
                "error": None
            })
            continue

        # Option 3: Check if derivative of current equals derivative of previous
        # (both are forms of the same antiderivative)
        try:
            d_curr = diff(parsed.subs(C, 0), x)
            d_prev = diff(prev_parsed.subs(C, 0), x) if prev_parsed else None
            if d_prev is not None and expressions_equal(d_curr, d_prev):
                results.append({
                    "step": i + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": None
                })
                continue
        except Exception:
            pass

        # Option 4: Check if current equals the correct integral (with or without +C)
        if expressions_equal(parsed, correct_integral):
            results.append({
                "step": i + 1,
                "expression": step_text,
                "valid": True,
                "error": None
            })
            continue

        # If none of the above, mark as invalid
        results.append({
            "step": i + 1,
            "expression": step_text,
            "valid": False,
            "error": "Invalid transformation — this step does not follow from the previous step."
        })
        all_valid = False
        stopped = True

    # Final validation: compare last valid step with correct answer
    if all_valid and results:
        last_step = parse_expression(steps[-1])
        if last_step is not None:
            if not is_valid_antiderivative(last_step, problem):
                # Check direct equality with correct integral
                if not expressions_equal(last_step, correct_integral):
                    results[-1]["valid"] = False
                    results[-1]["error"] = "Final answer does not match the correct integral."
                    all_valid = False

    return {
        "steps": results,
        "verdict": "Correct" if all_valid else "Incorrect",
        "correct_answer": format_expression(correct_integral) + " + C"
    }

def validate_matrix_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validate matrix evaluation (e.g. determinants, row reductions, basic eval)."""
    # Just check if the final step simplifies to the evaluation of the problem expr
    problem = parse_expression(problem_expr_str)
    if problem is None:
        return {"steps": [], "verdict": "Error", "error": "Invalid matrix problem", "correct_answer": None}
    
    try:
        correct_ans = simplify(problem)
    except Exception as e:
        return {"steps": [], "verdict": "Error", "error": f"Matrix eval failed: {str(e)}", "correct_answer": None}
    
    results = []
    all_valid = True
    for i, step_text in enumerate(steps):
        parsed = parse_expression(step_text)
        if parsed is None:
            results.append({"step": i+1, "expression": step_text, "valid": False, "error": "Parse error"})
            all_valid = False
            continue
        
        # Check if equivalent to correct answer or problem expression
        try:
            if simplify(parsed - correct_ans) == 0 or simplify(parsed - problem) == 0:
                results.append({"step": i+1, "expression": step_text, "valid": True, "error": None})
            else:
                results.append({"step": i+1, "expression": step_text, "valid": False, "error": "Incorrect matrix transformation"})
                all_valid = False
        except Exception:
            results.append({"step": i+1, "expression": step_text, "valid": False, "error": "Matrix equivalence check failed"})
            all_valid = False

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and len(results) > 0 else "Incorrect",
        "correct_answer": format_expression(correct_ans)
    }

def validate_transform_steps(steps: list[str], problem_expr_str: str) -> dict:
    """Validate transform evaluations (Laplace, Fourier)."""
    problem = parse_expression(problem_expr_str)
    if problem is None:
        return {"steps": [], "verdict": "Error", "error": f"Invalid transform problem: {problem_expr_str}", "correct_answer": None}
    
    try:
        # We need to evaluate the transform specifically if it's a call
        correct_ans = simplify(problem)
    except Exception as e:
        return {"steps": [], "verdict": "Error", "error": f"Transform evaluation failed: {str(e)}", "correct_answer": None}
    
    results = []
    all_valid = True
    stopped = False
    for i, step_text in enumerate(steps):
        if stopped:
            results.append({"step": i+1, "expression": step_text, "valid": False, "error": "Skipped"})
            continue
            
        parsed = parse_expression(step_text)
        if parsed is None:
            results.append({"step": i+1, "expression": step_text, "valid": False, "error": "Parse error"})
            all_valid = False
            stopped = True
            continue
            
        if expressions_equal(parsed, correct_ans) or expressions_equal(parsed, problem):
             results.append({"step": i+1, "expression": step_text, "valid": True, "error": None})
        else:
             results.append({"step": i+1, "expression": step_text, "valid": False, "error": "Incorrect transformation"})
             all_valid = False
             stopped = True

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and len(results) > 0 else "Incorrect",
        "correct_answer": format_expression(correct_ans)
    }

def validate_steps(steps: list[str], problem_expr_str: str, problem_type: str = "integral") -> dict:
    """Dispatcher for validation based on syllabus topic/problem type."""
    if problem_type == "matrix":
        return validate_matrix_steps(steps, problem_expr_str)
    if problem_type in ["transform", "vector", "stats"]:
        return validate_transform_steps(steps, problem_expr_str)
        
    return validate_integral_steps(steps, problem_expr_str)


def get_hint(problem_expr_str: str, step_number: int = 0) -> str:
    """Generate a hint for the given integral problem."""
    problem = parse_expression(problem_expr_str)
    if problem is None:
        return "Could not parse the problem expression."

    hints = []

    # Basic power rule hint
    if problem.is_polynomial(x):
        hints.append("Try applying the power rule: ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C")
        hints.append(f"The integrand is: {format_expression(problem)}")
        try:
            result = integrate(problem, x)
            terms = str(result).split('+')
            if len(terms) > 0:
                hints.append(f"Hint: The first term of the answer involves {terms[0].strip()}")
        except Exception:
            pass
    elif problem.has(sin) or problem.has(cos):
        hints.append("This involves trigonometric functions.")
        hints.append("Remember: ∫ sin(x) dx = -cos(x) + C and ∫ cos(x) dx = sin(x) + C")
    elif problem.has(exp):
        hints.append("This involves exponential functions.")
        hints.append("Remember: ∫ eˣ dx = eˣ + C")
    elif problem.has(log) or problem.has(ln):
        hints.append("This involves logarithmic functions.")
        hints.append("Consider integration by parts or substitution.")
    else:
        hints.append("Try breaking the expression into simpler parts.")
        hints.append("Consider substitution or integration by parts.")

    if step_number < len(hints):
        return hints[step_number]
    return hints[-1] if hints else "Try simplifying the expression step by step."
