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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
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

export const kbLogin = (username: string, password: string) =>
  fetchJSON<{ access_token: string; token_type: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const kbRegister = (data: { username: string; email: string; password: string; full_name?: string }) =>
  fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const kbGetCurrentUser = () => fetchJSON('/auth/me');

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

export const kbHybridSearch = (query: string, top_k?: number) =>
  fetchJSON('/search/hybrid', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: top_k || 5 }),
  });

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

export const kbGetModelInfo = () => fetchJSON('/models/info');

export const kbGetAvailableModels = () => fetchJSON('/models/available');

export const kbSwitchModel = (modelName: string) =>
  fetchJSON(`/models/switch?model_name=${encodeURIComponent(modelName)}`, { method: 'POST' });

export const kbReembedDocuments = () => fetchJSON('/models/reembed', { method: 'POST' });