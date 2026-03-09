/**
 * AI Chat Session Storage Module
 * 多会话管理：存储、加载、删除会话
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage, SessionMetadata } from '../types/chat';

// 存储键常量
const STORAGE_KEYS = {
  SESSIONS_LIST: '@ai_sessions_list',
  CURRENT_SESSION_ID: '@ai_current_session_id',
  SESSION_PREFIX: '@ai_session_',
  // 旧版存储键（用于迁移）
  LEGACY_SESSION_ID: '@ai_session_id',
  LEGACY_MESSAGES: '@ai_messages',
};

// 消息数量限制
const MAX_MESSAGES_PER_SESSION = 100;

/**
 * 生成新的会话ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从消息内容生成会话标题（取第一条用户消息的前20个字符）
 */
export function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    return content.length > 20 ? content.substring(0, 20) + '...' : content;
  }
  return '新对话';
}

/**
 * 获取会话预览文本（最后一条消息的前50个字符）
 */
export function getPreviewText(messages: ChatMessage[]): string {
  if (messages.length === 0) return '';
  const lastMessage = messages[messages.length - 1];
  const content = lastMessage.content.trim();
  return content.length > 50 ? content.substring(0, 50) + '...' : content;
}

/**
 * 限制消息数量（保留最新的100条）
 */
export function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_PER_SESSION) {
    return messages;
  }
  return messages.slice(-MAX_MESSAGES_PER_SESSION);
}

/**
 * 获取所有会话列表元数据
 */
export async function loadAllSessions(): Promise<SessionMetadata[]> {
  try {
    const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS_LIST);
    if (sessionsJson) {
      const sessions: SessionMetadata[] = JSON.parse(sessionsJson);
      // 按更新时间降序排序
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return [];
  } catch (error) {
    console.error('[SessionStorage] loadAllSessions error:', error);
    return [];
  }
}

/**
 * 保存会话列表元数据
 */
async function saveSessionsList(sessions: SessionMetadata[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS_LIST, JSON.stringify(sessions));
  } catch (error) {
    console.error('[SessionStorage] saveSessionsList error:', error);
  }
}

/**
 * 加载指定会话的消息
 */
export async function loadSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const messagesJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_PREFIX + sessionId);
    if (messagesJson) {
      return JSON.parse(messagesJson);
    }
    return [];
  } catch (error) {
    console.error('[SessionStorage] loadSessionMessages error:', error);
    return [];
  }
}

/**
 * 保存指定会话的消息（自动更新会话列表元数据）
 */
export async function saveSessionMessages(
  sessionId: string,
  messages: ChatMessage[]
): Promise<void> {
  try {
    // 限制消息数量
    const trimmedMessages = trimMessages(messages);

    // 保存消息数据
    await AsyncStorage.setItem(
      STORAGE_KEYS.SESSION_PREFIX + sessionId,
      JSON.stringify(trimmedMessages)
    );

    // 更新会话列表元数据
    const sessions = await loadAllSessions();
    const existingIndex = sessions.findIndex(s => s.sessionId === sessionId);

    const sessionMetadata: SessionMetadata = {
      sessionId,
      title: generateSessionTitle(trimmedMessages),
      createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : Date.now(),
      updatedAt: Date.now(),
      messageCount: trimmedMessages.length,
      previewText: getPreviewText(trimmedMessages),
    };

    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionMetadata;
    } else {
      sessions.unshift(sessionMetadata);
    }

    await saveSessionsList(sessions);
  } catch (error) {
    console.error('[SessionStorage] saveSessionMessages error:', error);
  }
}

/**
 * 删除指定会话
 */
export async function deleteSessionById(sessionId: string): Promise<void> {
  try {
    // 删除消息数据
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_PREFIX + sessionId);

    // 从会话列表中移除
    const sessions = await loadAllSessions();
    const filteredSessions = sessions.filter(s => s.sessionId !== sessionId);
    await saveSessionsList(filteredSessions);

    // 如果删除的是当前会话，清除当前会话ID
    const currentSessionId = await getCurrentSessionId();
    if (currentSessionId === sessionId) {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    }
  } catch (error) {
    console.error('[SessionStorage] deleteSessionById error:', error);
  }
}

/**
 * 清空所有会话
 */
export async function clearAllSessions(): Promise<void> {
  try {
    const sessions = await loadAllSessions();

    // 删除所有会话消息数据
    const keysToRemove = sessions.map(s => STORAGE_KEYS.SESSION_PREFIX + s.sessionId);
    keysToRemove.push(STORAGE_KEYS.SESSIONS_LIST);
    keysToRemove.push(STORAGE_KEYS.CURRENT_SESSION_ID);

    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    console.error('[SessionStorage] clearAllSessions error:', error);
  }
}

/**
 * 获取当前会话ID
 */
export async function getCurrentSessionId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
  } catch (error) {
    console.error('[SessionStorage] getCurrentSessionId error:', error);
    return null;
  }
}

/**
 * 设置当前会话ID
 */
export async function setCurrentSessionId(sessionId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, sessionId);
  } catch (error) {
    console.error('[SessionStorage] setCurrentSessionId error:', error);
  }
}

/**
 * 迁移旧版数据格式到新格式
 * 首次启动时调用，将旧的单一会话数据迁移为新的多会话格式
 */
export async function migrateOldSession(): Promise<void> {
  try {
    // 检查是否有旧版数据
    const legacySessionId = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_SESSION_ID);
    const legacyMessages = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_MESSAGES);

    if (legacyMessages) {
      const messages: ChatMessage[] = JSON.parse(legacyMessages);

      if (messages.length > 0) {
        // 生成新的会话ID（如果旧ID存在则使用旧ID）
        const sessionId = legacySessionId || generateSessionId();

        // 保存到新格式
        await saveSessionMessages(sessionId, messages);
        await setCurrentSessionId(sessionId);

        console.log('[SessionStorage] Migration completed: migrated', messages.length, 'messages');
      }

      // 清除旧版数据
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LEGACY_SESSION_ID,
        STORAGE_KEYS.LEGACY_MESSAGES,
      ]);
    }
  } catch (error) {
    console.error('[SessionStorage] migrateOldSession error:', error);
  }
}

/**
 * 初始化会话存储（包含迁移逻辑）
 */
export async function initializeSessionStorage(): Promise<{
  currentSessionId: string | null;
  messages: ChatMessage[];
  sessions: SessionMetadata[];
}> {
  try {
    // 先执行迁移
    await migrateOldSession();

    // 加载所有会话
    const sessions = await loadAllSessions();

    // 获取当前会话ID
    let currentSessionId = await getCurrentSessionId();

    // 如果没有当前会话但有历史会话，使用最新的
    if (!currentSessionId && sessions.length > 0) {
      currentSessionId = sessions[0].sessionId;
      await setCurrentSessionId(currentSessionId);
    }

    // 加载当前会话消息
    const messages = currentSessionId
      ? await loadSessionMessages(currentSessionId)
      : [];

    return {
      currentSessionId,
      messages,
      sessions,
    };
  } catch (error) {
    console.error('[SessionStorage] initializeSessionStorage error:', error);
    return {
      currentSessionId: null,
      messages: [],
      sessions: [],
    };
  }
}
