class TtsService:
    """Local interface for a replaceable text-to-speech provider."""

    def synthesize(self, text: str, language: str) -> bytes:
        raise NotImplementedError(
            "Le backend ne dispose pas de fournisseur TTS configuré. "
            "Utilisez SpeechSynthesis côté navigateur ou configurez un fournisseur."
        )
