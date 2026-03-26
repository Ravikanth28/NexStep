import json
import re
from dataclasses import dataclass


SUBJECTS = [
    {
        "subject": "Engineering Mathematics I",
        "topic": "Matrices",
        "units": [
            "Rank of a Matrix",
            "Systems of Linear Equations",
            "Characteristic Equation",
            "Cayley Hamilton Theorem",
            "Eigen Values and Eigen Vectors",
            "Diagonalization of Matrices",
        ],
        "keywords": [
            "matrix",
            "matrices",
            "determinant",
            "eigen",
            "characteristic equation",
            "cayley",
            "rank",
            "diagonalization",
        ],
        "strategy": "matrix",
    },
    {
        "subject": "Engineering Mathematics I",
        "topic": "Differential Equations",
        "units": [
            "Linear Differential Equations",
            "Euler's Linear Equation",
            "Variation of Parameters",
        ],
        "keywords": [
            "differential equation",
            "ode",
            "dy/dx",
            "d2y",
            "auxiliary equation",
            "variation of parameters",
            "euler",
        ],
        "strategy": "ode",
    },
    {
        "subject": "Engineering Mathematics I",
        "topic": "Functions of Several Variables",
        "units": [
            "Partial Derivatives",
            "Total Derivatives",
            "Maxima and Minima",
            "Lagrange's Method of Multipliers",
        ],
        "keywords": [
            "partial derivative",
            "total derivative",
            "maxima",
            "minima",
            "lagrange multiplier",
            "multivariable",
        ],
        "strategy": "multivariable",
    },
    {
        "subject": "Engineering Mathematics I",
        "topic": "Multiple Integrals",
        "units": [
            "Double Integrals",
            "Triple Integrals",
            "Change of Order of Integration",
            "Area and Volume Applications",
        ],
        "keywords": [
            "double integral",
            "triple integral",
            "change of order",
            "area",
            "volume",
            "integral",
        ],
        "strategy": "integral",
    },
    {
        "subject": "Engineering Mathematics I",
        "topic": "Vector Calculus",
        "units": [
            "Gradient",
            "Divergence",
            "Curl",
            "Directional Derivatives",
            "Gauss Divergence Theorem",
            "Stokes Theorem",
        ],
        "keywords": [
            "gradient",
            "divergence",
            "curl",
            "directional derivative",
            "gauss",
            "stokes",
            "vector",
            "del",
        ],
        "strategy": "vector",
    },
    {
        "subject": "Engineering Mathematics II",
        "topic": "Fourier Series",
        "units": [
            "Dirichlet's Conditions",
            "Odd and Even Functions",
            "Half Range Sine and Cosine Series",
            "Parseval's Identity",
        ],
        "keywords": [
            "fourier series",
            "half range",
            "parseval",
            "odd and even",
            "trigonometric series",
        ],
        "strategy": "series",
    },
    {
        "subject": "Engineering Mathematics II",
        "topic": "Fourier Transforms",
        "units": [
            "Fourier Transforms and Inverse",
            "Properties",
            "Fourier Sine and Cosine Transforms",
        ],
        "keywords": [
            "fourier transform",
            "inverse fourier",
            "fourier sine",
            "fourier cosine",
        ],
        "strategy": "transform",
    },
    {
        "subject": "Engineering Mathematics II",
        "topic": "Laplace Transforms",
        "units": [
            "Elementary Functions",
            "Periodic Functions",
            "Basic Properties",
            "Initial and Final Value Theorems",
        ],
        "keywords": [
            "laplace",
            "initial value theorem",
            "final value theorem",
            "periodic function",
        ],
        "strategy": "transform",
    },
    {
        "subject": "Engineering Mathematics II",
        "topic": "Inverse Laplace Transforms",
        "units": [
            "Definition",
            "Convolution Theorem",
            "Solution of ODE using Laplace",
        ],
        "keywords": [
            "inverse laplace",
            "convolution theorem",
            "partial fraction",
        ],
        "strategy": "transform",
    },
    {
        "subject": "Engineering Mathematics II",
        "topic": "Z-Transforms",
        "units": [
            "Elementary Properties",
            "Inverse Z-Transforms",
            "Difference Equations using Z-Transform",
        ],
        "keywords": [
            "z transform",
            "inverse z",
            "difference equation",
            "residues",
        ],
        "strategy": "transform",
    },
    {
        "subject": "Probability and Statistics",
        "topic": "Probability",
        "units": [
            "Sample Space",
            "Axioms of Probability",
            "Conditional Probability",
            "Total Probability",
            "Bayes Theorem",
        ],
        "keywords": [
            "probability",
            "sample space",
            "conditional probability",
            "bayes",
            "total probability",
            "event",
            "p(",
        ],
        "strategy": "stats",
    },
    {
        "subject": "Probability and Statistics",
        "topic": "Random Variables",
        "units": [
            "Moments",
            "MGF",
            "Binomial Distribution",
            "Poisson Distribution",
            "Exponential Distribution",
            "Normal Distribution",
        ],
        "keywords": [
            "random variable",
            "mgf",
            "moment",
            "binomial",
            "poisson",
            "normal distribution",
            "exponential distribution",
            "mean",
            "variance",
        ],
        "strategy": "stats",
    },
    {
        "subject": "Probability and Statistics",
        "topic": "Design of Experiments",
        "units": [
            "ANOVA",
            "Correlation",
            "Rank Correlation",
            "Regression",
        ],
        "keywords": [
            "anova",
            "correlation",
            "regression",
            "rank correlation",
        ],
        "strategy": "stats",
    },
    {
        "subject": "Probability and Statistics",
        "topic": "Hypothesis Testing",
        "units": [
            "Large Samples",
            "Small Samples",
            "t-test",
            "F-test",
            "Chi-Square Tests",
        ],
        "keywords": [
            "test of mean",
            "t test",
            "f test",
            "chi square",
            "goodness of fit",
            "independence of attributes",
            "large samples",
            "small samples",
        ],
        "strategy": "stats",
    },
]


def _tokenize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def infer_difficulty(text: str) -> str:
    lowered = _tokenize(text)
    if any(keyword in lowered for keyword in ["prove", "theorem", "derive", "convolution", "parseval", "variation of parameters", "chi square", "regression", "z transform"]):
        return "hard"
    if any(keyword in lowered for keyword in ["find", "solve", "laplace", "fourier", "eigen", "determinant", "conditional probability"]):
        return "medium"
    return "easy"


@dataclass
class QuestionAnalysis:
    subject: str
    topic: str
    unit_name: str
    strategy: str
    difficulty: str
    concept_tags: list[str]
    confidence: float

    def to_dict(self):
        return {
            "subject": self.subject,
            "topic": self.topic,
            "unit_name": self.unit_name,
            "strategy": self.strategy,
            "difficulty": self.difficulty,
            "concept_tags": self.concept_tags,
            "confidence": self.confidence,
        }


def analyze_question_text(title: str, problem_expr: str, teacher_topic: str | None = None) -> QuestionAnalysis:
    source = _tokenize(f"{title} {problem_expr} {teacher_topic or ''}")
    best_match = None
    best_score = 0

    for entry in SUBJECTS:
        score = sum(1 for keyword in entry["keywords"] if keyword in source)
        if teacher_topic and teacher_topic.lower() == entry["topic"].lower():
            score += 3

        if score > best_score:
            best_score = score
            best_match = entry

    if best_match is None:
        best_match = {
            "subject": "Engineering Mathematics",
            "topic": teacher_topic or "General Mathematics",
            "units": ["General Problem Solving"],
            "strategy": "integral" if "integral" in source else "general",
        }

    matched_tags = []
    for keyword in best_match.get("keywords", []):
        if keyword in source and keyword not in matched_tags:
            matched_tags.append(keyword)

    units = best_match.get("units", [])
    unit_name = units[0] if units else "General Problem Solving"
    for candidate in units:
        if _tokenize(candidate) in source:
            unit_name = candidate
            break

    confidence = min(0.99, 0.35 + (best_score * 0.12))

    return QuestionAnalysis(
        subject=best_match["subject"],
        topic=best_match["topic"],
        unit_name=unit_name,
        strategy=best_match["strategy"],
        difficulty=infer_difficulty(source),
        concept_tags=matched_tags[:6],
        confidence=round(confidence, 2),
    )


def build_validation_notes(analysis: QuestionAnalysis) -> list[str]:
    notes = [
        f"Detected topic: {analysis.topic}",
        f"Suggested validation strategy: {analysis.strategy}",
    ]

    if analysis.concept_tags:
        notes.append(f"Concept tags: {', '.join(analysis.concept_tags)}")

    if analysis.strategy in {"general", "series"}:
        notes.append("This question may need partial-credit or final-answer validation if symbolic step inference is ambiguous.")

    return notes


def serialize_concept_tags(tags: list[str]) -> str:
    return json.dumps(tags or [])


def deserialize_concept_tags(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []
    try:
        value = json.loads(raw_value)
        return value if isinstance(value, list) else []
    except Exception:
        return []
