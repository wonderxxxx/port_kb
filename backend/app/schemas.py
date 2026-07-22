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


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: str = "新会话"


class SendMessageRequest(BaseModel):
    query: str
    conversation_id: int = None
    top_k: int = 5
