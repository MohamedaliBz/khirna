# Groq

Groq fournit une API d'inférence. Le projet ne sait pas quel modèle est disponible
sur votre compte ; `GROQ_MODEL` doit donc être défini explicitement.

Ne testez pas une clé dans le frontend. Placez-la dans `.env` côté serveur.

En cas d'absence de clé ou de modèle :

- `/api/chat` répond avec le mode RAG local ;
- `/api/health` indique `groq_configured: false`;
- `/api/chat/stream` diffuse la réponse locale en un seul événement.

Le mode local n'utilise pas un LLM ; il fournit un extrait documentaire
honêtement identifié comme tel.
