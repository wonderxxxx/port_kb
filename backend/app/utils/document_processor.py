import os
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
import markdown
import re


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def extract_text_from_docx(file_path: str) -> str:
    doc = DocxDocument(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text


def extract_text_from_md(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    html = markdown.markdown(content)
    text = re.sub(r"<[^>]+>", "", html)
    return text


def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".md":
        return extract_text_from_md(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> list:
    chunks = []
    text = text.strip()
    if not text:
        return chunks

    sentences = re.split(r"(?<=[。！？\n])", text)
    current_chunk = ""
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        if len(current_chunk) + len(sentence) <= chunk_size:
            current_chunk += sentence + "\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + "\n"
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    if chunk_overlap > 0 and len(chunks) > 1:
        overlapping_chunks = []
        for i, chunk in enumerate(chunks):
            if i > 0:
                prev_chunk = chunks[i-1]
                overlap = prev_chunk[-chunk_overlap:]
                chunk = overlap + chunk
            overlapping_chunks.append(chunk)
        return overlapping_chunks
    
    return chunks


def get_file_type(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    type_map = {
        ".pdf": "pdf",
        ".docx": "docx",
        ".md": "markdown",
        ".txt": "text",
    }
    return type_map.get(ext, "unknown")
