from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response

from app.services.transcription_service import TranscriptionService
from app.services.tts_service import TtsService

router = APIRouter()


@router.post("/api/voice/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form("fr"),
):
    data = await audio.read()
    try:
        text = TranscriptionService().transcribe(data, audio.content_type or "application/octet-stream", language)
    except NotImplementedError as exc:
        return Response(
            content=str(exc),
            status_code=501,
            media_type="text/plain",
        )
    return {"text": text, "language": language}


@router.post("/api/voice/synthesize")
async def synthesize(payload: dict):
    text = str(payload.get("text", "")).strip()
    language = str(payload.get("language", "fr"))
    if not text:
        return Response(content="text est requis.", status_code=422)
    try:
        audio = TtsService().synthesize(text, language)
    except NotImplementedError as exc:
        return Response(content=str(exc), status_code=501, media_type="text/plain")
    return Response(content=audio, media_type="audio/mpeg")
