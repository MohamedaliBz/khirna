# Guide d'apprentissage

## 1. Requête HTTP

Une API attend une requête. Pydantic vérifie que `message` est une chaîne non
vide, que `language` est autorisée et que `user_role` appartient aux rôles connus.

## 2. Prompt système

Le prompt indique au modèle son identité, son rôle, sa langue, ses sources et les
limites obligatoires. Il ne remplace pas la récupération documentaire.

## 3. Historique

Le backend conserve les derniers messages d'une session. Il les combine à la
nouvelle question pour permettre les références à « ce projet » ou « cette terre ».

## 4. RAG

La question devient un vecteur TF-IDF. Les blocs les plus proches sont sélectionnés.
Le modèle reçoit uniquement les meilleurs blocs parmi les documents autorisés.

## 5. Sécurité

La clé Groq reste dans le serveur. Les mots contenant une clé ou un mot secret
dans un message sont masqués avant traitement. Les données personnelles ne doivent
pas être envoyées inutilement.

## 6. Tests

- test des chunks ;
- test du classement ;
- test de la mémoire ;
- test santé et demande hors périmètre ;
- jeu d'évaluation de 30 questions.

## 7. Améliorations

Ajouter une authentification, une base Redis/PostgreSQL pour les sessions,
Sentence Transformers, un reranker, des logs structurés, un contrôle de quota,
des tests E2E vocales et un widget React en TypeScript.
