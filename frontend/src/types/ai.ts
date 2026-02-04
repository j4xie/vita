/**
 * AI Chat 服务类型定义
 * 重新导出统一的聊天类型
 */

// 重新导出统一的聊天类型
export type {
  BaseChatMessage,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  SessionHistoryResponse,
  ChatSessionState,
  AIMessageMetadata,
} from './chat';

export {
  generateMessageId,
  createChatMessage,
  toFullMessage,
} from './chat';

// 为向后兼容保留的别名
export type AISessionState = import('./chat').ChatSessionState;
