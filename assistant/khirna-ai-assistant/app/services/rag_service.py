from app.knowledge.retriever import Retriever


class RagService:
    def __init__(self, retriever: Retriever):
        self.retriever = retriever

    def get_context(self, query: str, top_k: int = 5) -> tuple[str, list[dict]]:
        sources = self.retriever.retrieve(query, top_k=top_k)
        if not sources:
            return "", []
        blocks = [
            f"[Source: {item['filename']} | Section: {item['section']}]\n{item['content']}"
            for item in sources
        ]
        return "\n\n".join(blocks), sources

    def local_answer(self, query: str, sources: list[dict], language: str) -> str:
        if not sources:
            if language == "ar":
                return "لا تتوفر لديّ معلومات موثوقة في وثائق KHIRNA للإجابة على هذا السؤال. يرجى التواصل مع ممثل KHIRNA المعتمد."
            if language == "tn":
                return "معنديّش معلومات مؤكدة في وثائق KHIRNA باش نجاوب على هالسؤال. الأفضل تتواصل مع ممثل KHIRNA."
            return (
                "Je ne dispose pas d'une information suffisamment fiable dans les documents "
                "KHIRNA fournis pour répondre. Merci de contacter un représentant KHIRNA."
            )
        first = sources[0]
        if language == "ar":
            intro = "استنادًا إلى وثائق KHIRNA:"
            closing = "هذا شرح مطابق للوثيقة المتاحة وليس تعهدًا بعائد مضمون."
        elif language == "tn":
            intro = "حسب وثائق KHIRNA:"
            closing = "هذا شرح على ضوء الدوكومان متاعنا، وماهوش تعهد بأي ربح."
        else:
            intro = "Selon les documents KHIRNA disponibles :"
            closing = (
                "Cette réponse repose sur la documentation fournie. "
                "Le prototype utilise des paiements simulés et aucun rendement n'est garanti."
            )
        excerpt = first["content"].strip()
        if len(excerpt) > 900:
            excerpt = excerpt[:900].rstrip() + "..."
        return f"{intro}\n\n{excerpt}\n\n{closing}\n\nSource principale : {first['filename']} — {first['section']}."
