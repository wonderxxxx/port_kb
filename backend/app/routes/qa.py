from fastapi import APIRouter, Depends, HTTPException
import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.schemas import QARequest, QAResponse, ConversationResponse, MessageResponse, ConversationCreate, SendMessageRequest
from app.routes.search import hybrid_search
from app.utils.llm_client import call_llm
from app.models import Conversation, Message, User
from app.routes.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

CONTEXT_WINDOW_SIZE = 10


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


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"获取用户会话列表: user_id={current_user.id}")
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(desc(Conversation.updated_at)).all()
    return conversations


@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(request: ConversationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"创建新会话: user_id={current_user.id}, title={request.title}")
    conversation = Conversation(title=request.title, user_id=current_user.id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"获取会话消息: user_id={current_user.id}, conversation_id={conversation_id}")
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="会话不存在")
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
    return messages


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"删除会话: user_id={current_user.id}, conversation_id={conversation_id}")
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conversation)
    db.commit()
    
    return {"message": "会话已删除"}


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


@router.post("/chat")
def chat(request: SendMessageRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"开始处理聊天请求: user_id={current_user.id}, query={request.query}, conversation_id={request.conversation_id}")
    
    conversation = None
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="会话不存在")
    else:
        conversation = Conversation(title=request.query[:30] if len(request.query) > 30 else request.query, user_id=current_user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    user_message = Message(conversation_id=conversation.id, role="user", content=request.query)
    db.add(user_message)
    db.commit()
    
    recent_messages = db.query(Message).filter(Message.conversation_id == conversation.id).order_by(Message.created_at.desc()).limit(CONTEXT_WINDOW_SIZE).all()
    recent_messages.reverse()
    
    context_history = "\n".join([f"{m.role}: {m.content}" for m in recent_messages])
    
    search_results = hybrid_search(QARequest(query=request.query, top_k=request.top_k), db)
    logger.info(f"搜索完成: 找到{len(search_results)}条相关结果")
    
    if search_results:
        context = "\n\n".join([f"来源: {result.document_name}\n内容: {result.chunk_text}" for result in search_results])
        
        knowledge_prompt = f"""
你是一个智能问答助手。根据以下对话历史和上下文信息，准确回答用户的问题。

对话历史：
{context_history}

上下文信息：
{context}

回答要求：
1. 必须基于提供的上下文信息和对话历史回答
2. 保持你的说话风格回答，确保信息准确
3. 来源文件名可以简短列出
"""
        
        knowledge_answer = call_llm(knowledge_prompt)
        logger.info("知识库回答生成完成")
        
        answer = knowledge_answer
    else:
        general_prompt = f"""
你是一个智能问答助手。根据以下对话历史，回答用户的问题。

对话历史：
{context_history}

回答要求：
1. 保持你的说话风格回答，确保信息准确
"""
        
        general_answer = call_llm(general_prompt)
        logger.info("通用回答生成完成（知识库未找到相关内容）")
        
        answer = general_answer
    
    assistant_message = Message(conversation_id=conversation.id, role="assistant", content=answer)
    db.add(assistant_message)
    db.commit()
    
    logger.info(f"聊天请求处理完成，返回回答长度: {len(answer)}")
    
    return {
        "conversation_id": conversation.id,
        "answer": answer,
        "sources": search_results
    }