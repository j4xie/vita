/**
 * useAIFormFilling Hook
 * 管理 AI 表单填写的状态和逻辑
 * 直接使用 chatAPI，无需 aiFormAPI 中间层
 */

import { useState, useCallback, useRef } from 'react';
import { FrontendUser } from '../types/user';
import { ChatMessage, createChatMessage } from '../types/chat';
import { FormField, UserProfile } from '../types/form';
import chatAPI from '../services/chatAPI';
import formAutoFill from '../utils/formAutoFill';

// ==================== 类型定义 ====================

// 重新导出类型供外部使用
export type { ChatMessage } from '../types/chat';
export type { FormField, UserProfile } from '../types/form';

export interface AIFormResponse {
  displayText: string;
  extractedFields: Record<string, unknown>;
  isComplete: boolean;
}

export interface AIFormFillingState {
  messages: ChatMessage[];
  formData: Record<string, unknown>;
  autoFilledData: Record<string, unknown>;
  progress: number;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  autoFilledLabels: string[];
}

export interface UseAIFormFillingReturn extends AIFormFillingState {
  startSession: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  updateField: (field: string, value: unknown) => void;
  reset: () => Promise<void>;
  getSubmitData: () => Record<string, unknown>;
}

// ==================== Prompt 工具函数 ====================

/**
 * 构造表单填写的系统提示词
 */
function buildFormFillingPrompt(
  activityName: string,
  userProfile: UserProfile,
  collectedData: Record<string, unknown>,
  remainingFields: FormField[]
): string {
  const fieldsDesc = remainingFields.map(f => {
    let desc = `- ${f.label} (字段名: ${f.vModel})`;
    if (f.required) desc += ' [必填]';
    if (f.tag === 'el-textarea') desc += ' [可以详细描述]';
    if (f.options && f.options.length > 0) {
      desc += ` 可选项: ${f.options.map(o => o.label).join('、')}`;
    }
    return desc;
  }).join('\n');

  const userInfoParts: string[] = [];
  if (userProfile.realName) userInfoParts.push(`姓名: ${userProfile.realName}`);
  if (userProfile.phone) userInfoParts.push(`电话: ${userProfile.phone}`);
  if (userProfile.email) userInfoParts.push(`邮箱: ${userProfile.email}`);
  if (userProfile.schoolName) userInfoParts.push(`学校: ${userProfile.schoolName}`);

  const userInfoStr = userInfoParts.length > 0
    ? userInfoParts.join('、')
    : '暂无';

  const collectedStr = Object.keys(collectedData).length > 0
    ? JSON.stringify(collectedData)
    : '暂无';

  return `你是「${activityName}」活动的报名助手，正在帮助用户填写报名表单。

用户已知信息: ${userInfoStr}

已收集的表单数据: ${collectedStr}

还需要收集的字段:
${fieldsDesc}

重要规则:
1. 每次只问1个问题，用友好简洁的语气
2. 对于选择题，清楚列出可选项
3. 对于描述性问题，鼓励用户多说一些
4. 从用户回答中提取信息后，在回复末尾添加标记: 【已提取: {"字段名": "值"}】
5. 如果用户回答模糊，礼貌地请求更明确的答案
6. 所有必填字段收集完成后，说"信息收集完成，请确认提交"并添加标记: 【完成】

现在请开始提问第一个问题:`;
}

/**
 * 从 AI 回复中解析提取的字段
 */
function parseAIResponse(reply: string | undefined): AIFormResponse {
  if (!reply || typeof reply !== 'string') {
    console.warn('[useAIFormFilling] 收到空回复');
    return { displayText: '', extractedFields: {}, isComplete: false };
  }

  let displayText = reply;
  let extractedFields: Record<string, unknown> = {};
  let isComplete = false;

  // 解析 【已提取: {...}】
  const extractMatch = reply.match(/【已提取:\s*(\{[^】]+\})】/);
  if (extractMatch) {
    try {
      extractedFields = JSON.parse(extractMatch[1]);
      displayText = reply.replace(/【已提取:[^】]+】/g, '').trim();
    } catch (e) {
      console.warn('[useAIFormFilling] 解析提取字段失败:', e);
    }
  }

  // 检查是否完成
  if (reply.includes('【完成】')) {
    isComplete = true;
    displayText = displayText.replace(/【完成】/g, '').trim();
  }

  return { displayText: displayText.trim(), extractedFields, isComplete };
}

// ==================== Hook 实现 ====================

export function useAIFormFilling(
  activityName: string,
  formSchema: FormField[],
  user: FrontendUser | null
): UseAIFormFillingReturn {
  // 计算自动填充数据
  const { autoFilled, remainingFields, autoFilledLabels } = formAutoFill.getAutoFillData(formSchema, user);

  // 状态
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref 用于追踪当前会话
  const messageIdCounter = useRef(0);

  /**
   * 生成唯一消息 ID
   */
  const generateMessageId = useCallback(() => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}`;
  }, []);

  /**
   * 添加消息到列表
   */
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, [generateMessageId]);

  /**
   * 处理 AI 响应 - 使用函数式更新避免闭包问题
   */
  const handleAIResponse = useCallback((response: AIFormResponse) => {
    // 添加 AI 消息
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: response.displayText,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, message]);

    // 更新表单数据
    if (Object.keys(response.extractedFields).length > 0) {
      setFormData(prev => {
        const newData = { ...prev, ...response.extractedFields };
        // 计算进度
        const newProgress = formAutoFill.calculateProgress(formSchema, {
          ...autoFilled,
          ...newData,
        });
        setProgress(newProgress);
        return newData;
      });
    }

    // 检查是否完成
    if (response.isComplete) {
      setIsComplete(true);
    }
  }, [formSchema, autoFilled]);

  /**
   * 开始 AI 填表会话
   */
  const startSession = useCallback(async () => {
    console.log('[useAIFormFilling] 开始会话...', { activityName, remainingFieldsCount: remainingFields.length });
    setIsLoading(true);
    setError(null);

    try {
      // 重置会话（忽略错误）
      try {
        await chatAPI.deleteSession();
      } catch (resetErr) {
        console.warn('[useAIFormFilling] 重置会话失败(可忽略):', resetErr);
      }

      // 清空消息和表单数据
      setMessages([]);
      setFormData({});
      setIsComplete(false);
      setProgress(0);
      messageIdCounter.current = 0;

      // 获取用户信息
      const userProfile = formAutoFill.extractUserProfile(user);
      console.log('[useAIFormFilling] 用户信息:', userProfile);

      // 构建 Prompt 并发送
      const prompt = buildFormFillingPrompt(activityName, userProfile, {}, remainingFields);
      console.log('[useAIFormFilling] 发送初始 Prompt, 长度:', prompt.length);

      const chatResponse = await chatAPI.sendMessage(prompt);
      const response = parseAIResponse(chatResponse.reply);

      console.log('[useAIFormFilling] 收到AI响应:', response);

      // 处理响应
      if (response && response.displayText) {
        handleAIResponse(response);
      } else {
        // 如果没有响应，显示默认问候语
        const fallbackMessage: ChatMessage = {
          id: `msg_${Date.now()}_fallback`,
          role: 'assistant',
          content: `您好！我是活动报名助手。请告诉我您的信息，我来帮您填写报名表单。`,
          timestamp: Date.now(),
        };
        setMessages([fallbackMessage]);
      }
    } catch (err) {
      console.error('[useAIFormFilling] 开始会话失败:', err);
      const errorMsg = err instanceof Error ? err.message : '开始会话失败，请重试';
      setError(errorMsg);

      // 根据错误类型显示不同的提示
      let displayMessage = '抱歉，连接AI助手时出现问题。请点击右上角刷新按钮重试。';
      if (errorMsg.includes('认证失败') || errorMsg.includes('401')) {
        displayMessage = '登录已过期，请退出后重新登录再试。';
      } else if (errorMsg.includes('网络') || errorMsg.includes('Network')) {
        displayMessage = '网络连接失败，请检查网络后重试。';
      }

      // 显示错误提示消息
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: displayMessage,
        timestamp: Date.now(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [activityName, remainingFields, user, handleAIResponse]);

  /**
   * 发送用户消息
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // 添加用户消息
    addMessage('user', text.trim());

    try {
      const chatResponse = await chatAPI.sendMessage(text.trim());
      const response = parseAIResponse(chatResponse.reply);
      handleAIResponse(response);
    } catch (err) {
      console.error('[useAIFormFilling] 发送消息失败:', err);
      setError(err instanceof Error ? err.message : '发送失败');

      // 添加错误提示消息
      addMessage('assistant', '抱歉，我遇到了一些问题。请重试或手动填写表单。');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, addMessage, handleAIResponse]);

  /**
   * 手动更新字段值
   */
  const updateField = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 重新计算进度
    const newFormData = { ...formData, [field]: value };
    const newProgress = formAutoFill.calculateProgress(formSchema, {
      ...autoFilled,
      ...newFormData,
    });
    setProgress(newProgress);
  }, [formData, formSchema, autoFilled]);

  /**
   * 重置会话
   */
  const reset = useCallback(async () => {
    setMessages([]);
    setFormData({});
    setProgress(0);
    setIsComplete(false);
    setError(null);
    messageIdCounter.current = 0;

    try {
      await chatAPI.deleteSession();
    } catch (err) {
      console.warn('[useAIFormFilling] 重置会话失败:', err);
    }
  }, []);

  /**
   * 获取完整的提交数据（自动填充 + AI 收集）
   */
  const getSubmitData = useCallback(() => {
    return {
      ...autoFilled,
      ...formData,
    };
  }, [autoFilled, formData]);

  return {
    // 状态
    messages,
    formData,
    autoFilledData: autoFilled,
    progress,
    isComplete,
    isLoading,
    error,
    autoFilledLabels,

    // 方法
    startSession,
    sendMessage,
    updateField,
    reset,
    getSubmitData,
  };
}

export default useAIFormFilling;
