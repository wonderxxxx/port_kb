from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import logging
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, DocumentChunk
from app.schemas import DocumentResponse
from app.utils.document_processor import extract_text, chunk_text, get_file_type
from app.utils.embedding import get_embeddings
import os
import shutil

router = APIRouter()
logger = logging.getLogger(__name__)

DOCS_DIR = os.getenv("DOCS_DIR", "./docs")
os.makedirs(DOCS_DIR, exist_ok=True)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...), category: str = "法规", db: Session = Depends(get_db)):
    logger.info(f"开始处理文档上传: filename={file.filename}, content_type={file.content_type}, category={category}")
    
    ext = os.path.splitext(file.filename)[1].lower()
    logger.info(f"文件扩展名: {ext}")
    if ext not in [".pdf", ".docx", ".md", ".txt"]:
        logger.error(f"不支持的文件类型: {ext}")
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    file_path = os.path.join(DOCS_DIR, file.filename)
    logger.info(f"准备保存文件到: {file_path}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    logger.info("文件保存成功")
    
    try:
        logger.info("开始提取文本内容")
        content = extract_text(file_path)
        logger.info(f"文本提取完成，内容长度: {len(content)}")
    except Exception as e:
        os.remove(file_path)
        logger.error(f"文本提取失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")
    
    file_type = get_file_type(file_path)
    logger.info(f"文件类型识别: {file_type}")
    
    db_document = Document(
        filename=file.filename,
        filepath=file_path,
        content=content,
        file_type=file_type,
        category=category
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    logger.info(f"文档信息已保存到数据库: document_id={db_document.id}")
    
    logger.info("开始进行文本分块")
    chunks = chunk_text(content)
    logger.info(f"文本分块完成，共生成{len(chunks)}个块")
    
    if chunks:
        logger.info("开始生成向量嵌入")
        embeddings = get_embeddings(chunks)
        logger.info(f"向量嵌入生成完成，共{len(embeddings)}个向量")
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            db_chunk = DocumentChunk(
                document_id=db_document.id,
                chunk_text=chunk,
                chunk_index=i,
                embedding=embedding
            )
            db.add(db_chunk)
        db.commit()
        logger.info(f"文档块和向量已保存到数据库，共{len(chunks)}条记录")
    
    logger.info(f"文档上传处理完成: document_id={db_document.id}, filename={file.filename}")
    
    return db_document


@router.get("/", response_model=list[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).all()


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    db.delete(document)
    db.commit()
    
    if os.path.exists(document.filepath):
        os.remove(document.filepath)
    
    return {"message": "Document deleted successfully"}
