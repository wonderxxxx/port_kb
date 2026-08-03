# 知识库系统 API 接入文档

## 1. 项目概述

本系统是一个基于 FastAPI 构建的知识库问答系统，提供文档管理、智能搜索、对话问答等核心功能。前端项目可通过 RESTful API 与后端进行交互。

## 2. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | FastAPI | 高性能 Python Web 框架 |
| 数据库 | PostgreSQL | 关系型数据库，支持向量检索 |
| 认证方式 | JWT | Bearer Token 认证 |
| 前端框架 | React + TypeScript | 现代前端开发框架 |
| 样式方案 | Tailwind CSS 3 | 原子化 CSS 框架 |
| 包管理 | npm | 前端依赖管理 |

## 3. 接口认证要求速查表

| 模块 | 接口路径 | HTTP方法 | 是否需要认证 |
|------|----------|----------|--------------|
| 认证 | `/api/auth/register` | POST | 否 |
| 认证 | `/api/auth/login` | POST | 否 |
| 认证 | `/api/auth/login/form` | POST | 否 |
| 认证 | `/api/auth/me` | GET | 是 |
| 认证 | `/api/auth/logout` | POST | 否 |
| 文档 | `/api/documents/upload` | POST | 否 |
| 文档 | `/api/documents/` | GET | 否 |
| 文档 | `/api/documents/{document_id}` | GET | 否 |
| 文档 | `/api/documents/{document_id}` | DELETE | 否 |
| 搜索 | `/api/search/vector` | POST | 否 |
| 搜索 | `/api/search/keyword` | POST | 否 |
| 搜索 | `/api/search/hybrid` | POST | 否 |
| 问答 | `/api/qa/` | POST | 否 |
| 问答 | `/api/qa/greeting` | GET | 否 |
| 问答 | `/api/qa/conversations` | GET | 是 |
| 问答 | `/api/qa/conversations` | POST | 是 |
| 问答 | `/api/qa/conversations/{id}/messages` | GET | 是 |
| 问答 | `/api/qa/conversations/{id}` | DELETE | 是 |
| 问答 | `/api/qa/chat` | POST | 是 |
| 模型 | `/api/models/info` | GET | 否 |
| 模型 | `/api/models/available` | GET | 否 |
| 模型 | `/api/models/switch` | POST | 否 |
| 模型 | `/api/models/reembed` | POST | 否 |

## 4. 基础配置

### 4.1 服务地址

- **开发环境**: `http://localhost:8000`
- **API 前缀**: `/api`
- **完整基础路径**: `http://localhost:8000/api`

### 4.2 环境变量配置

后端 `.env` 文件关键配置：

```env
DATABASE_URL=postgresql://postgres:postgres@139.196.241.196:5432/kb
EMBEDDING_MODEL=BAAI/bge-small-zh-v1.5
LLM_API_BASE=https://zhenze-huhehaote.cmecloud.cn/v1/chat/completions
SECRET_KEY=your-secret-key-change-in-production-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4.3 CORS 配置

后端已配置允许所有来源跨域访问：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 5. 认证接口

### 4.1 用户注册

- **路径**: `POST /api/auth/register`
- **描述**: 创建新用户账号

**请求体**:
```json
{
  "username": "string",      // 必填，用户名
  "email": "string",         // 必填，邮箱地址
  "password": "string",      // 必填，密码
  "full_name": "string"      // 可选，真实姓名
}
```

**成功响应** (200):
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "full_name": "管理员",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**失败响应** (400):
```json
{
  "detail": "用户名已存在"
}
```

### 4.2 用户登录

- **路径**: `POST /api/auth/login`
- **描述**: 用户登录获取访问令牌

**请求体**:
```json
{
  "username": "string",      // 必填，用户名
  "password": "string"       // 必填，密码
}
```

**成功响应** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**失败响应** (401):
```json
{
  "detail": "用户名或密码错误"
}
```

### 4.3 获取当前用户信息

- **路径**: `GET /api/auth/me`
- **描述**: 获取当前登录用户信息，需携带认证令牌

**请求头**:
```
Authorization: Bearer <access_token>
```

**成功响应** (200):
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "full_name": "管理员",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 4.4 用户退出

- **路径**: `POST /api/auth/logout`
- **描述**: 用户退出登录（前端应清除本地存储的 token）

**成功响应** (200):
```json
{
  "message": "已退出登录"
}
```

## 6. 文档管理接口

### 5.1 上传文档

- **路径**: `POST /api/documents/upload`
- **描述**: 上传文档并自动进行文本提取和向量嵌入

**请求体** (multipart/form-data):
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 文档文件，支持 .pdf, .docx, .md, .txt |
| category | String | 否 | 文档分类，默认 "法规" |

**成功响应** (200):
```json
{
  "id": 1,
  "filename": "document.pdf",
  "filepath": "./docs/document.pdf",
  "file_type": "pdf",
  "category": "法规",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null
}
```

**失败响应** (400):
```json
{
  "detail": "Unsupported file type"
}
```

### 5.2 获取文档列表

- **路径**: `GET /api/documents/`
- **描述**: 获取所有已上传的文档列表

**成功响应** (200):
```json
[
  {
    "id": 1,
    "filename": "document.pdf",
    "filepath": "./docs/document.pdf",
    "file_type": "pdf",
    "category": "法规",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": null
  }
]
```

### 5.3 获取单个文档

- **路径**: `GET /api/documents/{document_id}`
- **描述**: 根据文档 ID 获取文档详情

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| document_id | Integer | 文档 ID |

**成功响应** (200):
```json
{
  "id": 1,
  "filename": "document.pdf",
  "filepath": "./docs/document.pdf",
  "file_type": "pdf",
  "category": "法规",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": null
}
```

**失败响应** (404):
```json
{
  "detail": "Document not found"
}
```

### 5.4 删除文档

- **路径**: `DELETE /api/documents/{document_id}`
- **描述**: 删除指定文档及其所有关联的文档块和向量

**成功响应** (200):
```json
{
  "message": "Document deleted successfully"
}
```

## 7. 搜索接口

### 6.1 向量搜索

- **路径**: `POST /api/search/vector`
- **描述**: 基于向量相似度的语义搜索

**请求体**:
```json
{
  "query": "string",      // 必填，搜索关键词
  "top_k": 5             // 可选，返回结果数量，默认 5
}
```

**成功响应** (200):
```json
[
  {
    "id": 1,
    "document_id": 1,
    "document_name": "document.pdf",
    "chunk_text": "文档片段内容...",
    "score": 0.95
  }
]
```

### 6.2 关键词搜索

- **路径**: `POST /api/search/keyword`
- **描述**: 基于 BM25 算法的关键词搜索

**请求体**:
```json
{
  "query": "string",      // 必填，搜索关键词
  "top_k": 5             // 可选，返回结果数量，默认 5
}
```

**成功响应** (200):
```json
[
  {
    "id": 1,
    "document_id": 1,
    "document_name": "document.pdf",
    "chunk_text": "文档片段内容...",
    "score": 2.34
  }
]
```

### 6.3 混合搜索（推荐）

- **路径**: `POST /api/search/hybrid`
- **描述**: 融合向量搜索和关键词搜索的混合搜索策略（推荐使用）

**请求体**:
```json
{
  "query": "string",      // 必填，搜索关键词
  "top_k": 5             // 可选，返回结果数量，默认 5
}
```

**成功响应** (200):
```json
[
  {
    "id": 1,
    "document_id": 1,
    "document_name": "document.pdf",
    "chunk_text": "文档片段内容...",
    "score": 0.85
  }
]
```

## 8. 问答接口

### 7.1 单次问答

- **路径**: `POST /api/qa/`
- **描述**: 单次问答，不保存对话历史

**请求体**:
```json
{
  "query": "string",      // 必填，用户问题
  "top_k": 5             // 可选，搜索结果数量，默认 5
}
```

**成功响应** (200):
```json
{
  "answer": "根据知识库内容生成的回答...",
  "sources": [
    {
      "id": 1,
      "document_id": 1,
      "document_name": "document.pdf",
      "chunk_text": "相关文档片段...",
      "score": 0.95
    }
  ]
}
```

### 7.2 获取 AI 问候语

- **路径**: `GET /api/qa/greeting`
- **描述**: 获取 AI 助手的问候语

**成功响应** (200):
```json
{
  "greeting": "你好！我是港航智能助手，可以帮您查询水位、船舶、泊位、法规等信息。"
}
```

### 7.3 获取会话列表

- **路径**: `GET /api/qa/conversations`
- **描述**: 获取当前用户的所有会话列表

**请求头**:
```
Authorization: Bearer <access_token>
```

**成功响应** (200):
```json
[
  {
    "id": 1,
    "title": "新会话",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### 7.4 创建新会话

- **路径**: `POST /api/qa/conversations`
- **描述**: 创建一个新的对话会话

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求体**:
```json
{
  "title": "string"       // 可选，会话标题，默认 "新会话"
}
```

**成功响应** (200):
```json
{
  "id": 1,
  "title": "新会话",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 7.5 获取会话消息

- **路径**: `GET /api/qa/conversations/{conversation_id}/messages`
- **描述**: 获取指定会话的所有消息

**请求头**:
```
Authorization: Bearer <access_token>
```

**成功响应** (200):
```json
[
  {
    "id": 1,
    "conversation_id": 1,
    "role": "user",
    "content": "用户的问题",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "conversation_id": 1,
    "role": "assistant",
    "content": "助手的回答",
    "created_at": "2024-01-01T00:00:01Z"
  }
]
```

### 7.6 发送消息（对话）

- **路径**: `POST /api/qa/chat`
- **描述**: 发送消息进行对话，支持上下文记忆

**请求头**:
```
Authorization: Bearer <access_token>
```

**请求体**:
```json
{
  "query": "string",              // 必填，用户问题
  "conversation_id": 1,          // 可选，会话 ID，不传则创建新会话
  "top_k": 5                     // 可选，搜索结果数量，默认 5
}
```

**成功响应** (200):
```json
{
  "conversation_id": 1,
  "title": "生成的会话标题",
  "answer": "根据知识库内容生成的回答...",
  "sources": [
    {
      "id": 1,
      "document_id": 1,
      "document_name": "document.pdf",
      "chunk_text": "相关文档片段...",
      "score": 0.95
    }
  ]
}
```

### 7.7 删除会话

- **路径**: `DELETE /api/qa/conversations/{conversation_id}`
- **描述**: 删除指定会话及其所有消息

**请求头**:
```
Authorization: Bearer <access_token>
```

**成功响应** (200):
```json
{
  "message": "会话已删除"
}
```

## 9. 模型管理接口

### 8.1 获取当前模型信息

- **路径**: `GET /api/models/info`
- **描述**: 获取当前使用的 embedding 模型信息

**成功响应** (200):
```json
{
  "model": "BAAI/bge-small-zh-v1.5",
  "dimension": 512
}
```

### 8.2 获取可用模型列表

- **路径**: `GET /api/models/available`
- **描述**: 获取所有可用的 embedding 模型列表

**成功响应** (200):
```json
{
  "available_models": [
    {"name": "BAAI/bge-small-zh-v1.5", "dimension": 512}
  ]
}
```

### 8.3 切换模型

- **路径**: `POST /api/models/switch?model_name={model_name}`
- **描述**: 切换 embedding 模型（需重启服务生效）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model_name | String | 是 | 模型名称 |

**请求示例**:
```
POST /api/models/switch?model_name=BAAI/bge-small-zh-v1.5
```

**成功响应** (200):
```json
{
  "message": "模型切换成功",
  "model": "新模型名称",
  "pending_chunks_to_reembed": 100,
  "action_required": [
    "1. 修改 .env 文件中的 EMBEDDING_MODEL 配置",
    "2. 重启服务",
    "3. 调用 POST /api/models/reembed 重新嵌入所有文档"
  ]
}
```

### 8.4 重新嵌入文档

- **路径**: `POST /api/models/reembed`
- **描述**: 使用当前模型重新嵌入所有文档块

**成功响应** (200):
```json
{
  "message": "成功重新嵌入 100 个文档块",
  "model": "BAAI/bge-small-zh-v1.5"
}
```

## 10. 前端接入示例

### 10.1 创建独立的知识库 API 工具类

> **重要**: 前端现有 `src/api/index.ts` 使用的是 mock-server 的 `/south/*`、`/north/*` 路径，与后端真实 API 路径不同。建议在 `src/lib/` 目录下创建独立的知识库 API 模块，避免与现有 API 冲突。

```typescript
// src/lib/kb-api.ts
export const KB_API_BASE = '/api';

let token: string | null = localStorage.getItem('kb_token');

export const setKBToken = (newToken: string) => {
  token = newToken;
  localStorage.setItem('kb_token', newToken);
};

export const clearKBToken = () => {
  token = null;
  localStorage.removeItem('kb_token');
};

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${KB_API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: '未知错误' }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }
  
  return res.json();
}

// 认证相关
export const kbLogin = (username: string, password: string) =>
  fetchJSON<{ access_token: string; token_type: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const kbRegister = (data: { username: string; email: string; password: string; full_name?: string }) =>
  fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const kbGetCurrentUser = () => fetchJSON('/auth/me');

// 文档相关
export const kbUploadDocument = (file: File, category?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (category) formData.append('category', category);
  
  return fetch(`${KB_API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
};

export const kbGetDocuments = () => fetchJSON('/documents/');

export const kbDeleteDocument = (id: number) =>
  fetchJSON(`/documents/${id}`, { method: 'DELETE' });

// 搜索相关
export const kbHybridSearch = (query: string, top_k?: number) =>
  fetchJSON('/search/hybrid', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: top_k || 5 }),
  });

// 问答相关
export const kbGetGreeting = () => fetchJSON<{ greeting: string }>('/qa/greeting');

export const kbChat = (query: string, conversation_id?: number, top_k?: number) =>
  fetchJSON('/qa/chat', {
    method: 'POST',
    body: JSON.stringify({ query, conversation_id, top_k: top_k || 5 }),
  });

export const kbGetConversations = () => fetchJSON('/qa/conversations');

export const kbGetMessages = (conversationId: number) =>
  fetchJSON(`/qa/conversations/${conversationId}/messages`);

export const kbCreateConversation = (title?: string) =>
  fetchJSON('/qa/conversations', {
    method: 'POST',
    body: JSON.stringify({ title: title || '新会话' }),
  });

export const kbDeleteConversation = (id: number) =>
  fetchJSON(`/qa/conversations/${id}`, { method: 'DELETE' });

// 模型相关
export const kbGetModelInfo = () => fetchJSON('/models/info');

export const kbGetAvailableModels = () => fetchJSON('/models/available');

export const kbSwitchModel = (modelName: string) =>
  fetchJSON(`/models/switch?model_name=${encodeURIComponent(modelName)}`, { method: 'POST' });

export const kbReembedDocuments = () => fetchJSON('/models/reembed', { method: 'POST' });
```

### 10.2 类型定义

```typescript
// src/types/kb-api.ts
export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export interface Document {
  id: number;
  filename: string;
  filepath: string;
  file_type: string;
  category: string;
  created_at: string;
  updated_at: string | null;
}

export interface SearchResult {
  id: number;
  document_id: number;
  document_name: string;
  chunk_text: string;
  score: number;
}

export interface QAResponse {
  answer: string;
  sources: SearchResult[];
}

export interface ChatResponse {
  conversation_id: number;
  title: string;
  answer: string;
  sources: SearchResult[];
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ModelInfo {
  model: string;
  dimension: number;
}

export interface AvailableModel {
  name: string;
  dimension: number;
}
```

### 10.3 登录组件示例

```tsx
// src/components/KBLoginForm.tsx
import { useState } from 'react';
import { kbLogin, setKBToken } from '../lib/kb-api';

export function KBLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await kbLogin(username, password);
      setKBToken(result.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">港航智能助手</h1>
          <p className="text-slate-500 mt-2">请登录您的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </span>
            ) : (
              '登 录'
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          还没有账号？
          <a href="/register" className="text-blue-500 hover:text-blue-600 font-medium ml-1">
            立即注册
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 10.4 聊天组件示例

```tsx
// src/components/KBChatPanel.tsx
import { useState, useEffect, useRef } from 'react';
import { kbChat, kbGetMessages, kbGetGreeting } from '../lib/kb-api';
import type { Message, ChatResponse } from '../types/kb-api';

export function ChatPanel({ conversationId, onConversationChange }: { conversationId?: number; onConversationChange?: (id: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getGreeting().then((res) => setGreeting(res.greeting));
  }, []);

  useEffect(() => {
    if (conversationId) {
      getMessages(conversationId).then((res) => setMessages(res));
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    const userMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const response: ChatResponse = await chat(input, conversationId);
      
      if (onConversationChange && (!conversationId || response.conversation_id !== conversationId)) {
        onConversationChange(response.conversation_id);
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        conversation_id: response.conversation_id,
        role: 'assistant',
        content: response.answer,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        conversation_id: conversationId || 0,
        role: 'assistant',
        content: err instanceof Error ? err.message : '发送失败，请重试',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-500 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
          </svg>
          <div>
            <p className="text-sm font-bold">港航智能助手</p>
            <p className="text-[10px] opacity-75">AI 在线</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
        {messages.length === 0 && greeting && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
              <span className="text-[10px] font-bold text-purple-500 mb-1 block">AI</span>
              <p className="text-sm text-slate-700 leading-relaxed">{greeting}</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-100'
            }`}>
              {msg.role === 'assistant' && (
                <span className="text-[10px] font-bold text-purple-500 mb-1 block">AI</span>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] opacity-40">
                  {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
              <div className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="text-xs text-slate-400 ml-2">AI 思考中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入您的问题..."
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
```

## 11. 前端样式指南

### 11.1 Tailwind CSS 配置

项目使用 Tailwind CSS 3，已配置自定义颜色主题：

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maritime: {
          50: '#e6f0ff',
          100: '#b3d4ff',
          200: '#80b8ff',
          300: '#4d9cff',
          400: '#1a80ff',
          500: '#0066e6',
          600: '#004fb3',
          700: '#003980',
          800: '#00224d',
          900: '#000c1a',
        },
        warning: {
          blue: '#3b82f6',
          yellow: '#f59e0b',
          orange: '#f97316',
          red: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
```

### 11.2 自定义组件样式

项目定义了以下自定义样式类：

```css
/* index.css */
@layer components {
  .sidebar-link {
    @apply flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm;
  }
  .sidebar-link.active {
    @apply bg-blue-600 text-white hover:bg-blue-700;
  }
  .card {
    @apply bg-white rounded-xl border border-slate-200 shadow-sm p-5;
  }
  .card-title {
    @apply text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide;
  }
}
```

### 11.3 样式规范

#### 11.3.1 颜色使用

| 场景 | 推荐颜色 |
|------|----------|
| 主色调 | `blue-500` (#3b82f6) |
| 主背景 | `white` / `slate-50` |
| 侧边栏 | `slate-800` |
| 成功状态 | `green-500` |
| 警告状态 | `yellow-500` |
| 错误状态 | `red-500` |
| 文字颜色 | `slate-700` / `slate-500` |

#### 11.3.2 间距规范

| 场景 | 推荐间距 |
|------|----------|
| 卡片内边距 | `p-5` |
| 元素间距 | `gap-3` / `gap-4` |
| 外边距 | `m-4` / `mt-4` |

#### 11.3.3 圆角规范

| 场景 | 推荐圆角 |
|------|----------|
| 卡片 | `rounded-xl` |
| 按钮 | `rounded-xl` |
| 输入框 | `rounded-xl` |
| 小元素 | `rounded-lg` |

#### 11.3.4 阴影规范

| 场景 | 推荐阴影 |
|------|----------|
| 卡片 | `shadow-sm` |
| 悬浮面板 | `shadow-xl` |
| 按钮悬停 | `shadow-lg shadow-blue-500/30` |

### 11.4 响应式设计

项目使用 Tailwind 的响应式断点：

```html
<!-- 基础样式 -->
<div className="w-full md:w-1/2 lg:w-1/3"></div>

<!-- 隐藏/显示 -->
<div className="hidden md:block"></div>
<div className="md:hidden"></div>

<!-- 间距调整 -->
<div className="px-4 md:px-6 lg:px-8"></div>
```

## 12. 部署说明

### 12.1 后端部署

```bash
# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 12.2 前端开发环境配置

前端项目使用 Vite 构建工具，已配置代理转发到 mock-server（端口 3001）。如需接入真实后端 API，需修改 `vite.config.ts` 中的代理配置：

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
});
```

修改后，前端开发环境访问 `/api/*` 路径会自动转发到 `http://localhost:8000/api/*`。

### 12.3 前端部署

```bash
# 安装依赖
npm install

# 开发环境
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm run preview
```

### 11.3 环境变量配置

前端部署时需配置环境变量：

```env
VITE_API_BASE=http://your-server-ip:8000/api
```

## 13. 错误处理

### 13.1 HTTP 状态码

| 状态码 | 含义 | 处理建议 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求体格式 |
| 401 | 未授权 | 重新登录获取 token |
| 403 | 禁止访问 | 检查权限 |
| 404 | 资源不存在 | 检查资源 ID |
| 500 | 服务器错误 | 查看后端日志 |

### 13.2 统一错误处理

```typescript
async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, options);
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: '网络错误' }));
      
      if (res.status === 401) {
        clearToken();
        window.location.href = '/login';
      }
      
      throw new Error(error.detail || `请求失败: ${res.status}`);
    }
    
    return res.json();
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络');
    }
    throw err;
  }
}
```

## 14. 注意事项

1. **认证安全**: 所有需要登录的接口必须在请求头中携带 `Authorization: Bearer <token>`
2. **文件上传**: 文档上传接口使用 `multipart/form-data` 格式，不要使用 JSON
3. **CORS**: 后端已配置允许所有来源，生产环境建议限制具体域名
4. **Token 过期**: Token 默认有效期 30 分钟，过期后需重新登录
5. **会话管理**: 聊天接口支持上下文记忆，通过 `conversation_id` 关联对话
6. **搜索策略**: 推荐使用混合搜索接口 `/api/search/hybrid`，兼顾语义和关键词匹配