# RAG expliqué progressivement

## Pourquoi la récupération est nécessaire

Un LLM apprend des régularités linguistiques générales, pas les documents privés
ou récents d'un projet. RAG signifie « Retrieval-Augmented Generation » :
retrouver des passages, les transmettre au modèle, puis demander une réponse
fondée sur ces passages.

## Découpage

Les titres Markdown deviennent des sections. Chaque section est découpée en
blocs environ 1200 caractères. Un bloc contient assez de contexte sans devenir
une quantité inutile pour le prompt.

## TF-IDF dans cette version

TF-IDF mesure quels mots sont caractéristiques d'un passage. Les mots trop
communs ont moins de poids. Cette première implémentation ne nécessite pas de
service d'embeddings externe. Elle convient à un jeu de documents limité.

Pour une évolution de production :

1. remplacer TF-IDF par Sentence Transformers ;
2. stocker les vecteurs dans FAISS ou Chroma ;
3. ajouter un reranker ;
4. conserver les métadonnées source ;
5. tester les questions hors périmètre.
