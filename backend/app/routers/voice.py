from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.config import SUPPORTED_LANGUAGES
from app.models.schemas import TTSRequest, VoiceSTTResponse
from app.services.llm_service import llm_service
from app.services.voice_service import voice_service

router = APIRouter(prefix="/api/voice", tags=["Multilingual Voice Agent"])


@router.post("/tts")
async def text_to_speech(payload: TTSRequest):
    if payload.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported language '{payload.language}'. Choose from {list(SUPPORTED_LANGUAGES)}.",
        )
    if not payload.text.strip():
        raise HTTPException(status_code=422, detail="Text is required for speech synthesis.")
    try:
        audio_bytes = await voice_service.synthesize(payload.text, payload.language)
        if not audio_bytes:
            raise HTTPException(status_code=503, detail="No audio generated.")
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Voice synthesis unavailable: {exc}") from exc


@router.post("/stt", response_model=VoiceSTTResponse)
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form("te"),
):
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")
    mime = audio.content_type or "audio/webm"
    transcript = llm_service.transcribe_audio(audio_bytes, mime, language)
    if not transcript:
        raise HTTPException(status_code=503, detail="Transcription unavailable.")
    return VoiceSTTResponse(transcript=transcript, language=language)
