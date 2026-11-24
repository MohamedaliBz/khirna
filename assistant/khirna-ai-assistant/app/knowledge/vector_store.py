from pathlib import Path
import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer


class VectorStore:
    def __init__(self, processed_dir: str = "knowledge_base/processed"):
        self.processed_dir = Path(processed_dir)
        self.vectorizer: TfidfVectorizer | None = None
        self.matrix = None
        self.documents: list[dict] = []

    def build(self, documents: list[dict]) -> None:
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        texts = [document["content"] for document in documents]
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            max_features=30000,
        )
        self.matrix = self.vectorizer.fit_transform(texts)
        self.documents = documents

        joblib.dump(self.vectorizer, self.processed_dir / "tfidf.joblib")
        joblib.dump(self.matrix, self.processed_dir / "matrix.joblib")
        (self.processed_dir / "documents.json").write_text(
            json.dumps(documents, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def load(self) -> bool:
        vectorizer_path = self.processed_dir / "tfidf.joblib"
        documents_path = self.processed_dir / "documents.json"
        matrix_path = self.processed_dir / "matrix.joblib"
        if not all(path.exists() for path in (vectorizer_path, documents_path, matrix_path)):
            return False
        self.vectorizer = joblib.load(vectorizer_path)
        self.matrix = joblib.load(matrix_path)
        self.documents = json.loads(documents_path.read_text(encoding="utf-8"))
        return True
