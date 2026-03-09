/**
 * 统一的聊天消息类型定义
 * 合并了 chatAPI, useAIFormFilling, ai.ts 中的重复定义
 */

// ==================== 基础消息类型 ====================

/**
 * API 层使用的基础消息格式
 */
export interface BaseChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * AI消息元数据 - 包含来源类型、相关性等信息
 */
export interface AIMessageMetadata {
  sourceType?: 'web_search' | 'knowledge_base' | 'general';
  ragScore?: number;
  schoolId?: string;
  webSources?: Array<{
    title: string;
    url: string;
    icon?: string;
    siteName?: string;
  }>;
}

/**
 * UI 层使用的完整消息格式
 */
export interface ChatMessage extends BaseChatMessage {
  id: string;
  timestamp: number;
  metadata?: AIMessageMetadata;
}

// ==================== API 请求/响应类型 ====================

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id?: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  message_count?: number;
  sourceType?: string;
  ragScore?: number;
  schoolId?: string;
  webSources?: Array<{
    title: string;
    url: string;
    icon?: string;
    siteName?: string;
  }>;
}

export interface SessionHistoryResponse {
  session_id: string;
  messages: BaseChatMessage[];
  created_at: string;
  updated_at: string;
}

// ==================== 会话元数据类型 ====================

/**
 * 会话元数据 - 用于会话列表显示
 */
export interface SessionMetadata {
  sessionId: string;
  title: string;         // 从第一条用户消息自动生成
  createdAt: number;     // 创建时间戳
  updatedAt: number;     // 最后更新时间戳
  messageCount: number;  // 消息数量
  previewText: string;   // 预览文本（最后一条消息的前50字符）
}

// ==================== 状态管理类型 ====================

export interface ChatSessionState {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// ==================== 工具函数 ====================

/**
 * 生成唯一消息ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建新的聊天消息
 */
export function createChatMessage(
  role: ChatMessage['role'],
  content: string
): ChatMessage {
  return {
    id: generateMessageId(),
    role,
    content,
    timestamp: Date.now(),
  };
}

/**
 * 将基础消息转换为完整消息
 */
export function toFullMessage(base: BaseChatMessage): ChatMessage {
  return {
    ...base,
    id: generateMessageId(),
    timestamp: Date.now(),
  };
}
