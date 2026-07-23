#!/usr/bin/env python3
"""数据库重置脚本 - 清除旧表并重建带512维向量的新表"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


def parse_db_url(url):
    """解析 DATABASE_URL 为连接参数"""
    url = url.replace('postgresql://', '')
    parts = url.split('/')
    host_port, db = parts[0], parts[1]
    user_pass, host_port = host_port.split('@')
    user, password = user_pass.split(':')
    host, port = host_port.split(':')
    return {
        'host': host,
        'port': int(port),
        'dbname': db,
        'user': user,
        'password': password
    }


def reset_database():
    """执行数据库重置"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL 环境变量未设置")
        return False

    try:
        conn_params = parse_db_url(db_url)
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        cur = conn.cursor()

        print("1. 确保 pgvector 扩展已安装...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")

        print("2. 删除现有表...")
        cur.execute("DROP TABLE IF EXISTS messages CASCADE")
        cur.execute("DROP TABLE IF EXISTS conversations CASCADE")
        cur.execute("DROP TABLE IF EXISTS users CASCADE")
        cur.execute("DROP TABLE IF EXISTS document_chunks CASCADE")
        cur.execute("DROP TABLE IF EXISTS documents CASCADE")

        print("3. 创建 documents 表...")
        cur.execute("""
            CREATE TABLE documents (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                filepath VARCHAR(500) NOT NULL,
                content TEXT,
                file_type VARCHAR(50),
                category VARCHAR(50) NOT NULL DEFAULT '法规',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """)

        print("4. 创建 document_chunks 表（512维向量）...")
        cur.execute("""
            CREATE TABLE document_chunks (
                id SERIAL PRIMARY KEY,
                document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER,
                embedding vector(512),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)

        print("5. 创建 users 表...")
        cur.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)

        print("6. 创建 conversations 表...")
        cur.execute("""
            CREATE TABLE conversations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)

        print("7. 创建 messages 表...")
        cur.execute("""
            CREATE TABLE messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)

        print("8. 创建索引...")
        cur.execute("CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id)")
        cur.execute("CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)")
        cur.execute("CREATE INDEX idx_messages_conversation_id ON messages(conversation_id)")
        cur.execute("CREATE INDEX idx_users_username ON users(username)")
        cur.execute("CREATE INDEX idx_users_email ON users(email)")
        cur.execute("CREATE INDEX idx_conversations_user_id ON conversations(user_id)")

        print("9. 创建默认管理员用户...")
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
        hashed_password = pwd_context.hash("admin123")
        cur.execute("""
            INSERT INTO users (username, email, hashed_password, full_name, role, created_at, updated_at)
            VALUES ('admin', 'admin@example.com', %s, '管理员', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (username) DO NOTHING
        """, (hashed_password,))
        cur.execute("SELECT username FROM users WHERE username = 'admin'")
        if cur.fetchone():
            print("✅ 默认管理员用户已创建/存在")
        else:
            print("❌ 默认管理员用户创建失败")

        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = [t[0] for t in cur.fetchall()]
        print(f"\n✅ 重置完成！当前表: {tables}")

        cur.execute("SELECT attname, atttypmod FROM pg_attribute WHERE attrelid = 'document_chunks'::regclass AND attname = 'embedding'")
        emb_col = cur.fetchone()
        if emb_col:
            print(f"✅ embedding 列维度: {emb_col[1]-4}")

        cur.close()
        conn.close()
        return True

    except Exception as e:
        print(f"\n❌ 重置失败: {e}")
        return False


if __name__ == "__main__":
    reset_database()