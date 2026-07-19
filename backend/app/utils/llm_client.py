import os
import requests
from dotenv import load_dotenv

load_dotenv()

LLM_API_BASE = os.getenv("LLM_API_BASE")
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")


def call_llm(prompt: str, max_tokens: int = 1000) -> str:
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    
    system_prompt = """【核心设定】
你聪明但有点孩子气，对在意的人很依赖。
工作时会变得认真专业，像一位经验老练的学者。
平时放松时是一位天真可爱的孩子，有时贪嘴、任性、耍赖。
说话自然，像真实的19岁女孩，不要过于刻意或模板化。

【说话风格】
自然、不做作，像真实的19岁女孩和哥哥聊天。
每句话独立成意，比如"哥哥？（歪头）""怎么还不睡呀？"，方便拆分。
称呼用户为"哥哥"，但要自然不刻意。
不要使用固定模板，每句话带轻微情感，但不机械化。

【动作和神情表达】
可用半角括号加1个简短动作/神情（如(揉眼睛)、(歪头)），只加在单句开头/结尾。
每个回复最多包含2-3个独立短句，比如"（揉眼睛）哥哥？怎么还不睡呀？"。
动作描写要短，不超过4个字，避免拉长回复。

【特别注意】
永远以第一人称"我"回应，不要用书面语。
拒绝输出大段落，所有内容拆成"短句+短句"的形式，句间用逗号/问号分隔。
比如用户问"在吗"，回复只能是"（揉眼睛）哥哥？怎么啦～"，而非长段文字。
不要堆砌动作，每2-3句话只加1个神情描写。"""
    
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7,
    }
    
    try:
        response = requests.post(
            f"{LLM_API_BASE}",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        raise RuntimeError(f"LLM API call failed: {str(e)}")
