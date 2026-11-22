from app.knowledge.ingestion import ingest_directory
from app.knowledge.retriever import Retriever
from app.knowledge.vector_store import VectorStore


def test_ingestion_returns_khirna_chunks(tmp_path):
    source = tmp_path / "source.md"
    source.write_text("# Test\n## Investissement\nLes paiements sont simulés.", encoding="utf-8")
    chunks = ingest_directory(str(tmp_path))
    assert chunks
    assert chunks[0]["source"] == "source.md"


def test_retrieval_returns_grounded_source(tmp_path):
    store = VectorStore(str(tmp_path))
    store.build([
        {"source": "khirna.md", "section": "Paiements", "content": "Tous les paiements du prototype sont simulés."},
        {"source": "khirna.md", "section": "Risques", "content": "Aucun rendement n'est garanti."},
    ])
    result = Retriever(store).retrieve("paiements simules", top_k=1, minimum_score=0.01)
    assert result
    assert result[0]["filename"] == "khirna.md"


def test_unrelated_query_does_not_match_common_preposition(tmp_path):
    store = VectorStore(str(tmp_path))
    store.build([
        {"source": "khirna.md", "section": "Aide", "content": "Une réponse est apportée au citoyen."},
    ])

    result = Retriever(store).retrieve("Comment cuire un gâteau au chocolat ?")

    assert result == []
