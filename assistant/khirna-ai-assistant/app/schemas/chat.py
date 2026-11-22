from typing import Literal

from pydantic import BaseModel, Field


Language = Literal["fr", "ar", "tn"]
Role = Literal["citizen", "farmer_t1", "farmer_t2", "state_agent", "admin", "visitor"]


class Source(BaseModel):
    filename: str
    section: str
    content: str
    score: float


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(default="default", min_length=1, max_length=128)
    language: Language = "fr"
    user_role: Role = "visitor"


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = []
    session_id: str
    provider: str
    token_usage: dict | None = None
