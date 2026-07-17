from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
VECTOR_DIMENSION = int(os.getenv("VECTOR_DIMENSION", 384))

_model = None


def get_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def get_embedding(text: str) -> list:
    model = get_embedding_model()
    embedding = model.encode(text)
    return embedding.tolist()


def get_embeddings(texts: list) -> list:
    model = get_embedding_model()
    embeddings = model.encode(texts)
    return [e.tolist() for e in embeddings]
