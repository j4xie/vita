/**
 * AI Chat 服务类型定义
 * 用于与 backend-ai-chat 后端服务通信
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string; // 本地添加的时间戳
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id?: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  message_count: number;
}

export interface SessionHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface AISessionState {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
