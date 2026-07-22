-- ============================================================
-- 知识库系统数据库重置脚本
-- 使用方法: psql -U postgres -d kb -f reset_db.sql
-- 或运行: python reset_db.py
-- ============================================================

-- 1. 确保 pgvector 扩展已安装（首次运行需要）
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 删除现有表（注意顺序：先删除子表 document_chunks，再删除父表 documents）
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- 3. 创建新表（使用 bge-small-zh-v1.5 模型的 512 维向量）
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    content TEXT,
    file_type VARCHAR(50),
    category VARCHAR(50) NOT NULL DEFAULT '法规',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER,
    embedding vector(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 创建索引（提高检索性能）
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
