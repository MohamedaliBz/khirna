import re


SECRET_PATTERNS = (
    re.compile(r"(?i)(api[_ -]?key|token|password|secret)\s*[:=]\s*\S+", re.UNICODE),
)


def redact_secrets(text: str) -> str:
    redacted = text
    for pattern in SECRET_PATTERNS:
        redacted = pattern.sub("[INFORMATION CONFIDENTIELLE]", redacted)
    return redacted
