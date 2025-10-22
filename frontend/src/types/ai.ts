/**
 * AI Chat 服务类型定义
 * 基于后端API文档: http://106.14.165.234:8086/apiDocumentation.html#/AI
 */

// ==================== 消息相关类型 ====================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string; // 本地添加的时间戳
}

// ==================== API 请求类型 ====================

/**
 * AI聊天请求
 * POST /app/ai/chat
 */
export interface AIChatRequest {
  message: string;
  userId: string;
}

/**
 * AI聊天响应
 * 根据API文档返回格式
 */
export interface AIChatResponse {
  answer: string; // AI的回复内容
  question: string; // 用户的问题
  session_id: string; // 会话ID（后端自动管理）
}

// ==================== 历史记录相关类型 ====================

/**
 * 聊天历史项
 */
export interface ChatHistoryItem {
  content: string; // 消息内容
  role: 'user' | 'assistant'; // 角色
}

/**
 * 聊天历史响应
 * GET /app/ai/chatHistory
 *
 * 成功时返回: {"history": [...]}
 * 失败时返回: {"detail": "会话不存在或已过期"}
 */
export interface AIChatHistoryResponse {
  history?: ChatHistoryItem[]; // 历史消息列表（成功时存在）
  detail?: string; // 错误详情（失败时存在）
}

// ==================== 健康检查相关类型 ====================

/**
 * AI服务健康检查响应
 * GET /app/ai/check
 */
export interface AIHealthCheckResponse {
  status: 'healthy' | 'unhealthy';
}

// ==================== 问题列表相关类型 ====================

/**
 * AI问题示例项
 * 实际返回格式（2025-10-19 联调确认）
 */
export interface AIQuestionItem {
  createBy: string | null;
  createTime: string; // 创建时间 "2025-10-17 16:45:48"
  updateBy: string | null;
  updateTime: string | null;
  remark: string | null;
  id: number;
  message: string; // 问题内容（注意：字段名是message不是question）
  createById: number | null;
  createByName: string | null;
}

/**
 * AI问题列表响应
 * GET /app/aiQuestion/list
 * 实际返回格式（2025-10-19 联调确认）
 */
export interface AIQuestionListResponse {
  msg: string;
  code: number;
  data: AIQuestionItem[];
  len: number; // 数据长度
}

// ==================== 前端状态管理类型 ====================

/**
 * AI会话状态（前端）
 */
export interface AISessionState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// ==================== 已废弃类型（保留兼容性） ====================

/**
 * @deprecated 使用 AIChatRequest 替代
 */
export interface ChatRequest {
  message: string;
  session_id?: string;
  user_id?: string;
}

/**
 * @deprecated 使用 AIChatResponse 替代
 */
export interface ChatResponse {
  reply: string;
  session_id: string;
  message_count: number;
}

/**
 * @deprecated 使用 AIChatHistoryResponse 替代
 */
export interface SessionHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}
