/**
 * AI Chat API Service
 * 连接 PomeloX Qwen AI 后端服务 (完整版RAG + 联网搜索)
 * 独立Python服务，端口8087
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentToken, getCurrentUserId, getCurrentDeptId } from './authAPI';
import { getApiUrl, getCurrentEnvironment } from '../utils/environment';
import { BaseChatMessage, ChatMessage, ChatResponse, SessionHistoryResponse } from '../types/chat';

// 存储键名
const STORAGE_KEYS = {
  SESSION_ID: '@pomelox_ai_session_id',
  MESSAGES_CACHE: '@pomelox_ai_messages_cache',
} as const;

// ==================== 类型定义 ====================

// 后端实际返回的响应格式
export interface BackendChatResponse {
  answer: string;
  question: string;
  session_id: string;
  rag_score?: number;
  school_id?: string;
  source_type?: string;
  web_sources?: {
    search_results?: Array<{
      title: string;
      url: string;
      icon?: string;
      site_name?: string;
    }>;
  };
}

// 重新导出统一类型供外部使用
export type { ChatMessage, ChatResponse, SessionHistoryResponse } from '../types/chat';

// ==================== 辅助函数 ====================

/**
 * 获取Qwen AI服务基础URL（根据环境动态配置）
 */
const getAIBaseUrl = () => {
  const environment = getCurrentEnvironment();

  if (environment === 'development') {
    return 'http://106.14.165.234:8087'; // 测试环境
  } else {
    return 'https://www.vitaglobal.icu/ai'; // 生产环境（通过nginx反向代理）
  }
};

/**
 * 构建请求头（JSON格式，Qwen服务不需要认证）
 */
const getHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  return headers;
};

// ==================== API 函数 ====================

/**
 * 发送消息到AI助手 (Qwen服务 /ask 端点)
 * @param message 用户消息内容
 * @returns AI回复响应
 */
export const sendMessage = async (
  message: string,
  externalSignal?: AbortSignal
): Promise<ChatResponse> => {
  try {
    const baseUrl = getAIBaseUrl();
    const headers = await getHeaders();
    const userId = await getCurrentUserId();
    const deptId = await getCurrentDeptId();
    const sessionId = await getStoredSessionId();

    // Qwen服务使用JSON body格式
    // 确保 deptId 是数字类型，后端支持所有 deptId（无知识库时自动 fallback 到 web search）
    const numericDeptId = typeof deptId === 'number' ? deptId : (deptId ? parseInt(String(deptId), 10) : 211);

    // 构建请求体，只包含非空字段避免后端校验问题
    const requestBody: Record<string, any> = {
      question: message,
      deptId: numericDeptId, // 必须是数字类型
    };

    // 只在有值时添加可选字段
    if (sessionId) {
      requestBody.session_id = sessionId;
    }
    if (userId) {
      requestBody.userId = userId;
    }

    const url = `${baseUrl}/ask`;

    console.log('[ChatAPI] 发送消息到Qwen服务:', {
      url,
      baseUrl,
      environment: getCurrentEnvironment(),
      messageLength: message.length,
      userId,
      deptId: requestBody.deptId,
      deptIdType: typeof requestBody.deptId,
      hasSession: !!sessionId,
    });

    // 带重试的请求函数
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // 检查外部是否已取消
      if (externalSignal?.aborted) {
        const cancelError = new Error('USER_CANCELLED');
        cancelError.name = 'AbortError';
        throw cancelError;
      }

      if (attempt > 0) {
        console.log(`[ChatAPI] 第${attempt + 1}次重试...`);
        // 重试前等待一小段时间
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      // 添加超时控制 (60秒)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[ChatAPI] 请求超时，取消请求');
        controller.abort();
      }, 60000);

      // 监听外部 signal，联动内部 controller
      if (externalSignal) {
        if (externalSignal.aborted) {
          clearTimeout(timeoutId);
          controller.abort();
        } else {
          externalSignal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            controller.abort();
          }, { once: true });
        }
      }

      try {
        console.log(`[ChatAPI] 开始fetch请求 (attempt ${attempt + 1})...`);
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('[ChatAPI] fetch完成, status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ChatAPI] HTTP错误:', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
          });
          throw new Error(`AI服务错误 (${response.status}): ${errorText || response.statusText}`);
        }

        // 解析Qwen服务响应
        const rawData = await response.json();
        console.log('[ChatAPI] 解析响应完成');

        // 检查错误响应
        if (rawData.error) {
          console.error('[ChatAPI] Qwen服务错误:', rawData.error);
          throw new Error(rawData.error);
        }

        // Qwen服务直接返回 {session_id, answer, question, source_type, rag_score, web_sources}
        const backendData: BackendChatResponse = rawData;

        // 保存会话ID
        if (backendData.session_id) {
          await saveSessionId(backendData.session_id);
        }

        // 安全处理 answer 字段
        const answer = backendData.answer || '';
        console.log('[ChatAPI] 收到Qwen回复:', {
          sessionId: backendData.session_id,
          sourceType: backendData.source_type,
          ragScore: backendData.rag_score,
          answerPreview: answer ? (answer.substring(0, 50) + (answer.length > 50 ? '...' : '')) : '(empty)',
        });

        // 转换 web_sources 格式
        const webSources = backendData.web_sources?.search_results?.map(src => ({
          title: src.title,
          url: src.url,
          icon: src.icon,
          siteName: src.site_name,
        }));

        // 转换为前端使用的格式
        const data: ChatResponse = {
          reply: answer,
          session_id: backendData.session_id || '',
          message_count: 0,
          sourceType: backendData.source_type,
          ragScore: backendData.rag_score,
          schoolId: backendData.school_id,
          webSources: webSources,
        };

        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // 用户主动取消 - 不重试
        if (externalSignal?.aborted) {
          console.log('[ChatAPI] 用户主动取消请求');
          const cancelError = new Error('USER_CANCELLED');
          cancelError.name = 'AbortError';
          throw cancelError;
        }

        // 超时错误
        if (fetchError.name === 'AbortError') {
          lastError = new Error('请求超时，请检查网络后重试');
          console.error(`[ChatAPI] 请求超时 (attempt ${attempt + 1})`);
          if (attempt < maxRetries) continue;
          throw lastError;
        }

        // 网络错误 (TypeError: Network request failed) - 可重试
        if (fetchError.message?.includes('Network request failed') || fetchError.message?.includes('network')) {
          lastError = fetchError;
          console.error(`[ChatAPI] 网络错误 (attempt ${attempt + 1}):`, fetchError.message);
          if (attempt < maxRetries) continue;
          throw new Error('网络连接失败，请检查网络设置后重试');
        }

        // 其他错误不重试
        console.error('[ChatAPI] 发送消息失败:', fetchError.message || fetchError);
        throw fetchError;
      }
    }

    // 所有重试都失败
    throw lastError || new Error('请求失败，请稍后重试');
  } catch (error: any) {
    // 透传已处理的错误
    throw error;
  }
};

/**
 * 获取会话历史记录 (Qwen服务 /history/<session_id> 端点)
 * @returns 会话历史
 */
export const getSessionHistory = async (): Promise<SessionHistoryResponse> => {
  try {
    const baseUrl = getAIBaseUrl();
    const headers = await getHeaders();
    const sessionId = await getStoredSessionId();

    if (!sessionId) {
      console.log('[ChatAPI] 无会话ID，返回空历史');
      return {
        session_id: '',
        messages: [],
        created_at: '',
        updated_at: '',
      };
    }

    const url = `${baseUrl}/history/${sessionId}`;

    console.log('[ChatAPI] 获取会话历史:', { sessionId });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        // 会话不存在，清除本地存储
        await clearSessionId();
        return {
          session_id: '',
          messages: [],
          created_at: '',
          updated_at: '',
        };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ChatAPI] 获取到历史消息');

    // Qwen服务返回 {session_id, dept_id, history: [{role, content}]}
    return {
      session_id: data.session_id || sessionId,
      messages: data.history || [],
      created_at: '',
      updated_at: '',
    };
  } catch (error) {
    console.error('[ChatAPI] 获取会话历史失败:', error);
    throw error;
  }
};

/**
 * 删除会话（清空历史）(Qwen服务 DELETE /clear/<session_id> 端点)
 */
export const deleteSession = async (): Promise<void> => {
  try {
    const baseUrl = getAIBaseUrl();
    const headers = await getHeaders();
    const sessionId = await getStoredSessionId();

    if (sessionId) {
      const url = `${baseUrl}/clear/${sessionId}`;

      console.log('[ChatAPI] 删除会话:', { sessionId });

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // 清除本地存储
    await clearSessionId();
    console.log('[ChatAPI] 会话已删除');
  } catch (error) {
    console.error('[ChatAPI] 删除会话失败:', error);
    throw error;
  }
};

/**
 * 健康检查 (Qwen服务 GET /health 端点)
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const baseUrl = getAIBaseUrl();

    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    return false;
  } catch (error) {
    console.error('[ChatAPI] 健康检查失败:', error);
    return false;
  }
};

// 常用问题项接口
export interface CommonQuestion {
  id: number;
  message: string;
  createTime?: string;
}

/**
 * 获取AI常用问题列表
 * GET /app/aiQuestion/list
 */
export const getCommonQuestions = async (): Promise<CommonQuestion[]> => {
  try {
    const baseUrl = getApiUrl();
    const headers = await getHeaders();

    const response = await fetch(`${baseUrl}/app/aiQuestion/list`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('[ChatAPI] 获取常用问题列表');

    // 返回格式: { code: 200, data: [...], len: 2 }
    if (result.code === 200 && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('[ChatAPI] 获取常用问题失败:', error);
    return [];
  }
};

// ==================== 本地存储辅助函数 ====================

/**
 * 保存会话ID到本地存储
 */
export const saveSessionId = async (sessionId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  } catch (error) {
    console.warn('[ChatAPI] 保存会话ID失败:', error);
  }
};

/**
 * 获取存储的会话ID
 */
export const getStoredSessionId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);
  } catch (error) {
    console.warn('[ChatAPI] 获取会话ID失败:', error);
    return null;
  }
};

/**
 * 清除存储的会话ID
 */
export const clearSessionId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES_CACHE);
  } catch (error) {
    console.warn('[ChatAPI] 清除会话ID失败:', error);
  }
};

/**
 * 缓存消息到本地（用于快速显示）
 */
export const cacheMessages = async (messages: ChatMessage[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES_CACHE, JSON.stringify(messages));
  } catch (error) {
    console.warn('[ChatAPI] 缓存消息失败:', error);
  }
};

/**
 * 获取缓存的消息
 */
export const getCachedMessages = async (): Promise<ChatMessage[]> => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES_CACHE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.warn('[ChatAPI] 获取缓存消息失败:', error);
    return [];
  }
};

// ==================== SSE 流式传输 ====================

/**
 * SSE 流式事件类型
 */
export interface SSEEvent {
  type: 'start' | 'chunk' | 'done' | 'error';
  content?: string;
  session_id?: string;
  full_content?: string;
  message?: string;
}

/**
 * 流式发送消息的回调参数
 */
export interface StreamCallbacks {
  onChunk: (chunk: string, accumulatedContent: string) => void;
  onDone?: (fullContent: string, sessionId: string) => void;
  onError?: (error: string) => void;
  onStart?: (sessionId: string) => void;
}

/**
 * 解析 SSE 行数据
 */
const parseSSELine = (line: string): SSEEvent | null => {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('data: ')) return null;
  try {
    const jsonStr = trimmed.slice(6); // Remove "data: " prefix
    return JSON.parse(jsonStr) as SSEEvent;
  } catch (e) {
    console.warn('[ChatAPI] SSE 解析失败:', trimmed);
    return null;
  }
};

/**
 * 发送流式消息到AI助手 (SSE /api/ai/chat/stream 端点)
 * @param message 用户消息内容
 * @param callbacks 流式回调函数
 * @param externalSignal 外部取消信号
 * @returns AI完整回复响应
 */
export const sendMessageStream = async (
  message: string,
  callbacks: StreamCallbacks,
  externalSignal?: AbortSignal
): Promise<ChatResponse> => {
  const baseUrl = getAIBaseUrl();
  const headers = await getHeaders();
  const userId = await getCurrentUserId();
  const deptId = await getCurrentDeptId();
  const sessionId = await getStoredSessionId();

  const numericDeptId = typeof deptId === 'number' ? deptId : (deptId ? parseInt(String(deptId), 10) : 211);

  const requestBody: Record<string, any> = {
    message: message,
    dept_id: numericDeptId,
  };

  if (sessionId) {
    requestBody.session_id = sessionId;
  }
  if (userId) {
    requestBody.userId = userId;
  }

  const url = `${baseUrl}/api/ai/chat/stream`;

  console.log('[ChatAPI] SSE 流式请求:', {
    url,
    environment: getCurrentEnvironment(),
    messageLength: message.length,
    userId,
    deptId: numericDeptId,
    hasSession: !!sessionId,
  });

  // 超时控制 (90秒 - 流式需要更长时间)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('[ChatAPI] SSE 请求超时');
    controller.abort();
  }, 90000);

  // 监听外部 signal
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      const cancelError = new Error('USER_CANCELLED');
      cancelError.name = 'AbortError';
      throw cancelError;
    }
    externalSignal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      controller.abort();
    }, { once: true });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI服务错误 (${response.status}): ${errorText || response.statusText}`);
    }

    // 读取流式响应
    let accumulatedContent = '';
    let finalSessionId = sessionId || '';
    let fullContent = '';

    // React Native fetch returns a response with a body that we can read as text
    // We need to handle both ReadableStream (web) and React Native's response body
    const reader = response.body?.getReader();

    if (reader) {
      // ReadableStream available (React Native with Hermes supports this)
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        // Check if cancelled
        if (externalSignal?.aborted) {
          reader.cancel();
          const cancelError = new Error('USER_CANCELLED');
          cancelError.name = 'AbortError';
          throw cancelError;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from buffer
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const event = parseSSELine(line);
          if (!event) continue;

          switch (event.type) {
            case 'start':
              if (event.session_id) {
                finalSessionId = event.session_id;
                callbacks.onStart?.(event.session_id);
              }
              break;

            case 'chunk':
              if (event.content) {
                accumulatedContent += event.content;
                callbacks.onChunk(event.content, accumulatedContent);
              }
              break;

            case 'done':
              fullContent = event.full_content || accumulatedContent;
              if (event.session_id) {
                finalSessionId = event.session_id;
              }
              callbacks.onDone?.(fullContent, finalSessionId);
              break;

            case 'error':
              const errorMsg = event.message || 'Unknown streaming error';
              callbacks.onError?.(errorMsg);
              throw new Error(errorMsg);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const event = parseSSELine(buffer);
        if (event) {
          if (event.type === 'chunk' && event.content) {
            accumulatedContent += event.content;
            callbacks.onChunk(event.content, accumulatedContent);
          } else if (event.type === 'done') {
            fullContent = event.full_content || accumulatedContent;
            if (event.session_id) finalSessionId = event.session_id;
            callbacks.onDone?.(fullContent, finalSessionId);
          }
        }
      }
    } else {
      // Fallback: read full response as text and parse SSE lines
      // This handles cases where ReadableStream is not available
      console.log('[ChatAPI] ReadableStream not available, falling back to text parsing');
      const text = await response.text();
      const lines = text.split('\n');

      for (const line of lines) {
        const event = parseSSELine(line);
        if (!event) continue;

        switch (event.type) {
          case 'start':
            if (event.session_id) {
              finalSessionId = event.session_id;
              callbacks.onStart?.(event.session_id);
            }
            break;
          case 'chunk':
            if (event.content) {
              accumulatedContent += event.content;
              callbacks.onChunk(event.content, accumulatedContent);
            }
            break;
          case 'done':
            fullContent = event.full_content || accumulatedContent;
            if (event.session_id) finalSessionId = event.session_id;
            callbacks.onDone?.(fullContent, finalSessionId);
            break;
          case 'error':
            const errorMsg = event.message || 'Unknown streaming error';
            callbacks.onError?.(errorMsg);
            throw new Error(errorMsg);
        }
      }
    }

    // Use fullContent if available, otherwise use accumulated
    const finalContent = fullContent || accumulatedContent;

    // Save session ID
    if (finalSessionId) {
      await saveSessionId(finalSessionId);
    }

    console.log('[ChatAPI] SSE 流式完成:', {
      sessionId: finalSessionId,
      contentLength: finalContent.length,
      contentPreview: finalContent.substring(0, 50) + (finalContent.length > 50 ? '...' : ''),
    });

    return {
      reply: finalContent,
      session_id: finalSessionId,
      message_count: 0,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (externalSignal?.aborted || error.message === 'USER_CANCELLED') {
      const cancelError = new Error('USER_CANCELLED');
      cancelError.name = 'AbortError';
      throw cancelError;
    }

    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }

    throw error;
  }
};

// ==================== 导出默认对象 ====================

const chatAPI = {
  sendMessage,
  sendMessageStream,
  getSessionHistory,
  deleteSession,
  healthCheck,
  getCommonQuestions,
  saveSessionId,
  getStoredSessionId,
  clearSessionId,
  cacheMessages,
  getCachedMessages,
};

export default chatAPI;
