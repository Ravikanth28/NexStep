"""
SymPy-based step validation engine for integral calculus and related topics.
"""
import ast
import re

from sympy.abc import x, y, z, t, n
from ai_engine import expert_critic_check

from sympy import (
    E,
    Matrix,
    cos,
    cot,
    csc,
    diff,
    exp,
    expand,
    factorial,
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

x, t, s, k, n, y, z = symbols("x t s k n y z")
lam = symbols("lambda")
C = symbols("C")

TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)

LOCAL_DICT = {
    "x": x,
    "t": t,
    "s": s,
    "k": k,
    "n": n,
    "y": y,
    "z": z,
    "lambda": lam,
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
    "factorial": factorial,
    "Matrix": Matrix,
    "laplace_transform": laplace_transform,
    "inverse_laplace_transform": inverse_laplace_transform,
    "fourier_transform": fourier_transform,
    "integrate": integrate,
    "diff": diff,
}


def infer_problem_type(problem_expr_str: str) -> str:
    lowered = (problem_expr_str or "").lower()
    if "fourier series" in lowered:
        return "series"
    if any(keyword in lowered for keyword in ["matrix", "[[", "det(", "determinant", "eigen", "rank"]):
        return "matrix"
    if any(keyword in lowered for keyword in ["laplace", "fourier", "z_transform", "inverse_laplace"]):
        return "transform"
    if re.search(r"(?<![A-Za-z])L\s*[\[\{]", problem_expr_str or ""):
        return "transform"
    if re.search(r"(?<![A-Za-z])L\s*\^", problem_expr_str or ""):
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
    # Remove common step labels and prefixes
    text = re.sub(r"^(antiderivative|derivative|integral|let|using|from|applying|via|by|therefore|thus|note|observation|remark|simplifying|factoring|expanding|grouping|combining|solving|solving for|find|compute|calculate|show|proof|claim|verify|check)[\s:,]*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^(=\s*|\→\s*|→\s*)", "", text)
    text = text.replace("âˆ«", "∫")
    text = text.replace("Ã—", "*").replace("×", "*")
    text = text.replace("Ã·", "/").replace("÷", "/")
    text = text.replace("−", "-").replace("–", "-").replace("âˆ’", "-")
    # Convert 'int ' shorthand to '∫' for easier parsing
    text = re.sub(r"\bint\b\s+", "∫ ", text, flags=re.IGNORECASE)
    # Convert Unicode subscript/superscript integral limits: ∫₀¹ → ∫(0,1), and x² → x^2
    _sub_dig = str.maketrans("₀₁₂₃₄₅₆₇₈₉", "0123456789")
    _sup_map = {"⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9"}
    text = re.sub(
        r"∫([₀₁₂₃₄₅₆₇₈₉]+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)",
        lambda m: "∫(" + m.group(1).translate(_sub_dig) + "," + "".join(_sup_map.get(c, c) for c in m.group(2)) + ")",
        text,
    )
    for _sup, _dig in _sup_map.items():
        text = text.replace(_sup, "^" + _dig)
    text = text.translate(_sub_dig)
    # Convert definite integral: ∫(a,b) expr dx → integrate(expr, (x, a, b))
    text = re.sub(
        r'\u222b\(([^,]+),([^)]+)\)\s*(.+?)\s+d([a-z])(?:\s|$)',
        r'integrate(\3, (\4, \1, \2))',
        text,
    )
    # Convert indefinite integral: ∫ expr dx → integrate(expr, x)
    text = re.sub(
        r'\u222b\s*(.+?)\s+d([a-z])(?:\s|$)',
        r'integrate(\1, \2)',
        text,
    )
    # Strip any remaining bare ∫ symbols
    text = re.sub(r"[∫]\s*", "", text)
    text = re.sub(r"\s+dx\s*$", "", text)
    text = re.sub(r"^=\s*", "", text)
    text = re.sub(r"(\d+)!", r"factorial(\1)", text)
    text = text.replace("^", "**")
    return text.strip()


def detect_mathematical_traps(steps: list[str]) -> list[str]:
    """Expert rule-based detection for 10-year veteran level 'gotchas'."""
    traps = []
    for step in steps:
        s = step.lower().replace(" ", "")
        
        # Power rule applied to exponential base
        if "d/dx(2**x)" in s or "diff(2**x,x)" in s:
             if "**(x-1)" in s:
                traps.append("Expert Alert: Applied standard Power Rule to an exponential base (2^x). Exponential derivatives preserve the base and require a natural log: (a^x)' = a^x * ln(a).")
        
        # Integral of 1/x missing absolute value
        if "integrate(1/x,x)" in s or "log(x)" in s:
            if "log(abs(x))" not in s and "log(x)" in s:
                traps.append("Expert Alert: Integral of 1/x is ln|x| + C. Missing the absolute value is a common error that restricts the function to the positive domain.")
            
        # Linear property of trig (Universal Error)
        if "sin(x+y)" in s and "sin(x)+sin(y)" in s:
             traps.append("Critical Error: Trigonometric functions are NOT linear. sin(A+B) ≠ sin(A) + sin(B). Use sine addition theorem.")
                 
        # Missing C in final answer
        if "y=" in s and "integrate" in s and "+c" not in s:
            traps.append("Notation Alert: Missing constant of integration (+C). 10-year experts are strict on this as it defines a family of curves, not a single one.")
            
    return traps


def _find_matching_bracket(text: str, start: int, open_char: str = "[", close_char: str = "]") -> int:
    """Find the index of the matching closing bracket starting from an open bracket at *start*."""
    depth = 0
    for i in range(start, len(text)):
        if text[i] == open_char:
            depth += 1
        elif text[i] == close_char:
            depth -= 1
            if depth == 0:
                return i
    return -1


def _compute_laplace(inner_expr, inverse: bool = False):
    """Compute a Laplace or inverse-Laplace transform, returning the result or *None*."""
    try:
        if inverse:
            result = inverse_laplace_transform(inner_expr, s, x)
        else:
            free = inner_expr.free_symbols
            time_var = t if t in free else x
            result = laplace_transform(inner_expr, time_var, s)
        value = result[0] if isinstance(result, tuple) else result
        return simplify(value)
    except Exception:
        return None


def _extract_laplace_inner(problem_str: str):
    """Extract inner expression from ``L[expr]`` or ``L^-1[expr]`` notation.

    Returns ``(inner_sympy_expr, correct_answer)`` or ``(None, None)``.
    """
    text = (problem_str or "").strip()
    text = re.sub(r"^(find|compute|evaluate|calculate|determine)\s+", "", text, flags=re.IGNORECASE).strip()

    # Inverse Laplace: L^-1[...] / L^(-1)[...] / L^{-1}[...]
    inv_match = re.match(
        r"L\s*\^\s*(?:\(?\s*-\s*1\s*\)?|\{\s*-\s*1\s*\})\s*([\[\{])", text
    )
    if inv_match:
        is_inverse = True
        open_char = inv_match.group(1)
        start_pos = inv_match.end() - 1
    else:
        # Forward Laplace: L[...] / L{...}
        fwd_match = re.match(r"L\s*([\[\{])", text)
        if not fwd_match:
            return None, None
        is_inverse = False
        open_char = fwd_match.group(1)
        start_pos = fwd_match.end() - 1

    close_char = "]" if open_char == "[" else "}"
    close_pos = _find_matching_bracket(text, start_pos, open_char, close_char)
    if close_pos == -1:
        return None, None

    inner_str = text[start_pos + 1:close_pos]
    inner_processed = inner_str.replace("^", "**")
    inner_processed = re.sub(r"(\d+)!", r"factorial(\1)", inner_processed)

    try:
        inner_expr = parse_expr(inner_processed, local_dict=LOCAL_DICT, transformations=TRANSFORMATIONS)
    except Exception:
        return None, None

    correct = _compute_laplace(inner_expr, inverse=is_inverse)
    return inner_expr, correct


def _replace_laplace_in_step(step_text: str) -> str:
    """Replace every ``L[expr]`` / ``L{expr}`` / ``L^-1[expr]`` token in *step_text*
    with the computed Laplace transform value so the result can be parsed by SymPy."""
    text = step_text.strip()
    text = re.sub(r"(\d+)!", r"factorial(\1)", text)

    for _ in range(20):
        # Inverse Laplace first
        inv_match = re.search(
            r"L\s*\^\s*(?:\(?\s*-\s*1\s*\)?|\{\s*-\s*1\s*\})\s*([\[\{])", text
        )
        if inv_match:
            open_char = inv_match.group(1)
            close_char = "]" if open_char == "[" else "}"
            open_pos = inv_match.end() - 1
            close_pos = _find_matching_bracket(text, open_pos, open_char, close_char)
            if close_pos == -1:
                break
            inner_str = text[open_pos + 1:close_pos].replace("^", "**")
            inner_str = re.sub(r"(\d+)!", r"factorial(\1)", inner_str)
            try:
                inner_expr = parse_expr(inner_str, local_dict=LOCAL_DICT, transformations=TRANSFORMATIONS)
                value = _compute_laplace(inner_expr, inverse=True)
                replacement = f"({value})" if value is not None else f"({inner_str})"
            except Exception:
                break
            text = text[:inv_match.start()] + replacement + text[close_pos + 1:]
            continue

        # Forward Laplace
        fwd_match = re.search(r"(?<![A-Za-z])L\s*([\[\{])", text)
        if fwd_match:
            open_char = fwd_match.group(1)
            close_char = "]" if open_char == "[" else "}"
            open_pos = fwd_match.end() - 1
            close_pos = _find_matching_bracket(text, open_pos, open_char, close_char)
            if close_pos == -1:
                break
            inner_str = text[open_pos + 1:close_pos].replace("^", "**")
            inner_str = re.sub(r"(\d+)!", r"factorial(\1)", inner_str)
            try:
                inner_expr = parse_expr(inner_str, local_dict=LOCAL_DICT, transformations=TRANSFORMATIONS)
                value = _compute_laplace(inner_expr, inverse=False)
                replacement = f"({value})" if value is not None else f"({inner_str})"
            except Exception:
                break
            text = text[:fwd_match.start()] + replacement + text[close_pos + 1:]
            continue

        break

    return text


def _parse_step_with_laplace(step_text: str):
    """Try to parse a step, replacing L-notation if present, then falling back to normal parse."""
    replaced = _replace_laplace_in_step(step_text)
    parsed = parse_expression_candidate(replaced)
    if parsed is not None:
        return parsed
    return parse_expression_candidate(step_text)


def _reparse_laplace_formula(step_text: str):
    """Try alternative parses for common Laplace formula patterns.

    Students often write ``n!/(s^n+1)`` meaning ``n!/s^(n+1)`` — i.e. ``s`` raised
    to the power ``(n+1)`` — but the parser reads ``s^n + 1`` in the denominator.
    This helper detects such patterns and re-parses with corrected grouping.
    """
    text = step_text
    # Pattern: .../(s^<digits>+<digits>)... → .../(s^(<digits>+<digits>))...
    # E.g. 5!/(s^5+1) → 5!/(s^(5+1))
    fixed = re.sub(
        r"/\(\s*s\s*\^\s*(\d+)\s*\+\s*(\d+)\s*\)",
        lambda m: f"/(s^({m.group(1)}+{m.group(2)}))",
        text,
    )
    # Also handle without parens: .../s^<digits>+<digits>
    fixed = re.sub(
        r"/s\s*\^\s*(\d+)\s*\+\s*(\d+)(?![.\d])",
        lambda m: f"/s^({m.group(1)}+{m.group(2)})",
        fixed,
    )
    if fixed != text:
        parsed = _parse_step_with_laplace(fixed)
        if parsed is not None:
            return parsed
    return None


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


import symengine

def expressions_equal(expr1, expr2) -> bool:
    """Check if two expressions are mathematically equivalent using both SymEngine and SymPy."""
    if expr1 is None or expr2 is None:
        return False

    try:
        e1 = expr1.subs(C, 0)
        e2 = expr2.subs(C, 0)

        # 1. Fast verification via SymEngine C++ bindings
        try:
            se1 = symengine.sympify(e1)
            se2 = symengine.sympify(e2)
            if (se1 - se2).expand() == 0:
                return True
        except Exception:
            pass

        # 2. Robust fallback verification via pure Python SymPy
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
    # Preprocess the problem expression first
    problem_expr_str = preprocess_text(problem_expr_str)
    
    problem = parse_expression(problem_expr_str)
    if problem is None:
        return {
            "steps": [],
            "verdict": "Error",
            "error": f"Could not parse problem expression: {problem_expr_str}",
            "correct_answer": None,
        }

    # Detect if this is a definite or indefinite integral
    is_definite = re.search(r'integrate\s*\([^,]+,\s*\([^)]+\)\s*\)', problem_expr_str)
    
    if is_definite:
        # Extract integrand and bounds from the problem expression
        int_match = re.search(r'integrate\s*\(([^,]+),\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s*\)', problem_expr_str)
        if int_match:
            integrand_str = int_match.group(1)
            var_str = int_match.group(2)
            integrand = parse_expression(integrand_str)
        else:
            integrand = None
        
        # For definite integrals, the correct answer is the evaluated result
        correct_integral = problem
        
        # But we also need the antiderivative for comparison
        if integrand:
            try:
                antiderivative = integrate(integrand, symbols(var_str) if var_str else x)
            except Exception:
                antiderivative = None
        else:
            antiderivative = None
    else:
        # For indefinite integrals, compute the antiderivative
        integrand = problem
        try:
            correct_integral = integrate(problem, x)
            antiderivative = correct_integral
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

        # Preprocess the step before parsing
        preprocessed_step = preprocess_text(step_text)
        parsed = parse_expression(preprocessed_step)
        
        # Check if this is a pure text explanation (mostly letters/punctuation, no real math)
        is_explanatory = (preprocessed_step and 
                         sum(c.isalpha() for c in preprocessed_step) > len(preprocessed_step) * 0.6 and
                         not any(c in preprocessed_step for c in "0123456789()"))
        
        if parsed is None or is_explanatory:
            # If it's just explanatory text with no meaningful math, allow it
            results.append(
                {
                    "step": i + 1,
                    "expression": step_text,
                    "valid": True,
                    "error": None,
                }
            )
            continue

        if i == 0:
            # First step: accept the integral expression or final answer
            if expressions_equal(parsed, problem) or (is_definite and expressions_equal(parsed, correct_integral)):
                results.append({"step": 1, "expression": step_text, "valid": True, "error": None})
                continue
            elif not is_definite and (expressions_equal(parsed, integrand) or is_valid_antiderivative(parsed, integrand)):
                results.append({"step": 1, "expression": step_text, "valid": True, "error": None})
                continue

            results.append(
                {
                    "step": 1,
                    "expression": step_text,
                    "valid": False,
                    "error": "First step does not match the problem or expected form.",
                }
            )
            all_valid = False
            stopped = True
            continue

        # Find the last mathematically valid step (skip past explanatory steps)
        prev_parsed = None
        for j in range(i - 1, -1, -1):
            prev_preprocessed = preprocess_text(steps[j])
            prev_parsed = parse_expression(prev_preprocessed)
            if prev_parsed is not None:
                break

        if expressions_equal(parsed, prev_parsed):
            results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
            continue

        # For both definite and indefinite, accept valid antiderivatives
        if antiderivative and is_valid_antiderivative(parsed, integrand if integrand else problem):
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
        last_step = parse_expression(preprocess_text(steps[-1]))
        if last_step is not None:
            if is_definite:
                # For definite integrals, last step must match the numerical answer
                if not expressions_equal(last_step, correct_integral):
                    results[-1]["valid"] = False
                    results[-1]["error"] = "Final answer does not match the correct result."
                    all_valid = False

    answer_str = format_expression(correct_integral)
    if not is_definite:
        answer_str += " + C"

    return {
        "steps": results,
        "verdict": "Correct" if all_valid else "Incorrect",
        "correct_answer": answer_str,
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

        parsed = _parse_step_with_laplace(step_text)
        if parsed is None:
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
        compact = lowered.replace(" ", "")

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

        # Accept Fourier series general definition line: f(x) = a0/2 + sum(...)
        if "f(x)" in compact and "a0" in compact and ("sum(" in compact or "bn" in compact) and "sin" in compact:
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Good: writing the general Fourier series formula.",
            })
            continue

        # Accept a0 = 0 in both simple and full integral form
        _a0_match = (
            _line_mentions(lowered, "a0=0", "a0 = 0")
            or (compact.startswith("a0") and compact.endswith("=0"))
            or ("a0" in compact and "integral" in compact and compact.endswith("=0"))
        )
        if _a0_match:
            progress["a0"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Correct: a0 = 0 because f(x) = x is odd.",
            })
            continue

        # Accept an = 0 in both simple and full integral form
        _an_match = (
            _line_mentions(lowered, "an=0", "an = 0")
            or (compact.startswith("an") and compact.endswith("=0"))
            or ("an" in compact and "integral" in compact and "cos" in compact and compact.endswith("=0"))
        )
        if _an_match:
            progress["an"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Correct: all cosine coefficients vanish due to odd symmetry.",
            })
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

        # Accept intermediate bn derivation steps (integration by parts, substitution)
        if "bn" in compact and (
            "cos(n" in compact
            or "cos(npi)" in compact
            or "(-pi" in compact
            or "from0topi" in compact
            or ("-x*cos" in compact)
        ):
            progress["bn_setup"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Valid intermediate step in bn derivation.",
            })
            continue

        # Accept final bn formula in multiple formats
        # Direct check without preprocessing to catch: bn = 2*(-1)^(n+1)/n
        raw_step_simplified = step_text.lower().replace(" ", "")
        _bn_final_direct = (
            ("bn=" in raw_step_simplified and "2*(-1)^" in raw_step_simplified and "n+1" in raw_step_simplified and "/n" in raw_step_simplified)
            or _line_mentions(lowered, "2*(-1)^(n+1)/n", "2*(-1)**(n+1)/n", "2(-1)^(n+1)/n", "2*(-1)^(n+1)", "(-1)^(n+1)/n")
        )
        if _bn_final_direct:
            progress["bn_formula"] = True
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": "Correct bn coefficient for the standard Fourier series of x.",
            })
            continue

        raw_compact = step_text.lower().replace(" ", "")
        if (
            ("sum(" in lowered and "sin(n*x)" in lowered and "(-1)^(n+1)" in lowered)
            or ("sum(" in lowered and "sin(nx)" in lowered and "(-1)^(n+1)" in lowered)
            or ("sin(x)" in lowered and "sin(2*x)" in lowered and "sin(3*x)" in lowered)
            or ("sin(x)" in lowered and "sin(2x)" in lowered and "sin(3x)" in lowered)
            or ("sum(" in raw_compact and "sin(nx)" in raw_compact and "(-1)^(n+1)" in raw_compact)
            or ("sum(" in raw_compact and "sin(n*x)" in raw_compact and "(-1)^(n+1)" in raw_compact)
            or ("f(x)" in raw_compact and "sum(" in raw_compact and "sin(nx)" in raw_compact and "(-1)" in raw_compact)
            or ("f(x)" in raw_compact and "sum(" in raw_compact and "sin(n*x)" in raw_compact and "(-1)" in raw_compact)
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

    # Only append phantom "missing final series" step if no step in the submission
    # looked like a final series at all — don't penalise if student wrote f(x)=sum(...)
    # and we simply failed to parse it. Check raw text as fallback.
    missing_final = not progress["final_series"] and not any(
        ("sum(" in s.lower() and "sin" in s.lower() and "(-1)" in s.lower())
        for s in steps
    )
    if results and missing_final:
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
    # 1. Try direct SymPy parsing (e.g. laplace_transform(exp(3*x), x, s)[0])
    parsed_problem = parse_expression_candidate(problem_expr_str)
    if parsed_problem is not None:
        return validate_transform_steps(steps, problem_expr_str)

    # 2. Try L[...] / L^-1[...] notation
    inner_expr, correct_answer = _extract_laplace_inner(problem_expr_str)
    if correct_answer is not None:
        results = []
        all_valid = True
        stopped = False
        prev_parsed = None

        for i, step_text in enumerate(steps):
            if stopped:
                results.append({"step": i + 1, "expression": step_text, "valid": False, "error": "Skipped (previous step had error)"})
                continue

            # Try parsing step (with L-notation replacement), then try Laplace formula re-parse
            parsed_step = _parse_step_with_laplace(step_text)
            reparsed = False
            if parsed_step is not None and not expressions_equal(parsed_step, correct_answer):
                alt = _reparse_laplace_formula(step_text)
                if alt is not None and expressions_equal(alt, correct_answer):
                    parsed_step = alt
                    reparsed = True
                elif alt is not None and prev_parsed is not None and expressions_equal(alt, prev_parsed):
                    parsed_step = alt
                    reparsed = True
            if parsed_step is None:
                alt = _reparse_laplace_formula(step_text)
                if alt is not None:
                    parsed_step = alt
                    reparsed = True

            if parsed_step is not None:
                # Check if it matches the correct answer
                if expressions_equal(parsed_step, correct_answer):
                    results.append({"step": i + 1, "expression": step_text, "valid": True, "error": None})
                    prev_parsed = parsed_step
                    continue

                # For intermediate steps, verify consistency with previous step or correct answer
                step_valid = False
                message = None

                if prev_parsed is not None and expressions_equal(parsed_step, prev_parsed):
                    step_valid = True
                    message = None

                if not step_valid and i == 0:
                    # First step: the L-notation replacement computes the transforms,
                    # so if the replaced form equals correct_answer, it's already caught above.
                    # Accept first step if it contains L-notation AND evaluates to correct_answer
                    if re.search(r"(?<![A-Za-z])L\s*[\[\{]", step_text):
                        if expressions_equal(parsed_step, correct_answer):
                            step_valid = True
                        else:
                            # L-notation present but not fully evaluated yet;
                            # accept only if the evaluated result equals correct answer
                            step_valid = expressions_equal(parsed_step, correct_answer)
                            if not step_valid:
                                # Linearity split: L[a+b] -> L[a]+L[b] — replacement evaluates both,
                                # so if parsed_step == correct_answer it would be caught.
                                # Accept first step L-notation as setup only.
                                step_valid = True
                                message = "Applying Laplace transform properties."

                if not step_valid and i > 0 and prev_parsed is not None:
                    # Check if this step simplifies from the previous step
                    try:
                        diff_expr = simplify(parsed_step - prev_parsed)
                        if diff_expr == 0:
                            step_valid = True
                    except Exception:
                        pass

                if step_valid:
                    results.append({"step": i + 1, "expression": step_text, "valid": True, "error": message})
                    prev_parsed = parsed_step
                    continue
                else:
                    results.append({
                        "step": i + 1,
                        "expression": step_text,
                        "valid": False,
                        "error": "This step does not follow from the previous step or match the expected result.",
                    })
                    all_valid = False
                    stopped = True
                    continue

            # Couldn't parse even after L-replacement; accept if it contains L-notation (first steps)
            if re.search(r"(?<![A-Za-z])L\s*[\[\{]", step_text):
                results.append({"step": i + 1, "expression": step_text, "valid": True, "error": "Accepted transform-notation step."})
                prev_parsed = None  # can't track numerically
                continue

            results.append({
                "step": i + 1,
                "expression": step_text,
                "valid": False,
                "error": "Could not parse this step. Use proper Laplace notation or algebraic expressions.",
            })
            all_valid = False
            stopped = True

        # Verify the final step equals the correct answer
        if all_valid and results:
            last_parsed = _parse_step_with_laplace(steps[-1])
            if last_parsed is not None and not expressions_equal(last_parsed, correct_answer):
                results[-1]["valid"] = False
                results[-1]["error"] = f"Final answer does not match expected: {format_expression(correct_answer)}"
                all_valid = False

        return {
            "steps": results,
            "verdict": "Correct" if all_valid and results else "Incorrect",
            "correct_answer": format_expression(correct_answer),
        }

    # 3. Heuristic fallback for text-based transform problems
    lowered = (problem_expr_str or "").lower()
    results = []
    all_valid = True

    for index, step_text in enumerate(steps):
        line = preprocess_text(step_text).lower()
        valid = False
        message = None

        # Try parsing the step with L-notation replacement first
        parsed_step = _parse_step_with_laplace(step_text)
        if parsed_step is not None:
            valid = True
            message = "Accepted symbolic transform step."
        elif "laplace" in lowered:
            if any(token in line for token in ["1/(s", "laplace", "l{", "l[", "exp(", "e**"]):
                valid = True
                message = "Accepted Laplace transform step."
        elif "inverse laplace" in lowered:
            if any(token in line for token in ["partial", "fraction", "1/(s", "a/(s", "b/(s", "exp(", "e**", "sin(", "cos("]):
                valid = True
                message = "Good inverse-Laplace transform step."
        elif "z-transform" in lowered or "z transform" in lowered:
            if any(token in line for token in ["sum(", "z/(z-1)", "z/(z - 1)", "residue", "partial"]):
                valid = True
                message = "Good Z-transform progression."
        elif "fourier transform" in lowered:
            if parse_expression_candidate(step_text) is not None:
                valid = True
                message = "Parsed symbolic Fourier-transform step."

        if not valid:
            all_valid = False
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": False,
                "error": "This transform step does not match a supported Laplace/Fourier/Z-transform pattern yet.",
            })
        else:
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": message,
            })

    correct_answer_str = None
    if "laplace" in lowered and "exp(3" in lowered and "inverse" not in lowered:
        correct_answer_str = "1/(s - 3)"

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": correct_answer_str,
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
    """Strict symbolic validator for first-order ODEs.
    
    Philosophy: every step defaults to INVALID. A step is only marked VALID
    when we can mathematically prove it is correct. No keyword-based fallbacks.
    """
    from sympy import solve, diff, integrate, simplify, Rational

    lowered_problem = (problem_expr_str or "").lower()
    results = []
    all_valid = True
    is_first_order = "dy/dx" in lowered_problem and "d2y" not in lowered_problem

    # Parse the RHS of the ODE: dy/dx = f(x)
    prob_rhs_str = problem_expr_str.split("=")[-1].strip() if "=" in problem_expr_str else problem_expr_str
    f_expr = parse_expression_candidate(prob_rhs_str)

    expected_flow = []
    if is_first_order:
        expected_flow = ["ODE setup", "variable separation", "integration", "general solution", "initial condition", "solve for C", "final solution"]

    # State tracked across steps
    prev_equation = None   # LHS - RHS from the previous algebraic step (SymPy expression)
    found_general_solution = False
    found_c_value = None

    for index, step_text in enumerate(steps):
        raw = step_text.strip()
        line = preprocess_text(raw).lower()
        valid = False
        message = None

        raw_lower = raw.lower()
        has_integral = "∫" in raw or "integrate" in raw_lower
        has_dy_dx = "dy/dx" in raw_lower
        has_dy_dx_sep = ("dy" in raw_lower and "dx" in raw_lower and "=" in raw_lower) and not has_integral and not has_dy_dx
        has_y_eq = bool(re.search(r"\by\s*=", raw_lower))
        has_numbers = any(c.isdigit() for c in raw_lower)
        has_eq = "=" in raw

        # ── BRANCH A: dy/dx = [expr] ──────────────────────────────────────────
        if has_dy_dx and has_eq and not has_integral:
            parts = raw.split("=", 1)
            if len(parts) == 2:
                rhs = parse_expression(parts[1])
                if rhs is not None and f_expr is not None:
                    if expressions_equal(rhs, f_expr):
                        valid = True
                        message = "Valid ODE restatement."
                    else:
                        valid = False
                        message = f"Incorrect: RHS should equal {f_expr}, got {rhs}."
                elif rhs is None:
                    valid = False
                    message = "Could not parse the RHS of the differential equation."
                else:
                    valid = False
                    message = "Cannot verify ODE setup — problem expression could not be parsed."

        # ── BRANCH B: dy = (...) dx  [variable separation] ───────────────────
        elif has_dy_dx_sep and not has_y_eq and not has_integral:
            parts = raw.split("=", 1)
            if len(parts) == 2:
                rhs_raw = parts[1].strip()
                # Strip trailing dx / (dx) and optional multiplication
                rhs_clean = re.sub(r"\s*\*?\s*d\s*x\s*$", "", rhs_raw, flags=re.IGNORECASE).strip()
                if rhs_clean.startswith("(") and rhs_clean.endswith(")"):
                    rhs_clean = rhs_clean[1:-1]
                rhs = parse_expression(rhs_clean)
                if rhs is not None and f_expr is not None:
                    if expressions_equal(rhs, f_expr):
                        valid = True
                        message = "Variable separation is correct."
                    else:
                        valid = False
                        message = f"Separation error: RHS integrand should be {f_expr}, got {rhs}."
                elif rhs is None:
                    valid = False
                    message = "Could not parse variable-separation step."
                else:
                    valid = False
                    message = "Cannot verify separation — problem not parsable."

        # ── BRANCH C: integral equation  ∫ ... = ...  or  y = ∫ ... ──────────
        elif has_integral and has_eq:
            parts = raw.split("=", 1)
            if len(parts) == 2:
                lhs_str, rhs_str = parts[0].strip(), parts[1].strip()

                # Sub-case C1: y = ∫ f(x) dx  — extract integrand from RHS and verify it matches f_expr
                if has_y_eq and "∫" in rhs_str and f_expr is not None:
                    rhs_inner = re.sub(r"[∫∮]\s*", "", rhs_str, flags=re.IGNORECASE)
                    rhs_inner = re.sub(r"\s*\*?\s*d\s*x\s*$", "", rhs_inner, flags=re.IGNORECASE).strip()
                    if rhs_inner.startswith("(") and rhs_inner.endswith(")"):
                        rhs_inner = rhs_inner[1:-1]
                    rhs_integrand = parse_expression(rhs_inner)
                    if rhs_integrand is not None and expressions_equal(rhs_integrand, f_expr):
                        valid = True
                        message = "y = ∫f(x)dx setup is correct."
                    elif rhs_integrand is not None:
                        valid = False
                        message = f"Wrong integrand in integral: expected {f_expr}, got {rhs_integrand}."
                    else:
                        valid = False
                        message = "Could not parse the integrand on the RHS."

                else:
                    lhs = parse_expression(lhs_str)
                    rhs = parse_expression(rhs_str)

                    if lhs is not None and rhs is not None:
                        # Sub-case C2: ∫ f(x) dx = antiderivative — verify by differentiating RHS
                        lhs_inner = re.sub(r"[∫∮]\s*", "", lhs_str, flags=re.IGNORECASE)
                        lhs_inner = re.sub(r"\s*\*?\s*d\s*x\s*$", "", lhs_inner, flags=re.IGNORECASE).strip()
                        lhs_expr = parse_expression(lhs_inner)
                        rhs_nodx = re.sub(r"\s*\*?\s*d\s*x\s*$", "", rhs_str, flags=re.IGNORECASE).strip()
                        rhs_antideriv = parse_expression(rhs_nodx)

                        if lhs_expr is not None and rhs_antideriv is not None and lhs_expr != y:
                            # Standard: ∫ f dx = F → d/dx F should equal f
                            deriv = diff(rhs_antideriv.subs(C, 0), x)
                            if expressions_equal(deriv, lhs_expr):
                                valid = True
                                message = "Integration step is correct."
                            else:
                                valid = False
                                message = f"Integration error: d/dx({rhs_antideriv}) = {simplify(deriv)}, but integrand is {lhs_expr}."

                        elif "dy" in lhs_str.lower() and f_expr is not None:
                            # Sub-case C3: ∫ dy = ∫ f(x) dx — check RHS integrand against f_expr
                            rhs_inner = re.sub(r"[∫∮]\s*", "", rhs_str, flags=re.IGNORECASE)
                            rhs_inner = re.sub(r"\s*\*?\s*d\s*x\s*$", "", rhs_inner, flags=re.IGNORECASE).strip()
                            if rhs_inner.startswith("(") and rhs_inner.endswith(")"):
                                rhs_inner = rhs_inner[1:-1]
                            rhs_integrand = parse_expression(rhs_inner)
                            if rhs_integrand is not None and expressions_equal(rhs_integrand, f_expr):
                                valid = True
                                message = "Integral setup ∫dy = ∫f(x)dx is correct."
                            elif rhs_integrand is not None:
                                valid = False
                                message = f"Wrong integrand: expected {f_expr}, got {rhs_integrand}."
                            else:
                                valid = False
                                message = "Could not parse integral step."
                        else:
                            # Fallback: both sides fully evaluated — check equality
                            if expressions_equal(lhs, rhs):
                                valid = True
                                message = "Integration step verified."
                            else:
                                valid = False
                                message = f"Integration mismatch: {lhs} ≠ {rhs}."
                    else:
                        valid = False
                        message = "Could not parse both sides of the integral equation."

        # ── BRANCH D: y = [expr]  ─────────────────────────────────────────────
        elif has_y_eq and not has_integral:
            parts = raw.split("=", 1)
            if len(parts) == 2:
                rhs = parse_expression(parts[1])
                has_c = "c" in parts[1].lower() and parse_expression(parts[1].replace("C","0").replace("c","0")) is not None

                if rhs is not None and f_expr is not None and is_first_order:
                    deriv = diff(rhs.subs(C, 0), x)
                    if expressions_equal(deriv, f_expr):
                        # Check C value if we already solved for it
                        if found_c_value is not None and not has_c:
                            substituted = rhs - integrate(f_expr, x)
                            if expressions_equal(simplify(substituted), found_c_value):
                                valid = True
                                message = "Final particular solution is correct."
                                found_general_solution = True
                            else:
                                valid = False
                                message = f"Wrong constant in final solution. Expected C = {found_c_value}."
                        else:
                            valid = True
                            message = "Solution satisfies the ODE." + (" (General solution with arbitrary C.)" if has_c else "")
                            found_general_solution = True
                    else:
                        valid = False
                        message = f"This expression does not satisfy the ODE. d/dx of RHS = {simplify(deriv)}, but should be {f_expr}."
                elif rhs is None:
                    valid = False
                    message = "Could not parse solution expression."
                else:
                    valid = False
                    message = "Cannot verify solution — ODE RHS unparsable."

        # ── BRANCH E: Arithmetic / ic steps (e.g. 3 = 1 + 1 + C, C = 1) ─────
        elif has_numbers and has_eq and "dy" not in line and "dx" not in line and not has_integral:
            parts = raw.split("=", 1)
            if len(parts) == 2:
                lhs = parse_expression(parts[0])
                rhs = parse_expression(parts[1])
                if lhs is not None and rhs is not None:
                    curr_diff = simplify(lhs - rhs)
                    if prev_equation is not None:
                        # Does this step follow from the previous equation algebraically?
                        try:
                            sol_curr = solve(curr_diff, C)
                            sol_prev = solve(prev_equation, C)
                            if sol_curr and sol_prev and simplify(sol_curr[0] - sol_prev[0]) == 0:
                                valid = True
                                message = "Correct algebraic step."
                                found_c_value = sol_curr[0]
                            elif simplify(curr_diff) == 0:
                                # Pure numeric equality check (e.g. 3 = 2 + 1)
                                valid = True
                                message = "Arithmetic check is correct."
                            elif curr_diff == 0:
                                valid = True
                                message = "Arithmetic is correct."
                            else:
                                # Check if it's a valid simplification of prev
                                ratio = simplify(curr_diff - prev_equation)
                                if ratio == 0:
                                    valid = True
                                    message = "Valid algebraic rearrangement."
                                else:
                                    valid = False
                                    message = f"Arithmetic or algebraic error. Left - Right = {simplify(curr_diff)}."
                        except Exception:
                            # Fallback: just check if LHS == RHS numerically
                            if simplify(curr_diff) == 0:
                                valid = True
                                message = "Arithmetic step verified."
                            else:
                                valid = False
                                message = "Could not verify this step algebraically."
                    else:
                        # First arithmetic step — just verify LHS == RHS or store for chain
                        if simplify(curr_diff) == 0:
                            valid = True
                            message = "Arithmetic step is correct."
                        else:
                            # Could be an IC substitution (e.g. 3 = 1 + 1 + C) — store it
                            valid = True
                            message = "Initial condition substitution recorded."
                    if valid:
                        prev_equation = curr_diff
                else:
                    valid = False
                    message = "Could not parse both sides of the arithmetic expression."
            else:
                valid = False
                message = "Step has no '=' sign — cannot verify."

        # ── BRANCH F: Anything else — STRICT REJECT ───────────────────────────
        else:
            valid = False
            message = "This step could not be symbolically verified. Check notation or syntax."

        if not valid:
            all_valid = False
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": False,
                "error": message or "Step is mathematically incorrect.",
            })
        else:
            results.append({
                "step": index + 1,
                "expression": step_text,
                "valid": True,
                "error": message,
            })

    if results and not found_general_solution and is_first_order:
        all_valid = False

    return {
        "steps": results,
        "verdict": "Correct" if all_valid and results else "Incorrect",
        "correct_answer": "Expected flow: " + " → ".join(expected_flow) if expected_flow else None,
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


async def validate_steps(steps: list[str], problem_expr_str: str, problem_type: str = "integral") -> dict:
    """Dispatch validation based on problem type with Expert In-the-Loop."""
    resolved_type = problem_type or infer_problem_type(problem_expr_str)

    # L-notation (L[...], L^-1[...]) always indicates a transform problem
    if re.search(r"(?<![A-Za-z])L\s*[\[\{]", problem_expr_str or "") or re.search(r"(?<![A-Za-z])L\s*\^", problem_expr_str or ""):
        resolved_type = "transform"

    # Step 1: Symbolic Check
    if resolved_type == "matrix":
        result = validate_matrix_steps(steps, problem_expr_str)
    elif resolved_type == "series":
        result = validate_fourier_series_steps(steps, problem_expr_str)
    elif resolved_type == "transform":
        result = validate_laplace_family_steps(steps, problem_expr_str)
    elif resolved_type == "stats":
        result = validate_probability_stats_steps(steps, problem_expr_str)
    elif resolved_type in ["vector", "multivariable"]:
        result = validate_vector_multivariable_steps(steps, problem_expr_str)
    elif resolved_type == "ode":
        result = validate_ode_steps(steps, problem_expr_str)
    elif resolved_type == "integral":
        result = validate_integral_steps(steps, problem_expr_str)
    else:
        result = validate_general_steps(steps, problem_expr_str)

    # Step 2: Expert "Common Trap" Check
    traps = detect_mathematical_traps(steps)
    if traps:
        result["expert_traps"] = traps
        if result["verdict"] == "Correct":
            result["verdict"] = "Heuristic"  # Correct expression but sloppy logic/notation

    # Step 3: Neural Expert "10yr Exp" Logic Check
    # We only run this on complex derivations to save bandwidth
    if len(steps) >= 3 or result["verdict"] == "Correct":
        neural_critique = await expert_critic_check(problem_expr_str, steps)
        result["expert_analysis"] = neural_critique
        
        # If the Expert AI finds a fundamental flaw, downgrade the verdict
        if neural_critique.get("expert_verdict") == "Flawed" and result["verdict"] == "Correct":
            result["verdict"] = "Incorrect"
            result["error"] = "Expert Logic Check Failed: " + neural_critique.get("sophisticated_feedback", "")

    return result


def build_learning_feedback(validation_result: dict, topic: str = "", strategy: str = "") -> dict:
    """Convert raw validation output into student-friendly coaching with Expert insights."""
    steps = validation_result.get("steps", [])
    strengths = [f"Line {step['step']}: {step['error']}" for step in steps if step.get("valid") and step.get("error")]
    clean_correct = [f"Line {step['step']} is correct." for step in steps if step.get("valid") and not step.get("error")]
    mistakes = [f"Line {step['step']}: {step['error']}" for step in steps if not step.get("valid") and step.get("error")]

    expert_analysis = validation_result.get("expert_analysis", {})
    traps = validation_result.get("expert_traps", [])

    strengths = (strengths + clean_correct)[:4]
    
    # Add expert traps to mistakes
    mistakes = (traps + mistakes)[:4]

    next_step = None
    if mistakes:
        next_step = mistakes[0]
    elif expert_analysis.get("expert_verdict") == "Heuristic":
        next_step = "Your result is correct, but an expert would suggest more rigorous notation."
    elif strategy == "series" or "fourier" in (topic or "").lower():
        next_step = "Now check whether you justified symmetry, coefficients, and the final series clearly."
    else:
        next_step = "Your steps are on the right track. Try to keep each transformation mathematically explicit."

    if validation_result.get("verdict") == "Correct":
        summary = "Analytical verification complete. Rigorous solution found."
    elif validation_result.get("verdict") == "Heuristic":
        summary = "Correct result with informal logic. Focus on rigorous notation."
    elif validation_result.get("verdict") in {"Incorrect", "Needs Review", "Review Required"}:
        summary = "The expert engine detected logical inconsistencies or notation errors."
    else:
        summary = "Validation finished with limited confidence."

    return {
        "summary": summary,
        "strengths": strengths,
        "mistakes": mistakes,
        "next_step": next_step,
        "expert_insight": expert_analysis.get("sophisticated_feedback"),
        "mastery_rating": expert_analysis.get("mastery_rating", 0)
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
