/**
 * AI聊天服务 API
 * 基于后端API文档: http://106.14.165.234:8086/apiDocumentation.html#/AI
 *
 * 接口列表:
 * - POST /app/ai/chat - 发送消息并获取回复
 * - GET /app/ai/check - AI服务健康检查
 * - GET /app/ai/chatHistory - 获取会话历史记录
 * - POST /app/ai/delete - 删除会话历史
 * - GET /app/aiQuestion/list - 获取AI问题示例列表
 */

import { getApiUrl } from '../utils/environment';
import { getCurrentToken } from './authAPI';
import {
  AIChatRequest,
  AIChatResponse,
  AIChatHistoryResponse,
  AIHealthCheckResponse,
  AIQuestionListResponse,
} from '../types/ai';

const getBaseUrl = () => getApiUrl();

class AIAPI {
  /**
   * 发送消息到AI并获取回复
   * POST /app/ai/chat
   *
   * @param message 用户消息内容
   * @param userId 用户ID
   * @returns AI回复
   */
  async sendMessage(message: string, userId: string): Promise<AIChatResponse> {
    try {
      const token = await getCurrentToken();

      if (!token) {
        throw new Error('用户未登录');
      }

      console.log('🤖 [AI API] 发送消息:', {
        messageLength: message.length,
        userId,
        url: `${getBaseUrl()}/app/ai/chat`
      });

      const response = await fetch(`${getBaseUrl()}/app/ai/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [AI API] 发送消息失败:', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`HTTP ${response.status}: ${errorText || 'AI服务请求失败'}`);
      }

      const data = await response.json();

      console.log('✅ [AI API] 收到回复:', {
        hasAnswer: !!data.answer,
        hasQuestion: !!data.question,
        sessionId: data.session_id,
      });

      return data;
    } catch (error: any) {
      console.error('❌ [AI API] sendMessage 错误:', error);
      throw new Error(error.message || 'AI服务暂时不可用，请稍后再试');
    }
  }

  /**
   * AI服务健康检查
   * GET /app/ai/check
   *
   * @returns 健康状态
   */
  async checkHealth(): Promise<AIHealthCheckResponse> {
    try {
      const token = await getCurrentToken();

      if (!token) {
        throw new Error('用户未登录');
      }

      console.log('🏥 [AI API] 健康检查:', `${getBaseUrl()}/app/ai/check`);

      const response = await fetch(`${getBaseUrl()}/app/ai/check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ [AI API] 健康状态:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [AI API] checkHealth 错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户的AI聊天历史记录
   * GET /app/ai/chatHistory
   *
   * @param userId 用户ID
   * @returns 聊天历史
   */
  async getChatHistory(userId: string): Promise<AIChatHistoryResponse> {
    try {
      const token = await getCurrentToken();

      if (!token) {
        throw new Error('用户未登录');
      }

      console.log('📜 [AI API] 获取聊天历史:', { userId });

      const response = await fetch(`${getBaseUrl()}/app/ai/chatHistory?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // 处理两种响应格式
      if (data.detail) {
        // 错误情况: {"detail": "会话不存在或已过期"}
        console.log('⚠️ [AI API] 会话不存在:', data.detail);
        return { detail: data.detail, history: [] };
      } else if (data.history) {
        // 成功情况: {"history": [...]}
        console.log('✅ [AI API] 历史记录:', {
          count: data.history.length,
        });
        return data;
      } else {
        // 未知格式，返回空历史
        console.log('⚠️ [AI API] 未知响应格式，返回空历史');
        return { history: [] };
      }
    } catch (error: any) {
      console.error('❌ [AI API] getChatHistory 错误:', error);
      throw error;
    }
  }

  /**
   * 删除用户的AI聊天历史
   * POST /app/ai/delete
   *
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deleteChatHistory(userId: string): Promise<{ message: string }> {
    try {
      const token = await getCurrentToken();

      if (!token) {
        throw new Error('用户未登录');
      }

      console.log('🗑️ [AI API] 删除聊天历史:', { userId });

      const response = await fetch(`${getBaseUrl()}/app/ai/delete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ [AI API] 删除成功:', data);

      return data;
    } catch (error: any) {
      console.error('❌ [AI API] deleteChatHistory 错误:', error);
      throw error;
    }
  }

  /**
   * 获取AI问题示例列表
   * GET /app/aiQuestion/list
   *
   * @returns 问题列表
   */
  async getQuestionList(): Promise<AIQuestionListResponse> {
    try {
      const token = await getCurrentToken();

      if (!token) {
        throw new Error('用户未登录');
      }

      console.log('📋 [AI API] 获取问题列表');

      const response = await fetch(`${getBaseUrl()}/app/aiQuestion/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ [AI API] 问题列表:', {
        count: data.data?.length || 0,
      });

      return data;
    } catch (error: any) {
      console.error('❌ [AI API] getQuestionList 错误:', error);
      throw error;
    }
  }
}

export const aiAPI = new AIAPI();
export default aiAPI;
