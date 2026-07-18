from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv

load_dotenv()

# 模型注册表：映射模型名称到向量维度
MODEL_REGISTRY = {
    "all-MiniLM-L6-v2": 384,
    "sentence-transformers/all-MiniLM-L6-v2": 384,
    "BAAI/bge-small-zh-v1.5": 512,
    "BAAI/bge-base-zh-v1.5": 768,
    "BAAI/bge-large-zh-v1.5": 1024,
    "BAAI/bge-m3": 1024,
}

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# 优先从环境变量读取维度，否则从模型注册表获取
_env_dim = os.getenv("VECTOR_DIMENSION")
if _env_dim:
    VECTOR_DIMENSION = int(_env_dim)
elif EMBEDDING_MODEL in MODEL_REGISTRY:
    VECTOR_DIMENSION = MODEL_REGISTRY[EMBEDDING_MODEL]
else:
    # 未知模型默认使用 384 维
    VECTOR_DIMENSION = 384

# 模型下载目录：项目根目录下的 models/embedding
# embedding.py 位于 backend/app/utils/，逐级向上回溯到项目根目录
_HERE = os.path.dirname(os.path.abspath(__file__))      # backend/app/utils
_APP_DIR = os.path.dirname(_HERE)                        # backend/app
_BACKEND_DIR = os.path.dirname(_APP_DIR)                 # backend
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)            # 项目根目录
MODELS_DIR = os.path.join(_PROJECT_ROOT, "models", "embedding")
os.makedirs(MODELS_DIR, exist_ok=True)

_model = None
_current_model_name = None


def _normalize_model_name(model_name: str) -> str:
    """规范化模型名称。

    sentence-transformers 对没有组织前缀的模型名会自动补上
    `sentence-transformers/`，这里保持一致以便正确判断本地缓存路径。
    """
    if "/" not in model_name:
        return "sentence-transformers/" + model_name
    return model_name


def is_model_cached(model_name: str) -> bool:
    """检查模型是否已下载到本地目录，避免重复下载。

    huggingface_hub 的缓存结构为：
    <cache_folder>/models--<org>--<name>/snapshots/<hash>/
    """
    normalized = _normalize_model_name(model_name)
    org, name = normalized.split("/", 1)
    cache_key = f"models--{org}--{name}"
    model_cache_dir = os.path.join(MODELS_DIR, cache_key)
    if not os.path.isdir(model_cache_dir):
        return False
    snapshots_dir = os.path.join(model_cache_dir, "snapshots")
    return os.path.isdir(snapshots_dir) and len(os.listdir(snapshots_dir)) > 0


def get_embedding_model():
    global _model, _current_model_name
    if _model is None or _current_model_name != EMBEDDING_MODEL:
        if is_model_cached(EMBEDDING_MODEL):
            # 模型已存在本地，使用离线模式加载，不再访问网络
            _model = SentenceTransformer(
                EMBEDDING_MODEL, cache_folder=MODELS_DIR, local_files_only=True
            )
        else:
            # 模型不存在，从网络下载到指定目录
            _model = SentenceTransformer(EMBEDDING_MODEL, cache_folder=MODELS_DIR)
        _current_model_name = EMBEDDING_MODEL
    return _model


def switch_model(model_name: str):
    """切换 embedding 模型（需要重启服务才能生效）"""
    global EMBEDDING_MODEL, VECTOR_DIMENSION, _model, _current_model_name

    if model_name not in MODEL_REGISTRY:
        raise ValueError(f"不支持的模型: {model_name}，支持的模型有: {list(MODEL_REGISTRY.keys())}")

    EMBEDDING_MODEL = model_name
    VECTOR_DIMENSION = MODEL_REGISTRY[model_name]
    _model = None
    _current_model_name = None

    return {
        "model": EMBEDDING_MODEL,
        "dimension": VECTOR_DIMENSION,
        "note": "模型已切换，但需要重启服务并重新嵌入文档才能生效"
    }


def get_current_model_info():
    """获取当前模型信息"""
    return {
        "model": EMBEDDING_MODEL,
        "dimension": VECTOR_DIMENSION,
        "available_models": list(MODEL_REGISTRY.keys())
    }


def get_embedding(text: str) -> list:
    model = get_embedding_model()
    embedding = model.encode(text)
    return embedding.tolist()


def get_embeddings(texts: list) -> list:
    model = get_embedding_model()
    embeddings = model.encode(texts)
    return [e.tolist() for e in embeddings]
