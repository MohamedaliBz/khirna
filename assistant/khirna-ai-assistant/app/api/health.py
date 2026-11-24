from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/api/health")
async def health(request: Request):
    groq = request.app.state.groq
    rag = request.app.state.rag
    return {
        "status": "ok",
        "rag_ready": bool(rag.retriever.store.documents),
        "groq_configured": groq.configured,
        "version": "1.0.0",
    }
