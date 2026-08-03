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