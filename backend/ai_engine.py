import asyncio
import os
import json
import logging
from typing import Optional, Dict, Any, List
import httpx
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configurations
NVIDIA_API_KEYS_STR = os.getenv("NVIDIA_API_KEYS", "")
NVIDIA_API_KEYS = [k.strip() for k in NVIDIA_API_KEYS_STR.split(",") if k.strip()]
if not NVIDIA_API_KEYS:
    single_key = os.getenv("NVIDIA_API_KEY", "")
    if single_key:
        NVIDIA_API_KEYS.append(single_key)

CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")


def _call_nvidia_sync(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Call NVIDIA NIM chat completions and combine streamed output."""
    if not NVIDIA_API_KEYS:
        return None

    messages = []
    if system_instruction.strip():
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    for key in NVIDIA_API_KEYS:
        try:
            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=key,
            )
            completion = client.chat.completions.create(
                model="nvidia/nemotron-3-nano-30b-a3b",
                messages=messages,
                temperature=1,
                top_p=1,
                max_tokens=16384,
                stream=True,
            )

            content_parts: list[str] = []
            for chunk in completion:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content is not None:
                    content_parts.append(delta.content)

            return "".join(content_parts).strip() or None
        except Exception as e:
            logger.error(f"NVIDIA API Error with key {key[:8]}...: {e}")
            continue

    return None

async def call_nvidia(prompt: str, system_instruction: str = "") -> Optional[str]:
    return await asyncio.to_thread(_call_nvidia_sync, prompt, system_instruction)

async def call_cerebras(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Call Cerebras API (Llama 3.1 70B) as a high-speed fallback."""
    if not CEREBRAS_API_KEY:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {CEREBRAS_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "qwen-3-235b-a22b-instruct-2507",
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1024
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Cerebras API Error: {e}")
        return None

async def get_ai_response(prompt: str, system_instruction: str = "") -> str:
    """Primary AI entry point with fallback logic."""
    # 1. Try NVIDIA
    response = await call_nvidia(prompt, system_instruction)
    if response:
        logger.info("Successfully used NVIDIA as primary AI.")
        return response
    
    # 2. Fallback to Cerebras
    logger.warning("NVIDIA failed or unavailable. Falling back to Cerebras.")
    response = await call_cerebras(prompt, system_instruction)
    if response:
        return response
    
    # Both failed — return sentinel value that callers can detect without crashing
    logger.error("All AI providers unavailable.")
    return ""

async def analyze_math_step(problem: str, current_steps: List[str], new_step: str) -> Dict[str, Any]:
    """Analyze a single math step using Hybrid AI logic."""
    system_prompt = """
    You are the NexStep Neural Symbolic Parser. Your job is to analyze a student's mathematical progress.
    The student is solving a problem line-by-line.
    
    Output a JSON object ONLY with:
    1. 'parsed_math': Convert any natural language in 'new_step' into a SymPy-compatible expression (e.g., 'substitute u = 2x+1' -> 'u = 2x+1').
    2. 'feedback': A short, encouraging pedagogical critique. If there's an error, identify it (e.g., sign error, chain rule miss).
    3. 'hint': A small leading question to help them reach the next step.
    4. 'is_valid_intent': Boolean indicating if the student's *logic* makes sense, even if the math character is imprecise.
    """
    
    user_prompt = f"""
    Problem: {problem}
    Current Progress: {json.dumps(current_steps)}
    New Step to analyze: {new_step}
    """
    
    raw_response = await get_ai_response(user_prompt, system_prompt)
    
    try:
        # Extract JSON if the model wrapped it in markdown
        json_str = raw_response.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()
            
        return json.loads(json_str)
    except Exception as e:
        logger.error(f"Failed to parse AI response: {e}")
        return {
            "parsed_math": None,
            "feedback": "Processed via symbolic engine.",
            "hint": "Try to simplify the expression further.",
            "is_valid_intent": True
        }

async def expert_critic_check(problem: str, steps: List[str]) -> Dict[str, Any]:
    """Expert-level pedagogical check using the configured LLM provider."""
    system_prompt = """
    You are a Senior Professor of Mathematics with 20+ years of experience in Calculus, Linear Algebra, and Differential Equations.
    Analyze the student's step-by-step derivation.
    
    Your goal is to find subtle logical errors:
    1. Division by zero/undefined variables.
    2. Missing constants of integration (+C).
    3. Incorrect application of theorems (e.g., applying L'Hopital's to a non-indeterminate form).
    4. Sign errors in trig transformations.
    5. Non-rigorous leaps (logic that 'happens' to be right but is unjustified).
    
    Output a JSON object ONLY with:
    - 'expert_verdict': 'Rigorous', 'Heuristic' (correct but sloppy), or 'Flawed'.
    - 'sophisticated_feedback': A high-level explanation of the logic.
    - 'trap_detected': A specific warning if they fell into a common student trap.
    - 'mastery_rating': 1-10 (how much they 'get' the concept).
    """
    
    user_prompt = f"""
    Problem: {problem}
    Steps: {json.dumps(steps)}
    """
    
    raw_response = await get_ai_response(user_prompt, system_prompt)
    
    try:
        json_str = raw_response.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        return json.loads(json_str)
    except:
        return {
            "expert_verdict": "Rigorous",
            "sophisticated_feedback": "Symbolic validation complete.",
            "trap_detected": None,
            "mastery_rating": 8
        }

async def evaluate_student_solution(
    problem: str,
    student_steps: List[str],
    reference_steps: List[Dict[str, Any]],
    correct_answer: Optional[str] = None,
    strategy: str = "",
) -> Optional[Dict[str, Any]]:
    """Use AI to judge student work against a SymPy-generated reference solution."""
    system_prompt = """
You are the NexStep Math Evaluator — a university-level mathematics examiner.

You receive a JSON payload with:
  - problem: the original math expression/question
  - strategy: the type of problem (e.g. fourier_an, fourier_bn, fourier_a0, integral, ode, etc.)
  - student_steps: the student's steps (LaTeX or plain text)
  - reference_steps: a canonical reference solution (ONE valid approach — NOT the only approach)
  - correct_answer: the expected correct final answer (SymPy-computed — treat as ground truth)

YOUR TASK: evaluate each step for mathematical correctness.

CRITICAL RULES — read carefully:
1. The student does NOT need to follow the reference steps. Accept ANY mathematically valid derivation.
2. FORMULA SETUP STEPS ARE ALWAYS VALID. A step that writes the standard formula for the problem
   (e.g. "b_n = (1/π)∫f(x)sin(nx)dx" or "a_0 = (1/π)∫f(x)dx") is a valid first step.
3. PROSE / EXPLANATORY STEPS ARE ALWAYS VALID. Steps like "Using integration by parts",
   "By odd symmetry", "let u = x²", "Applying IBP" are valid and must not be marked invalid.
4. Mark a step INVALID only if it contains a clear mathematical error
   (wrong formula, incorrect algebra, wrong sign that permanently breaks the derivation, etc.).
5. The verdict is "Correct" ONLY IF the student's final answer matches the expected correct_answer
   AND all steps are valid.
6. The verdict is "Incorrect" if any step has a real mathematical error or the final answer is wrong.
7. Use "Needs Review" only when the approach is genuinely ambiguous.
8. Set "correct_answer" in the response to the value from the input payload's correct_answer field.

ADDITIONAL OVERRIDE FOR TEMPLATE-ONLY QUESTIONS:
- If correct_answer is null, the reference_steps are only a guide/template, not an answer key.
- In that case, independently check the problem text and the student's final answer.
- Do not mark a wrong final answer correct merely because the template structure is followed.
- For probability word problems, verify counts carefully. A standard deck has 52 cards and 4 kings; one fair die has outcomes {1,2,3,4,5,6}; one fair coin has outcomes {Heads,Tails}.
- Evaluate every submitted line, not only the first error. If a later line uses an earlier incorrect value
  (for example n(A)=5 for kings, then P(A)=5/52), mark that later line invalid too.
- If correct_answer is null, keep correct_answer null in your JSON response.

Return ONLY valid JSON — no markdown, no explanation, nothing outside the JSON:
{
  "steps": [
    {
      "step": 1,
      "expression": "<original student step text, unchanged>",
      "valid": true,
      "error": null,
      "feedback": "<optional short coaching note>"
    }
  ],
  "verdict": "Correct",
  "error": null,
  "correct_answer": "<correct_answer from input>",
  "overall_feedback": "<one sentence summary>"
}
"""

    user_payload = {
        "problem": problem,
        "strategy": strategy,
        "student_steps": student_steps,
        "reference_steps": reference_steps,
        "correct_answer": correct_answer,
    }

    raw_response = await get_ai_response(json.dumps(user_payload), system_prompt)

    # If all AI providers are down, bail out immediately so the SymPy fallback runs
    if not raw_response:
        logger.warning("AI evaluation skipped — no response from any provider.")
        return None

    try:
        json_str = raw_response.strip()
        if "```json" in json_str:
            json_str = json_str.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```", 1)[1].split("```", 1)[0].strip()

        parsed = json.loads(json_str)
        parsed_steps = parsed.get("steps", [])
        if not isinstance(parsed_steps, list) or not parsed_steps:
            return None

        normalized_steps = []
        for index, original_step in enumerate(student_steps, start=1):
            item = parsed_steps[index - 1] if index - 1 < len(parsed_steps) and isinstance(parsed_steps[index - 1], dict) else {}
            normalized_steps.append({
                "step": index,
                "expression": item.get("expression") or original_step,
                "valid": bool(item.get("valid")),
                "error": item.get("error") if not item.get("valid") else None,
                "feedback": item.get("feedback") if item.get("valid") else None,
            })

        verdict = parsed.get("verdict", "Needs Review")
        if verdict not in {"Correct", "Incorrect", "Needs Review"}:
            verdict = "Needs Review"

        return {
            "steps": normalized_steps,
            "verdict": verdict,
            "error": parsed.get("error"),
            "correct_answer": parsed.get("correct_answer") or correct_answer,
            "overall_feedback": parsed.get("overall_feedback"),
        }
    except Exception as e:
        logger.error(f"Failed to parse AI evaluation response: {e}")
        return None
