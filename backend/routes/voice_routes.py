import os
import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

router = APIRouter(prefix="/api/voice", tags=["voice"])


ALLOWED_LANGUAGES = {"en-IN", "ta-IN", "hi-IN", "te-IN", "kn-IN", "ml-IN", "mr-IN", "bn-IN"}
ALLOWED_SPEAKERS = {
    "ritu", "priya", "neha", "rahul", "aditya", "rohan", "pooja", "simran",
    "kavya", "amit", "dev", "ishita", "shreya", "ratan", "varun", "manan",
}


class TTSRequest(BaseModel):
    text: str
    speaker: str = "ritu"
    pace: float = 1.0
    language: str = "en-IN"


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """Proxy TTS request to Sarvam AI. Returns base64-encoded WAV audio."""
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="Sarvam API key not configured")

    # Sanitize inputs to prevent injection
    language = req.language if req.language in ALLOWED_LANGUAGES else "en-IN"
    speaker = req.speaker if req.speaker in ALLOWED_SPEAKERS else "ritu"

    # Sarvam TTS has a 2500 char limit per request; truncate gracefully
    text = req.text[:2500]

    payload = {
        "text": text,
        "target_language_code": language,
        "speaker": speaker,
        "pace": max(0.5, min(2.0, req.pace)),
        "model": "bulbul:v3",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            SARVAM_TTS_URL,
            json=payload,
            headers={"api-subscription-key": SARVAM_API_KEY},
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Sarvam TTS error: {response.text}",
        )

    data = response.json()
    audios = data.get("audios", [])
    if not audios:
        raise HTTPException(status_code=500, detail="Sarvam returned no audio")

    return JSONResponse({"audio_b64": audios[0]})


@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
    """Proxy STT request to Sarvam AI. Returns transcript string."""
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="Sarvam API key not configured")

    audio_bytes = await file.read()

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            SARVAM_STT_URL,
            headers={"api-subscription-key": SARVAM_API_KEY},
            files={"file": (file.filename or "audio.wav", audio_bytes, file.content_type or "audio/wav")},
            data={"model": "saarika:v2.5", "language_code": "en-IN"},
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Sarvam STT error: {response.text}",
        )

    data = response.json()
    transcript = data.get("transcript", "")
    return JSONResponse({"transcript": transcript})
