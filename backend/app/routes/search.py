from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import Document, DocumentChunk
from app.schemas import SearchRequest, SearchResult
from app.utils.embedding import get_embedding
from app.utils.keyword_search import build_bm25_index, keyword_search, chinese_tokenize
from typing import List, Tuple

router = APIRouter()


@router.post("/vector", response_model=List[SearchResult])
def vector_search(request: SearchRequest, db: Session = Depends(get_db)):
    query_embedding = get_embedding(request.query)
    
    sql = text("""
        SELECT dc.id, dc.document_id, dc.chunk_text, d.filename,
               1 - (dc.embedding <=> CAST(:embedding AS vector)) as score
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        ORDER BY dc.embedding <=> CAST(:embedding AS vector)
        LIMIT :top_k
    """)
    
    results = db.execute(sql, {
        "embedding": query_embedding,
        "top_k": request.top_k
    }).fetchall()
    
    return [
        SearchResult(
            id=row.id,
            document_id=row.document_id,
            document_name=row.filename,
            chunk_text=row.chunk_text,
            score=float(row.score)
        )
        for row in results
    ]


@router.post("/keyword", response_model=List[SearchResult])
def keyword_search_endpoint(request: SearchRequest, db: Session = Depends(get_db)):
    chunks = db.query(DocumentChunk).all()
    if not chunks:
        return []
    
    chunk_texts = [chunk.chunk_text for chunk in chunks]
    bm25 = build_bm25_index(chunk_texts)
    results = keyword_search(bm25, request.query, chunk_texts, request.top_k)
    
    search_results = []
    for idx, score in results:
        if score > 0:
            chunk = chunks[idx]
            document = db.query(Document).filter(Document.id == chunk.document_id).first()
            search_results.append(SearchResult(
                id=chunk.id,
                document_id=chunk.document_id,
                document_name=document.filename if document else "",
                chunk_text=chunk.chunk_text,
                score=float(score)
            ))
    
    return search_results


@router.post("/hybrid", response_model=List[SearchResult])
def hybrid_search(request: SearchRequest, db: Session = Depends(get_db)):
    vector_results = vector_search(request, db)
    keyword_results = keyword_search_endpoint(request, db)
    
    vector_map = {r.id: r for r in vector_results}
    keyword_map = {r.id: r for r in keyword_results}
    
    all_ids = set(vector_map.keys()) | set(keyword_map.keys())
    
    fused_results = []
    for doc_id in all_ids:
        vector_rank = vector_results.index(vector_map[doc_id]) + 1 if doc_id in vector_map else len(all_ids) + 1
        keyword_rank = keyword_results.index(keyword_map[doc_id]) + 1 if doc_id in keyword_map else len(all_ids) + 1
        
        rrf_score = 1 / (60 + vector_rank) + 1 / (60 + keyword_rank)
        
        result = vector_map.get(doc_id) or keyword_map.get(doc_id)
        fused_results.append((result, rrf_score))
    
    fused_results.sort(key=lambda x: x[1], reverse=True)
    
    return [result for result, _ in fused_results[:request.top_k]]
