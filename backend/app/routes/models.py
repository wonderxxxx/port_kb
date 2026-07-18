from fastapi import APIRouter, HTTPException
from app.utils.embedding import get_current_model_info, switch_model, MODEL_REGISTRY
from app.database import get_db
from app.models import Document, DocumentChunk
from app.utils.embedding import get_embeddings
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter()


@router.get("/info")
def get_model_info():
    """获取当前模型信息"""
    return get_current_model_info()


@router.get("/available")
def get_available_models():
    """获取所有可用模型列表"""
    return {"available_models": [
        {"name": name, "dimension": dim}
        for name, dim in MODEL_REGISTRY.items()
    ]}


@router.post("/switch")
def switch_embedding_model(model_name: str, db: Session = Depends(get_db)):
    """切换 embedding 模型（需要重启服务才能生效）"""
    try:
        result = switch_model(model_name)
        
        # 统计需要重新嵌入的文档数量
        chunk_count = db.query(DocumentChunk).count()
        
        return {
            **result,
            "pending_chunks_to_reembed": chunk_count,
            "action_required": [
                "1. 修改 .env 文件中的 EMBEDDING_MODEL 配置",
                "2. 重启服务",
                "3. 调用 POST /api/models/reembed 重新嵌入所有文档"
            ]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reembed")
def reembed_all_documents(db: Session = Depends(get_db)):
    """重新嵌入所有文档（切换模型后必须调用）"""
    chunks = db.query(DocumentChunk).all()
    
    if not chunks:
        return {"message": "没有需要重新嵌入的文档块"}
    
    # 获取所有文本并批量嵌入
    chunk_texts = [chunk.chunk_text for chunk in chunks]
    embeddings = get_embeddings(chunk_texts)
    
    # 更新所有嵌入向量
    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding
    
    db.commit()
    
    return {
        "message": f"成功重新嵌入 {len(chunks)} 个文档块",
        "model": get_current_model_info()["model"]
    }