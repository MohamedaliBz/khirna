# Architecture

## Modules

### API FastAPI
`app/api` expose le contrat HTTP. Chaque route valide une requête Pydantic avant
de lancer le traitement. Les erreurs externes sont distinguées des réponses locales.

### Prompts et sessions
`app/core/prompts.py` construit l'identité, le rôle et la langue. Une mauvaise
source ou une source absente ne permet pas de conclure sur une politique KHIRNA.
`app/core/session.py` conserve jusqu'à 40 messages par session pendant 24 heures.

### Ingestion
`app/knowledge/ingestion.py` lit les Markdown/TXT, identifie les titres comme
section, puis découpe chaque partie en blocs d'environ 1200 caractères.

### Recherche
`app/knowledge/vector_store.py` construit un index TF-IDF local. Cette première
version évite une dépendance à un fournisseur d'embeddings. Le nom `vector_store`
reste stable afin qu'une future implémentation FAISS ou Chroma puisse remplacer
cette classe sans changer le reste de l'application.

### RAG
`app/knowledge/retriever.py` calcule la similarité cosinus entre la question et
les blocs. `app/services/rag_service.py` assemble le contexte et fournit le
mode de secours local. Chaque passage retourné contient son fichier, sa section,
son contenu et un score.

### Groq
`groq_service.py` envoie le prompt système, l'historique récent et le contexte
RAG à l'endpoint compatible OpenAI de Groq. Il prend aussi en charge un flux SSE.
La clé ne quitte jamais le serveur.

### Flux textuel
```text
message utilisateur
→ validation Pydantic
→ nettoyage secret
→ retrieval
→ historique
→ Groq ou réponse locale
→ ajout historique
→ réponse JSON
```

### Flux vocal navigateur
Le microphone appartient au navigateur. `Web Speech API` produit une
transcription côté client. Le widget envoie ensuite la transcription à
`POST /api/chat`. La réponse peut être lue par `SpeechSynthesis`. Cette approche
reste fonctionnelle sans clé serveur mais dépend du navigateur.
