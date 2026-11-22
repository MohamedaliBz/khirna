class TranscriptionService:
    """Local interface for a replaceable speech-to-text provider."""

    def transcribe(self, data: bytes, mime_type: str, language: str) -> str:
        raise NotImplementedError(
            "Le backend ne dispose pas de fournisseur STT configuré. "
            "Utilisez Web Speech API côté navigateur ou configurez un fournisseur compatible."
        )
