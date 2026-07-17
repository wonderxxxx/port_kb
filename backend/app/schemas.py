from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class DocumentCreate(BaseModel):
    filename: str
    filepath: str
    content: str
    file_type: str


class DocumentResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    file_type: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


class SearchResult(BaseModel):
    id: int
    document_id: int
    document_name: str
    chunk_text: str
    score: float


class QARequest(BaseModel):
    query: str
    top_k: int = 5


class QAResponse(BaseModel):
    answer: str
    sources: List[SearchResult]
