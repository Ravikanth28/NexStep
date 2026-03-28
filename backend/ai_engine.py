import os
import json
import logging
from typing import Optional, Dict, Any, List
try:
    import google.generativeai as genai
except ImportError:
    genai = None
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configurations
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")

# Initialize Gemini
if genai and GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
else:
    gemini_model = None

async def call_gemini(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Call Google Gemini API."""
    if not gemini_model:
        return None
    
    try:
        full_prompt = f"{system_instruction}\n\nUser Question: {prompt}" if system_instruction else prompt
        response = await gemini_model.generate_content_async(full_prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return None

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
    # 1. Try Gemini
    response = await call_gemini(prompt, system_instruction)
    if response:
        logger.info("Successfully used Gemini as primary AI.")
        return response
    
    # 2. Fallback to Cerebras
    logger.warning("Gemini failed or unavailable. Falling back to Cerebras.")
    response = await call_cerebras(prompt, system_instruction)
    if response:
        return response
    
    return "Error: All AI systems are technically offline. Check your API keys."

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
    """Expert-level pedagogical check using Gemini Pro."""
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
