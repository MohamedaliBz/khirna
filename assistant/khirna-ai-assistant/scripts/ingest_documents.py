from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.knowledge.ingestion import ingest_directory
from app.knowledge.vector_store import VectorStore


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    documents = ingest_directory(str(root / "knowledge_base" / "documents"))
    store = VectorStore(str(root / "knowledge_base" / "processed"))
    store.build(documents)
    print(f"{len(documents)} chunks indexés depuis {len(list((root / 'knowledge_base' / 'documents').glob('*')))} documents.")


if __name__ == "__main__":
    main()
