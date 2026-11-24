from app.core.session import ConversationStore


def test_conversation_history_and_clear():
    sessions = ConversationStore()
    sessions.add("a", "user", "Bonjour")
    sessions.add("a", "assistant", "Bonjour, comment puis-je aider ?")
    assert len(sessions.get("a")) == 2
    sessions.clear("a")
    assert sessions.get("a") == []
