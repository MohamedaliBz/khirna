from fastapi.testclient import TestClient

from app.main import app


class UnexpectedGroqCall:
    configured = True

    async def generate(self, *_args, **_kwargs):
        raise AssertionError("Groq ne doit pas être appelé sans source documentaire.")

    async def stream(self, *_args, **_kwargs):
        raise AssertionError("Groq ne doit pas être appelé sans source documentaire.")


def test_health_and_unknown_question():
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        response = client.post("/api/chat", json={
            "session_id": "test-session",
            "message": "Quelle est la recette secrète du directeur ?",
            "language": "fr",
            "user_role": "visitor",
        })
        assert response.status_code == 200
        body = response.json()
        assert body["provider"] in {"groq", "local_fallback", "groq_error"}
        assert "recette" not in body["answer"].lower() or "documents" in body["answer"].lower()

        gui = client.get("/chat-ui")
        assert gui.status_code == 200
        assert "KHIRNA Assistant" in gui.text


def test_chat_uses_default_without_sources_even_when_groq_is_configured(monkeypatch):
    with TestClient(app) as client:
        monkeypatch.setattr(client.app.state.rag, "get_context", lambda _query: ("", []))
        monkeypatch.setattr(client.app.state, "groq", UnexpectedGroqCall())
        payload = {
            "session_id": "out-of-scope-session",
            "message": "Quelle est la capitale du Japon ?",
            "language": "fr",
            "user_role": "visitor",
        }

        response = client.post("/api/chat", json=payload)

        assert response.status_code == 200
        assert response.json()["provider"] == "local_fallback"
        assert response.json()["sources"] == []
        assert "documents KHIRNA" in response.json()["answer"]

        stream = client.post("/api/chat/stream", json=payload)

        assert stream.status_code == 200
        assert "event: delta" in stream.text
        assert "documents KHIRNA" in stream.text
