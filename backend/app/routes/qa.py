from fastapi import APIRouter, Depends
import logging
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import QARequest, QAResponse
from app.routes.search import hybrid_search
from app.utils.llm_client import call_llm

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=QAResponse)
def qa(request: QARequest, db: Session = Depends(get_db)):
    logger.info(f"开始处理QA请求: query={request.query}, top_k={request.top_k}")
    
    search_results = hybrid_search(request, db)
    logger.info(f"搜索完成: 找到{len(search_results)}条相关结果")
    
    if search_results:
        context = "\n\n".join([f"来源: {result.document_name}\n内容: {result.chunk_text}" for result in search_results])
        
        knowledge_prompt = f"""
你是一个专业的知识库问答助手。请根据以下上下文信息，准确回答用户的问题。

上下文信息：
{context}

用户问题：
{request.query}

回答要求：
1. 必须基于提供的上下文信息回答
2. 回答要简洁明了，不需要多余的解释
3. 请在回答末尾列出参考的来源文件名
"""
        
        knowledge_answer = call_llm(knowledge_prompt)
        logger.info("知识库回答生成完成")
        
        general_prompt = f"""
你是一个智能问答助手。请直接回答用户的问题，不需要额外的解释。

用户问题：
{request.query}
"""
        
        general_answer = call_llm(general_prompt)
        logger.info("通用回答生成完成")
        
        answer = f"【知识库回答】\n{knowledge_answer}\n\n【通用回答】\n{general_answer}"
    else:
        general_prompt = f"""
你是一个智能问答助手。请直接回答用户的问题，不需要额外的解释。

用户问题：
{request.query}
"""
        
        general_answer = call_llm(general_prompt)
        logger.info("通用回答生成完成（知识库未找到相关内容）")
        
        answer = f"【通用回答】\n{general_answer}\n\n⚠️ 知识库未找到相关内容"
    
    logger.info(f"QA请求处理完成，返回回答长度: {len(answer)}")
    
    return QAResponse(
        answer=answer,
        sources=search_results
    )
