# Référence API

## POST /api/chat

```json
{
  "session_id": "demo-session",
  "message": "Comment investir dans un projet agricole ?",
  "language": "fr",
  "user_role": "citizen"
}
```

Réponse :

```json
{
  "answer": "...",
  "sources": [],
  "session_id": "demo-session",
  "provider": "local_fallback",
  "token_usage": null
}
```

Rôles : `citizen`, `farmer_t1`, `farmer_t2`, `state_agent`, `admin`, `visitor`.

Langues : `fr`, `ar`, `tn`.

## POST /api/chat/stream

Retourne des événements SSE : `source`, `delta`, `done`.

## Conversations

- `GET /api/conversations/{session_id}` : historique
- `DELETE /api/conversations/{session_id}` : suppression

## Voix

- `POST /api/voice/transcribe` : multipart `audio`, champ `language`
- `POST /api/voice/synthesize` : JSON `{"text":"...", "language":"fr"}`

Les implémentations externes sont volontairement remplacables. Sans fournisseur,
les routes vocales serveur répondent par une erreur 501 explicite.
