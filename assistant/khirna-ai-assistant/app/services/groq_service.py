import json
from typing import AsyncIterator

import httpx

from app.config import Settings


class GroqError(RuntimeError):
    pass


class GroqService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def configured(self) -> bool:
        return bool(self.settings.groq_api_key and self.settings.groq_model)

    async def generate(self, system_prompt: str, messages: list[dict], context: str) -> tuple[str, dict | None]:
        if not self.configured:
            raise GroqError("GROQ_API_KEY ou GROQ_MODEL n'est pas configuré.")

        payload_messages = [{"role": "system", "content": system_prompt}]
        if context:
            payload_messages.append({
                "role": "system",
                "content": f"Contexte documentaire récupéré par RAG:\n{context}",
            })
        payload_messages.extend(messages[-12:])

        payload = {
            "model": self.settings.groq_model,
            "messages": payload_messages,
            "temperature": self.settings.groq_temperature,
            "max_tokens": self.settings.groq_max_tokens,
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=self.settings.groq_timeout_seconds) as client:
            try:
                response = await client.post(
                    self.endpoint,
                    headers={
                        "Authorization": f"Bearer {self.settings.groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise GroqError(f"Groq a refusé la requête ({exc.response.status_code}).") from exc
            except httpx.RequestError as exc:
                raise GroqError("Impossible de joindre Groq.") from exc

        data = response.json()
        answer = data["choices"][0]["message"]["content"]
        usage = data.get("usage")
        return answer, usage

    async def stream(self, system_prompt: str, messages: list[dict], context: str) -> AsyncIterator[str]:
        if not self.configured:
            raise GroqError("GROQ_API_KEY ou GROQ_MODEL n'est pas configuré.")
        payload_messages = [{"role": "system", "content": system_prompt}]
        if context:
            payload_messages.append({
                "role": "system",
                "content": f"Contexte documentaire récupéré par RAG:\n{context}",
            })
        payload_messages.extend(messages[-12:])
        payload = {
            "model": self.settings.groq_model,
            "messages": payload_messages,
            "temperature": self.settings.groq_temperature,
            "max_tokens": self.settings.groq_max_tokens,
            "stream": True,
        }
        async with httpx.AsyncClient(timeout=self.settings.groq_timeout_seconds) as client:
            async with client.stream(
                "POST",
                self.endpoint,
                headers={
                    "Authorization": f"Bearer {self.settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        event = json.loads(data)
                        delta = event["choices"][0]["delta"].get("content")
                        if delta:
                            yield delta
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
