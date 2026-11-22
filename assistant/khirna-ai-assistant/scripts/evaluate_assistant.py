from pathlib import Path
import csv
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.knowledge.retriever import Retriever
from app.knowledge.vector_store import VectorStore


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    store = VectorStore(str(root / "knowledge_base" / "processed"))
    if not store.load():
        raise SystemExit("Base vectorielle absente. Lancez d'abord scripts/ingest_documents.py.")
    retriever = Retriever(store)
    rows = list(csv.DictReader((root / "tests" / "evaluation_dataset.csv").open(encoding="utf-8")))
    retrieved = 0
    for row in rows:
        results = retriever.retrieve(row["question"], top_k=3)
        filenames = {result["filename"] for result in results}
        if row["expected_source"] in filenames:
            retrieved += 1
    print(f"Questions évaluées : {len(rows)}")
    print(f"Source attendue retrouvée : {retrieved}/{len(rows)} ({retrieved / len(rows):.1%})")


if __name__ == "__main__":
    main()
