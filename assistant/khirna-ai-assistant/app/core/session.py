from collections import defaultdict, deque
from threading import Lock
from time import time


class ConversationStore:
    def __init__(self, max_messages: int = 40, ttl_seconds: int = 24 * 60 * 60):
        self.max_messages = max_messages
        self.ttl_seconds = ttl_seconds
        self._messages: dict[str, deque] = defaultdict(lambda: deque(maxlen=max_messages))
        self._timestamps: dict[str, float] = {}
        self._lock = Lock()

    def _expired(self, session_id: str) -> bool:
        return time() - self._timestamps.get(session_id, 0) > self.ttl_seconds

    def add(self, session_id: str, role: str, content: str) -> None:
        with self._lock:
            if self._expired(session_id):
                self._messages[session_id].clear()
            self._messages[session_id].append({"role": role, "content": content})
            self._timestamps[session_id] = time()

    def get(self, session_id: str) -> list[dict]:
        with self._lock:
            if self._expired(session_id):
                self._messages.pop(session_id, None)
                self._timestamps.pop(session_id, None)
                return []
            return list(self._messages[session_id])

    def clear(self, session_id: str) -> None:
        with self._lock:
            self._messages.pop(session_id, None)
            self._timestamps.pop(session_id, None)
