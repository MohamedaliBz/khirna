from sklearn.metrics.pairwise import cosine_similarity

from app.knowledge.vector_store import VectorStore


class Retriever:
    def __init__(self, store: VectorStore):
        self.store = store

    @staticmethod
    def _search_text(query: str) -> str:
        stopwords = {
            "comment", "dans", "un", "une", "est", "le", "la", "les", "de", "du",
            "des", "pour", "que", "quoi", "avec", "sur", "et", "je", "j", "mon",
            "ma", "mes", "quel", "quelle", "quelles", "quels",
            "au", "aux", "en", "à", "a", "ce", "ces", "cette", "ou", "par",
            "se", "me", "moi", "ça", "ca", "va",
        }
        words = "".join(
            character if character.isalnum() or character.isspace() else " "
            for character in query.lower()
        ).split()
        return " ".join(word for word in words if word not in stopwords)

    def retrieve(self, query: str, top_k: int = 5, minimum_score: float = 0.05) -> list[dict]:
        if not self.store.vectorizer or self.store.matrix is None:
            return []
        query_vector = self.store.vectorizer.transform([self._search_text(query)])
        similarities = cosine_similarity(query_vector, self.store.matrix).ravel()
        ranked = similarities.argsort()[::-1][:top_k]
        results = []
        for index in ranked:
            score = float(similarities[index])
            if score < minimum_score:
                continue
            document = self.store.documents[index]
            results.append({
                "filename": document["source"],
                "section": document["section"],
                "content": document["content"],
                "score": round(score, 4),
            })
        return results
