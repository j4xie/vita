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
      requestBody: JSON.stringify(requestBody),
    });

    // 添加超时控制 (60秒)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[ChatAPI] 请求超时，取消请求');
      controller.abort();
    }, 60000);

    // 监听外部 signal，联动内部 controller
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    console.log('[ChatAPI] 开始fetch请求...');
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
        requestUrl: url,
        requestBody: JSON.stringify(requestBody),
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

    console.log('[ChatAPI] 元数据:', {
      sourceType: data.sourceType,
      ragScore: data.ragScore,
      webSourcesCount: webSources?.length || 0,
    });

    return data;
  } catch (error: any) {
    // 处理取消/超时错误
    if (error.name === 'AbortError') {
      if (externalSignal?.aborted) {
        console.log('[ChatAPI] 用户主动取消请求');
        const cancelError = new Error('USER_CANCELLED');
        cancelError.name = 'AbortError';
        throw cancelError;
      }
      console.error('[ChatAPI] 请求超时');
      throw new Error('请求超时，请稍后重试');
    }
    console.error('[ChatAPI] 发送消息失败:', error.message || error);
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

// ==================== 导出默认对象 ====================

const chatAPI = {
  sendMessage,
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
