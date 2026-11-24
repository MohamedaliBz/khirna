from pathlib import Path
import re


def split_markdown(text: str, source: str, chunk_chars: int = 1200) -> list[dict]:
    chunks: list[dict] = []
    section = "Introduction"
    buffer: list[str] = []

    for line in text.splitlines():
        heading = re.match(r"^#{1,6}\s+(.*)$", line)
        if heading:
            if buffer:
                chunks.extend(_make_chunks(source, section, "\n".join(buffer), chunk_chars))
                buffer = []
            section = heading.group(1).strip()
        else:
            buffer.append(line)

    if buffer:
        chunks.extend(_make_chunks(source, section, "\n".join(buffer), chunk_chars))
    return [chunk for chunk in chunks if chunk["content"].strip()]


def _make_chunks(source: str, section: str, text: str, chunk_chars: int) -> list[dict]:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []
    return [
        {"source": source, "section": section, "content": text[start:start + chunk_chars]}
        for start in range(0, len(text), chunk_chars)
    ]


def ingest_directory(directory: str) -> list[dict]:
    root = Path(directory)
    chunks: list[dict] = []
    for path in sorted(root.glob("*")):
        if path.suffix.lower() in {".md", ".txt"}:
            chunks.extend(split_markdown(path.read_text(encoding="utf-8"), path.name))
    return chunks
