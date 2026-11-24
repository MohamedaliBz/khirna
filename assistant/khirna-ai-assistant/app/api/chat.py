import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.core.prompts import build_system_prompt
from app.core.security import redact_secrets
from app.schemas.chat import ChatRequest, ChatResponse, Source
from app.services.groq_service import GroqError

router = APIRouter()


def build_answer(request: Request, payload: ChatRequest):
    clean_message = redact_secrets(payload.message)
    system = build_system_prompt(payload.user_role, payload.language)
    context, sources = request.app.state.rag.get_context(clean_message)
    history = request.app.state.sessions.get(payload.session_id)
    history_for_model = history + [{"role": "user", "content": clean_message}]
    return system, context, sources, history_for_model


@router.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request):
    system, context, sources, history = build_answer(request, payload)
    groq = request.app.state.groq
    if not sources:
        answer = request.app.state.rag.local_answer(payload.message, sources, payload.language)
        usage = None
        provider = "local_fallback"
    else:
        try:
            answer, usage = await groq.generate(system, history, context)
            provider = "groq"
        except GroqError as exc:
            if groq.configured:
                answer = f"Le fournisseur Groq est temporairement indisponible. {exc}"
            else:
                answer = request.app.state.rag.local_answer(payload.message, sources, payload.language)
            usage = None
            provider = "local_fallback" if not groq.configured else "groq_error"

    request.app.state.sessions.add(payload.session_id, "user", payload.message)
    request.app.state.sessions.add(payload.session_id, "assistant", answer)
    return ChatResponse(
        answer=answer,
        sources=[Source(**source) for source in sources],
        session_id=payload.session_id,
        provider=provider,
        token_usage=usage,
    )


@router.post("/api/chat/stream")
async def chat_stream(payload: ChatRequest, request: Request):
    system, context, sources, history = build_answer(request, payload)
    groq = request.app.state.groq

    async def events():
        for source in sources:
            yield "event: source\ndata: " + json.dumps(source, ensure_ascii=False) + "\n\n"
        if not sources:
            answer = request.app.state.rag.local_answer(payload.message, sources, payload.language)
            yield "event: delta\ndata: " + json.dumps({"text": answer}, ensure_ascii=False) + "\n\n"
        elif groq.configured:
            answer_parts: list[str] = []
            try:
                async for chunk in groq.stream(system, history, context):
                    answer_parts.append(chunk)
                    yield "event: delta\ndata: " + json.dumps({"text": chunk}, ensure_ascii=False) + "\n\n"
            except GroqError as exc:
                chunk = f"\nLe fournisseur Groq est temporairement indisponible. {exc}"
                answer_parts.append(chunk)
                yield "event: delta\ndata: " + json.dumps({"text": chunk}, ensure_ascii=False) + "\n\n"
            answer = "".join(answer_parts)
        else:
            answer = request.app.state.rag.local_answer(payload.message, sources, payload.language)
            yield "event: delta\ndata: " + json.dumps({"text": answer}, ensure_ascii=False) + "\n\n"
        request.app.state.sessions.add(payload.session_id, "user", payload.message)
        request.app.state.sessions.add(payload.session_id, "assistant", answer)
        yield "event: done\ndata: " + json.dumps({"session_id": payload.session_id}, ensure_ascii=False) + "\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")


@router.get("/api/conversations/{session_id}")
async def conversation(session_id: str, request: Request):
    return {
        "session_id": session_id,
        "messages": request.app.state.sessions.get(session_id),
    }


@router.delete("/api/conversations/{session_id}")
async def clear_conversation(session_id: str, request: Request):
    request.app.state.sessions.clear(session_id)
    return {"session_id": session_id, "cleared": True}
