from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.api import chat, health, voice
from app.config import get_settings
from app.core.session import ConversationStore
from app.knowledge.ingestion import ingest_directory
from app.knowledge.retriever import Retriever
from app.knowledge.vector_store import VectorStore
from app.services.groq_service import GroqService
from app.services.rag_service import RagService


settings = get_settings()
app = FastAPI(
    title="KHIRNA AI Assistant",
    version="1.0.0",
    description="Assistant vocal et textuel indépendant pour la plateforme KHIRNA.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(health.router)


@app.get("/chat-ui", response_class=HTMLResponse)
async def chat_ui():
    html_path = Path(__file__).resolve().parents[1] / "static" / "index.html"
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@app.on_event("startup")
async def startup():
    root = Path(__file__).resolve().parents[1]
    store = VectorStore(str(root / "knowledge_base" / "processed"))
    if not store.load():
        documents = ingest_directory(str(root / "knowledge_base" / "documents"))
        store.build(documents)
    retriever = Retriever(store)
    app.state.rag = RagService(retriever)
    app.state.groq = GroqService(settings)
    app.state.sessions = ConversationStore()
