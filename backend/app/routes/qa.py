from fastapi import APIRouter, Depends
import logging
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import QARequest, QAResponse
from app.routes.search import hybrid_search
from app.utils.llm_client import call_llm

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/greeting")
def get_greeting():
    logger.info("生成AI问候语")
    
    greeting_prompt = """
生成一句亲切自然的问候语。
可以介绍自己能查询水位、船舶、泊位、法规等信息，也可以引导执法流程。
保持简短、亲切、自然。
"""
    
    greeting = call_llm(greeting_prompt, max_tokens=100)
    logger.info("问候语生成完成")
    
    return {"greeting": greeting}


@router.post("/", response_model=QAResponse)
def qa(request: QARequest, db: Session = Depends(get_db)):
    logger.info(f"开始处理QA请求: query={request.query}, top_k={request.top_k}")
    
    search_results = hybrid_search(request, db)
    logger.info(f"搜索完成: 找到{len(search_results)}条相关结果")
    
    if search_results:
        context = "\n\n".join([f"来源: {result.document_name}\n内容: {result.chunk_text}" for result in search_results])
        
        knowledge_prompt = f"""
根据以下上下文信息，准确回答用户的问题。

上下文信息：
{context}

用户问题：
{request.query}

回答要求：
1. 必须基于提供的上下文信息回答
2. 保持你的说话风格回答，确保信息准确
3. 来源文件名可以简短列出
"""
        
        knowledge_answer = call_llm(knowledge_prompt)
        logger.info("知识库回答生成完成")
        
        answer = knowledge_answer
    else:
        general_prompt = f"""
请直接回答用户的问题，不需要额外的解释。

用户问题：
{request.query}
"""
        
        general_answer = call_llm(general_prompt)
        logger.info("通用回答生成完成（知识库未找到相关内容）")
        
        answer = general_answer
    
    logger.info(f"QA请求处理完成，返回回答长度: {len(answer)}")
    
    return QAResponse(
        answer=answer,
        sources=search_results
    )
