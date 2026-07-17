import jieba
from rank_bm25 import BM25Okapi
from typing import List, Tuple


def chinese_tokenize(text: str) -> List[str]:
    return jieba.lcut(text)


def build_bm25_index(chunks: List[str]) -> BM25Okapi:
    tokenized_chunks = [chinese_tokenize(chunk) for chunk in chunks]
    return BM25Okapi(tokenized_chunks)


def keyword_search(bm25: BM25Okapi, query: str, chunks: List[str], top_k: int = 5) -> List[Tuple[int, float]]:
    tokenized_query = chinese_tokenize(query)
    scores = bm25.get_scores(tokenized_query)
    results = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:top_k]
    return results
