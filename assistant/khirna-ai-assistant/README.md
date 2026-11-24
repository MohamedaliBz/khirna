# KHIRNA AI Assistant

Backend Python indépendant qui fournit à KHIRNA un assistant conversationnel
en français, arabe et derja tunisienne. Il utilise une récupération
documentaire locale (RAG) et, lorsqu'ils sont configurés, les modèles Groq.

## Architecture rapide

```text
React / navigateur
  -> POST /api/chat
  -> FastAPI
  -> Recherche TF-IDF dans les documents KHIRNA
  -> Prompt système + contexte + historique
  -> Groq (optionnel) ou réponse locale explicative
```

Le projet ne modifie pas l'application React KHIRNA. Les documents officiels
se trouvent dans `knowledge_base/documents/`, et l'index est généré dans
`knowledge_base/processed/`.

Si la recherche ne trouve aucune source KHIRNA pertinente, l'API renvoie le
message de repli local et n'interroge pas Groq. Les réponses générées avec des
sources restent limitées par les consignes du prompt ; vérifiez-les avec les
documents et le jeu d'évaluation avant toute mise en production.

## Installation sur Windows

```powershell
cd C:\Users\surme\assistant\khirna-ai-assistant
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python scripts\ingest_documents.py
python run.py
```

Ouvrez `http://127.0.0.1:8000/docs`.

## Interface de test du chatbot

Ouvrez `http://127.0.0.1:8000/chat-ui`.

Cette interface permet de tester :

- les différents rôles ;
- le français, l'arabe et la derja ;
- les sources RAG ;
- l'historique de session ;
- l'effacement de la conversation ;
- le microphone navigateur ;
- la lecture vocale avec `SpeechSynthesis`.

Pour Groq, renseignez `GROQ_API_KEY` et `GROQ_MODEL` dans `.env`. Un nom de
modèle Groq disponible doit être choisi depuis la console de votre compte ;
sans ces valeurs, le backend reste utilisable en mode RAG local.

## Commandes

```powershell
python run.py
python scripts\ingest_documents.py
python scripts\evaluate_assistant.py
python -m pytest -q
```

## Concepts

- **LLM** : modèle probabiliste capable de produire du texte à partir d'une consigne.
- **Groq** : fournisseur d'inférence proposant des API compatibles OpenAI.
- **API** : contrat HTTP permettant à un frontend de demander une réponse.
- **Prompt système** : consignes générales sur l'identité, la langue, les sources et la sécurité.
- **RAG** : récupération de documents pertinents puis transmission de leur contenu au modèle.
- **Embeddings ou index TF-IDF** : représentation numérique permettant de chercher des textes similaires.
- **Recherche vectorielle** : classement des passages selon leur proximité avec la question.
- **Chunking** : découpage des documents en passages courts exploitables.
- **Mémoire** : historique limité conservé en mémoire pour une session donnée.
- **STT** : transformation d'une voix enregistrée en texte.
- **TTS** : transformation d'une réponse textuelle en voix.

## Limites

Le paiement, les bénéfices, le séquestre et les attributions foncières décrits
sont ceux du prototype ou de sa vision. Les services Groq, STT et TTS sont
optionnels. Les endpoints STT/TTS retournent une erreur explicite tant qu'un
fournisseur externe n'est pas configuré ; le navigateur peut démarrer avec
`Web Speech API` et `SpeechSynthesis`.
