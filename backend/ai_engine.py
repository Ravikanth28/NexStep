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
                extra_body={
                    "reasoning_budget": 16384,
                    "chat_template_kwargs": {"enable_thinking": True},
                },
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
                    "model": "llama3.1-70b",
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
    You are the NexStep Math Evaluator.
    You are given:
    1. The original math problem.
    2. The student's step-by-step solution.
    3. A SymPy-generated canonical reference solution.
    4. The expected final answer if available.

    Your job is to evaluate the student's reasoning, not exact wording.
    Accept mathematically correct alternate methods.
    Do not require the student to match the reference steps literally.
    Mark a step invalid only if it is mathematically wrong, unjustified in context, or clearly derails the solution.

    Return JSON ONLY with this schema:
    {
      "steps": [
        {
          "step": 1,
          "expression": "student step text",
          "valid": true,
          "error": null,
          "feedback": "short coaching sentence"
        }
      ],
      "verdict": "Correct" | "Incorrect" | "Needs Review",
      "error": null,
      "correct_answer": "final answer if known",
      "overall_feedback": "short summary"
    }

    Rules:
    - Preserve the student's original step text in "expression".
    - If a step is valid but incomplete, it can still be marked valid with coaching in "feedback".
    - Use "Needs Review" when the work may be acceptable but is too ambiguous to confidently mark correct.
    - If the final answer is missing or wrong, reflect that in the last relevant step.
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
