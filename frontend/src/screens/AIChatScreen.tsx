import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Markdown from 'react-native-markdown-display';

import { ChatMessage } from '../types/ai';
import { SessionMetadata } from '../types/chat';
import { sendMessage as sendChatMessage, sendMessageStream, getCommonQuestions, CommonQuestion } from '../services/chatAPI';
import { ThinkingIndicator } from '../components/ai/ThinkingIndicator';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../components/common/KeyboardDismissWrapper';
import { ChatHistoryBottomSheet } from '../components/ai/ChatHistoryBottomSheet';
import {
  initializeSessionStorage,
  saveSessionMessages,
  loadSessionMessages,
  deleteSessionById,
  clearAllSessions,
  setCurrentSessionId,
  generateSessionId,
  loadAllSessions,
} from '../utils/sessionStorage';

type Props = NativeStackScreenProps<any, 'AIChat'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 引导问题库 - 涵盖留学生全场景需求 (使用Ionicons)
const QUESTION_POOL = [
  // 📚 教育答疑场景
  { icon: 'book-outline', iconColor: '#5856D6', key: 'study_resources', category: 'education' },
  { icon: 'library-outline', iconColor: '#AF52DE', key: 'library_guide', category: 'education' },
  { icon: 'school-outline', iconColor: '#007AFF', key: 'campus_rules', category: 'education' },
  { icon: 'create-outline', iconColor: '#32ADE6', key: 'writing_help', category: 'education' },

  // 🛂 留学生政策咨询
  { icon: 'airplane-outline', iconColor: '#FF9500', key: 'visa_policy', category: 'policy' },
  { icon: 'document-text-outline', iconColor: '#FF6B35', key: 'work_permit', category: 'policy' },
  { icon: 'shield-checkmark-outline', iconColor: '#34C759', key: 'legal_advice', category: 'policy' },
  { icon: 'card-outline', iconColor: '#30B0C7', key: 'immigration_status', category: 'policy' },

  // 🏘️ 本地生活助手
  { icon: 'home-outline', iconColor: '#FF3B30', key: 'housing_tips', category: 'local' },
  { icon: 'bus-outline', iconColor: '#007AFF', key: 'transportation', category: 'local' },
  { icon: 'medical-outline', iconColor: '#FF2D55', key: 'healthcare', category: 'local' },
  { icon: 'cart-outline', iconColor: '#5AC8FA', key: 'shopping_guide', category: 'local' },
  { icon: 'wallet-outline', iconColor: '#FFD60A', key: 'banking_finance', category: 'local' },

  // 👥 社交引导场景
  { icon: 'calendar-outline', iconColor: '#FF9500', key: 'event_planning', category: 'social' },
  { icon: 'chatbubble-outline', iconColor: '#32ADE6', key: 'post_writing', category: 'social' },
  { icon: 'people-outline', iconColor: '#34C759', key: 'volunteer_guide', category: 'social' },
  { icon: 'heart-outline', iconColor: '#FF3B30', key: 'community_tips', category: 'social' },
  { icon: 'star-outline', iconColor: '#FFD60A', key: 'activity_suggest', category: 'social' },

  // 💰 财务理财场景
  { icon: 'receipt-outline', iconColor: '#FF6B35', key: 'tax_filing', category: 'finance' },
  { icon: 'trending-up-outline', iconColor: '#34C759', key: 'credit_score', category: 'finance' },

  // 🎓 学术深度场景
  { icon: 'calculator-outline', iconColor: '#5856D6', key: 'gpa_calculation', category: 'education' },
  { icon: 'clipboard-outline', iconColor: '#007AFF', key: 'course_registration', category: 'education' },

  // 🍽️ 餐饮美食场景
  { icon: 'restaurant-outline', iconColor: '#FF9500', key: 'dining_options', category: 'food' },
  { icon: 'basket-outline', iconColor: '#34C759', key: 'chinese_grocery', category: 'food' },

  // 🏥 健康保障场景
  { icon: 'fitness-outline', iconColor: '#FF2D55', key: 'health_insurance', category: 'health' },
  { icon: 'happy-outline', iconColor: '#AF52DE', key: 'mental_health', category: 'health' },

  // 📱 科技生活场景
  { icon: 'phone-portrait-outline', iconColor: '#007AFF', key: 'phone_plan', category: 'tech' },

  // 🚗 日常出行场景
  { icon: 'car-outline', iconColor: '#FF6B35', key: 'drivers_license', category: 'daily' },
];

// 随机选择3个引导问题
const getRandomQuestions = () => {
  const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

export const AIChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getRandomQuestions());
  const [backendQuestions, setBackendQuestions] = useState<CommonQuestion[]>([]);

  // 多会话管理状态
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  // 打字机效果状态
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [typingText, setTypingText] = useState('');
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // AbortController ref - 用于中断AI思考
  const abortControllerRef = useRef<AbortController | null>(null);

  // 滚动状态 - 用于判断是否自动滚动
  // 基于滚动位置而不是时间，这样用户向上查看历史消息时不会被打断
  const isAtBottomRef = useRef(true);
  const scrollPositionRef = useRef({ contentHeight: 0, containerHeight: 0, offset: 0 });

  // 从路由参数获取初始消息
  const initialMessage = route.params?.initialMessage as string | undefined;

  // 清理定时器和中断请求
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  // 打字机效果函数（前5秒逐字显示，超过5秒一次性显示剩余）
  const startTypingEffect = (messageIndex: number, fullText: string) => {
    setTypingMessageIndex(messageIndex);
    setTypingText('');

    let charIndex = 0;
    let lastScrollTime = 0;
    const startTime = Date.now();

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < fullText.length) {
        // 超过5秒，直接显示剩余全部文字
        if (Date.now() - startTime >= 5000) {
          setTypingText(fullText);
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
          setTypingMessageIndex(null);
          setTypingText('');
          if (isAtBottomRef.current) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
          return;
        }

        setTypingText(fullText.slice(0, charIndex + 1));
        charIndex++;
        // 只在用户在底部时自动滚动，且限制滚动频率
        const now = Date.now();
        if (isAtBottomRef.current && now - lastScrollTime > 100) {
          lastScrollTime = now;
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      } else {
        // 打字完成
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setTypingMessageIndex(null);
        setTypingText('');
      }
    }, 2); // 2ms 每个字符（极速打字）
  };

  // 跳过打字效果，直接显示全文
  const skipTyping = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setTypingMessageIndex(null);
    setTypingText('');
  };

  // 加载后端常用问题
  useEffect(() => {
    getCommonQuestions()
      .then(questions => {
        if (questions.length > 0) {
          setBackendQuestions(questions);
        }
      })
      .catch(err => console.error('[AIChatScreen] Failed to load backend questions:', err));
  }, []);

  // 加载保存的会话
  useEffect(() => {
    loadSession();
  }, []);

  // 处理初始消息
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  // 加载会话（每次进入都是新会话，历史记录仅通过历史按钮访问）
  const loadSession = async () => {
    try {
      // 先执行迁移并加载会话列表（只显示有消息的会话）
      const { sessions: loadedSessions } = await initializeSessionStorage();
      setSessions(loadedSessions.filter(s => s.messageCount > 0));

      // 每次进入都创建新会话（不自动加载上一个会话）
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setMessages([]);
      await setCurrentSessionId(newSessionId);
    } catch (error) {
      console.error('Load session error:', error);
    }
  };

  // 保存会话（使用新的多会话存储）
  const saveSession = async (newMessages: ChatMessage[], newSessionId?: string) => {
    try {
      // 只保存有消息的会话
      if (newMessages.length === 0) return;

      const currentId = newSessionId || sessionId || generateSessionId();
      await saveSessionMessages(currentId, newMessages);

      if (newSessionId && newSessionId !== sessionId) {
        await setCurrentSessionId(newSessionId);
        setSessionId(newSessionId);
      }

      // 刷新会话列表（只显示有消息的会话）
      const updatedSessions = await loadAllSessions();
      setSessions(updatedSessions.filter(s => s.messageCount > 0));
    } catch (error) {
      console.error('Save session error:', error);
    }
  };

  // 中断AI思考
  const handleStopThinking = () => {
    abortControllerRef.current?.abort();
  };

  // 流式发送消息（带非流式降级）
  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputText.trim();
    if (!text) return;

    // 中断上一个进行中的请求
    abortControllerRef.current?.abort();

    setInputText('');
    setError(null);

    // 创建新的 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // 预创建AI消息占位符（用于流式更新）
    const aiMessageId = `ai_${Date.now()}`;

    try {
      // 尝试流式请求
      let streamSuccess = false;
      try {
        // 添加空的AI消息占位符
        const placeholderMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        };
        const messagesWithPlaceholder = [...newMessages, placeholderMessage];
        setMessages(messagesWithPlaceholder);
        setIsStreaming(true);

        // 用于节流UI更新的变量
        let lastUIUpdateTime = 0;
        let pendingContent = '';
        let updateTimer: NodeJS.Timeout | null = null;

        const response = await sendMessageStream(
          text,
          {
            onStart: (newSessionId) => {
              console.log('[AIChatScreen] SSE 开始, sessionId:', newSessionId);
              setSessionId(newSessionId);
            },
            onChunk: (_chunk, accumulated) => {
              pendingContent = accumulated;
              const now = Date.now();
              // 节流: 每50ms最多更新一次UI，避免过于频繁的setState
              if (now - lastUIUpdateTime >= 50) {
                lastUIUpdateTime = now;
                if (updateTimer) {
                  clearTimeout(updateTimer);
                  updateTimer = null;
                }
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  if (lastIdx >= 0 && updated[lastIdx].id === aiMessageId) {
                    updated[lastIdx] = { ...updated[lastIdx], content: pendingContent };
                  }
                  return updated;
                });
                // 自动滚动
                if (isAtBottomRef.current) {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }
              } else if (!updateTimer) {
                // 设置一个延迟更新确保最后的内容能显示
                updateTimer = setTimeout(() => {
                  updateTimer = null;
                  lastUIUpdateTime = Date.now();
                  setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].id === aiMessageId) {
                      updated[lastIdx] = { ...updated[lastIdx], content: pendingContent };
                    }
                    return updated;
                  });
                  if (isAtBottomRef.current) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }
                }, 50);
              }
            },
            onDone: (fullContent, newSessionId) => {
              // 清理节流定时器
              if (updateTimer) {
                clearTimeout(updateTimer);
                updateTimer = null;
              }
              console.log('[AIChatScreen] SSE 完成, 内容长度:', fullContent.length);
              // 最终更新使用完整内容
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (lastIdx >= 0 && updated[lastIdx].id === aiMessageId) {
                  updated[lastIdx] = { ...updated[lastIdx], content: fullContent };
                }
                return updated;
              });
            },
            onError: (errorMsg) => {
              console.error('[AIChatScreen] SSE 错误:', errorMsg);
            },
          },
          controller.signal
        );

        // 清理节流定时器
        if (updateTimer) {
          clearTimeout(updateTimer);
        }

        setIsStreaming(false);
        streamSuccess = true;

        // 最终消息已通过onChunk/onDone实时更新，此处确保session_id保存
        if (response.session_id) {
          setSessionId(response.session_id);
        }

        // 获取最终消息列表用于保存
        // 由于setState是异步的，直接构建最终消息列表
        const finalAiMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: response.reply,
          timestamp: Date.now(),
        };
        const finalMessages = [...newMessages, finalAiMessage];
        setMessages(finalMessages);
        await saveSession(finalMessages, response.session_id);

      } catch (streamErr: any) {
        setIsStreaming(false);

        // 用户取消 - 直接抛出
        if (streamErr.message === 'USER_CANCELLED') {
          throw streamErr;
        }

        // 流式失败 - 降级到非流式
        if (!streamSuccess) {
          console.warn('[AIChatScreen] 流式请求失败，降级到非流式:', streamErr.message);

          // 移除占位符消息
          setMessages(newMessages);

          // 检查是否已被取消
          if (controller.signal.aborted) {
            const cancelError = new Error('USER_CANCELLED');
            cancelError.name = 'AbortError';
            throw cancelError;
          }

          // 非流式降级
          const response = await sendChatMessage(text, controller.signal);

          const aiMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: response.reply,
            timestamp: Date.now(),
            metadata: {
              sourceType: response.sourceType as 'web_search' | 'knowledge_base' | 'general' | undefined,
              ragScore: response.ragScore,
              schoolId: response.schoolId,
              webSources: response.webSources,
            },
          };

          const updatedMessages = [...newMessages, aiMessage];
          setMessages(updatedMessages);
          setSessionId(response.session_id);

          // 非流式使用打字机效果
          const messageIndex = updatedMessages.length - 1;
          startTypingEffect(messageIndex, response.reply);

          await saveSession(updatedMessages, response.session_id);
        }
      }
    } catch (err: any) {
      // 用户主动取消 - 添加中断提示消息
      if (err.message === 'USER_CANCELLED') {
        // 检查是否有流式内容需要保留
        const currentMessages = messages;
        const hasStreamedContent = currentMessages.some(
          m => m.id === aiMessageId && m.content && m.content.length > 0
        );

        if (hasStreamedContent) {
          // 保留已流式传输的部分内容
          const interruptNote = '\n\n---\n*' + t('ai.interruptedMessage') + '*';
          setMessages(prev => {
            const updated = [...prev];
            const aiIdx = updated.findIndex(m => m.id === aiMessageId);
            if (aiIdx >= 0) {
              updated[aiIdx] = { ...updated[aiIdx], content: updated[aiIdx].content + interruptNote };
            }
            return updated;
          });
        } else {
          const interruptedMessage: ChatMessage = {
            id: `ai_interrupted_${Date.now()}`,
            role: 'assistant',
            content: t('ai.interruptedMessage'),
            timestamp: Date.now(),
          };
          const updatedMessages = [...newMessages, interruptedMessage];
          setMessages(updatedMessages);
          await saveSession(updatedMessages);
        }
      } else {
        console.error('Send message error:', err);
        // 移除空的AI占位符消息（如果存在）
        setMessages(prev => prev.filter(m => !(m.id === aiMessageId && m.content === '')));
        setError(err.message || t('ai.errorMessage'));
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // 新建对话（保存当前会话后创建新会话）
  const startNewChat = async () => {
    // 中断进行中的请求
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);

    // 如果当前有消息，保存当前会话（只保存有消息的会话）
    if (messages.length > 0 && sessionId) {
      await saveSessionMessages(sessionId, messages);
    }

    // 创建新会话
    const newSessionId = generateSessionId();
    setMessages([]);
    setSessionId(newSessionId);
    setError(null);
    setSuggestedQuestions(getRandomQuestions());
    await setCurrentSessionId(newSessionId);

    // 刷新会话列表（只显示有消息的会话）
    const updatedSessions = await loadAllSessions();
    setSessions(updatedSessions.filter(s => s.messageCount > 0));
  };

  // 切换到指定会话
  const handleSelectSession = async (targetSessionId: string) => {
    // 中断进行中的请求
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);

    // 保存当前会话（只保存有消息的会话）
    if (messages.length > 0 && sessionId) {
      await saveSessionMessages(sessionId, messages);
    }

    // 加载目标会话
    const targetMessages = await loadSessionMessages(targetSessionId);
    setMessages(targetMessages);
    setSessionId(targetSessionId);
    setError(null);
    await setCurrentSessionId(targetSessionId);

    // 刷新会话列表（只显示有消息的会话）
    const updatedSessions = await loadAllSessions();
    setSessions(updatedSessions.filter(s => s.messageCount > 0));
  };

  // 删除指定会话
  const handleDeleteSession = async (targetSessionId: string) => {
    await deleteSessionById(targetSessionId);

    // 如果删除的是当前会话，切换到最新会话或创建新会话
    if (targetSessionId === sessionId) {
      const updatedSessions = await loadAllSessions();
      const validSessions = updatedSessions.filter(s => s.messageCount > 0);
      setSessions(validSessions);

      if (validSessions.length > 0) {
        const latestSession = validSessions[0];
        const latestMessages = await loadSessionMessages(latestSession.sessionId);
        setMessages(latestMessages);
        setSessionId(latestSession.sessionId);
        await setCurrentSessionId(latestSession.sessionId);
      } else {
        // 没有会话了，创建新会话
        const newSessionId = generateSessionId();
        setMessages([]);
        setSessionId(newSessionId);
        await setCurrentSessionId(newSessionId);
      }
    } else {
      // 只刷新会话列表（只显示有消息的会话）
      const updatedSessions = await loadAllSessions();
      setSessions(updatedSessions.filter(s => s.messageCount > 0));
    }
  };

  // 清空所有会话
  const handleClearAll = async () => {
    await clearAllSessions();

    // 创建新会话
    const newSessionId = generateSessionId();
    setMessages([]);
    setSessionId(newSessionId);
    setSessions([]);
    setError(null);
    setSuggestedQuestions(getRandomQuestions());
    await setCurrentSessionId(newSessionId);
  };

  // 点击引导问题
  const handleSuggestedQuestion = (questionKey: string) => {
    // 使用翻译键获取问题文本
    const question = t(`ai.questions.${questionKey}`);
    if (question) {
      sendMessage(question);
    }
  };

  // AI消息的Markdown样式
  const aiMarkdownStyles = useMemo(() => ({
    body: {
      fontSize: 16,
      lineHeight: 22,
      color: '#1d1d1f',
    },
    heading1: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: '#1d1d1f',
      marginTop: 8,
      marginBottom: 4,
    },
    heading2: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#1d1d1f',
      marginTop: 6,
      marginBottom: 3,
    },
    heading3: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#1d1d1f',
      marginTop: 4,
      marginBottom: 2,
    },
    strong: {
      fontWeight: '600' as const,
      color: '#1d1d1f',
    },
    em: {
      fontStyle: 'italic' as const,
    },
    bullet_list: {
      marginTop: 4,
      marginBottom: 4,
    },
    ordered_list: {
      marginTop: 4,
      marginBottom: 4,
    },
    list_item: {
      marginTop: 2,
      marginBottom: 2,
    },
    code_inline: {
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 4,
      paddingHorizontal: 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 14,
    },
    fence: {
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 8,
      padding: 8,
      marginTop: 4,
      marginBottom: 4,
    },
    code_block: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 13,
    },
    link: {
      color: '#007AFF',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 4,
    },
  }), []);

  // 获取来源类型标签文本
  const getSourceTypeLabel = (sourceType: string) => {
    const labels: Record<string, string> = {
      web_search: t('ai.sourceType.web_search'),
      knowledge_base: t('ai.sourceType.knowledge_base'),
      general: t('ai.sourceType.general'),
    };
    return labels[sourceType] || sourceType;
  };

  // 打开来源链接
  const openSourceUrl = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('无法打开链接:', err);
    });
  };

  // 渲染消息项
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
    const isTyping = typingMessageIndex === index;
    const isStreamingMessage = isStreaming && index === messages.length - 1 && !isUser;

    // 显示打字效果或完整内容
    const displayContent = isTyping && typingText ? typingText : item.content;
    const showCursor = (isTyping && displayContent.length < item.content.length) || isStreamingMessage;

    // 获取元数据
    const metadata = item.metadata;
    const hasMetadata = !isUser && metadata && (metadata.sourceType || metadata.ragScore !== undefined);
    const webSources = metadata?.webSources || [];

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <TouchableOpacity
          onPress={isTyping ? skipTyping : undefined}
          activeOpacity={isTyping ? 0.7 : 1}
        >
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {isUser ? (
              <Text style={[styles.messageText, styles.userText]}>
                {displayContent}
              </Text>
            ) : (
              <View style={styles.markdownContainer}>
                <Markdown style={aiMarkdownStyles}>
                  {displayContent}
                </Markdown>
                {showCursor && <Text style={styles.cursor}>▊</Text>}
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* AI消息元数据标签 */}
        {hasMetadata && !isTyping && !isStreamingMessage && (
          <View style={styles.metadataContainer}>
            {/* 来源类型和相关性 */}
            <View style={styles.metadataRow}>
              {metadata.sourceType && (
                <View style={styles.metadataTag}>
                  <Ionicons name="globe-outline" size={14} color="#007AFF" />
                  <Text style={styles.metadataText}>
                    {getSourceTypeLabel(metadata.sourceType)}
                  </Text>
                </View>
              )}
              {metadata.ragScore !== undefined && metadata.ragScore > 0 && (
                <View style={styles.metadataTag}>
                  <Text style={styles.metadataText}>
                    {t('ai.relevance')}: {Math.round(metadata.ragScore * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {/* 来源链接 */}
            {webSources.length > 0 && (
              <View style={styles.sourcesContainer}>
                <Ionicons name="link-outline" size={14} color="#8e8e93" />
                <Text style={styles.sourcesLabel}>{t('ai.sources')}:</Text>
                {webSources.slice(0, 3).map((source, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => openSourceUrl(source.url)}
                    style={styles.sourceLink}
                  >
                    <Text style={styles.sourceLinkText} numberOfLines={1}>
                      {source.siteName || source.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                {webSources.length > 3 && (
                  <Text style={styles.moreSourcesText}>+{webSources.length - 3}</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  // 刷新引导问题
  const refreshSuggestedQuestions = () => {
    setSuggestedQuestions(getRandomQuestions());
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.welcomeTitle}>{t('ai.welcome')}</Text>

      {/* 引导问题 - 随机3个 */}
      <View style={styles.suggestionsContainer}>
        {suggestedQuestions.map((question) => (
          <TouchableOpacity
            key={question.key}
            style={styles.suggestionCard}
            onPress={() => handleSuggestedQuestion(question.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.suggestionIconContainer, { backgroundColor: question.iconColor + '15' }]}>
              <Ionicons
                name={question.icon as any}
                size={28}
                color={question.iconColor}
              />
            </View>
            <Text style={styles.suggestionText} numberOfLines={2}>
              {t(`ai.questions.${question.key}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 换一批按钮 */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={refreshSuggestedQuestions}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={18} color="#8e8e93" />
        <Text style={styles.refreshButtonText}>{t('ai.refreshQuestions')}</Text>
      </TouchableOpacity>

      {/* Backend common questions */}
      {backendQuestions.length > 0 && (
        <View style={styles.backendQuestionsContainer}>
          {backendQuestions.slice(0, 4).map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.backendQuestionChip}
              onPress={() => sendMessage(q.message)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#F9A889" />
              <Text style={styles.backendQuestionText} numberOfLines={1}>{q.message}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* 顶部导航 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1d1d1f" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('ai.title')}</Text>

        <View style={styles.headerRight}>
          {/* 历史记录按钮 - 始终显示 */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setHistoryVisible(true)}
          >
            <Ionicons name="time-outline" size={24} color="#1d1d1f" />
          </TouchableOpacity>

          {/* 新建对话按钮 - 只在有消息时显示 */}
          {messages.length > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={startNewChat}
            >
              <Ionicons name="create-outline" size={24} color="#1d1d1f" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `message-${index}`}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.messageListEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        scrollEventThrottle={100}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          // 检测是否在底部附近（50像素内算作在底部）
          const { contentSize, layoutMeasurement, contentOffset } = event.nativeEvent;
          const isBottom = contentOffset.y >= contentSize.height - layoutMeasurement.height - 50;
          isAtBottomRef.current = isBottom;

          // 保存滚动位置以便调试
          scrollPositionRef.current = {
            contentHeight: contentSize.height,
            containerHeight: layoutMeasurement.height,
            offset: contentOffset.y,
          };
        }}
        onContentSizeChange={() => {
          // 只在用户在底部或未开始滚动时自动滚动到底部
          if (isAtBottomRef.current) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* 加载指示器 - 仅在等待首个chunk时显示，流式传输中不显示 */}
      {isLoading && !isStreaming && <ThinkingIndicator estimatedTime={3} />}

      {/* 错误提示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                // 重试最后一条用户消息
                const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                if (lastUserMsg) {
                  // 移除最后的用户消息，sendMessage会重新添加
                  setMessages(messages.filter(m => m.id !== lastUserMsg.id));
                  sendMessage(lastUserMsg.content);
                }
              }}
            >
              <Ionicons name="refresh-outline" size={16} color="#007AFF" />
              <Text style={styles.retryButtonText}>{t('ai.retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close-circle" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 输入框 */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <BlurView intensity={90} style={styles.inputBlur} tint="light">
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.98)']}
            style={styles.inputGradient}
          >
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('ai.inputPlaceholder')}
              placeholderTextColor="#8e8e93"
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={() => sendMessage()}
              inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
            />
            {isLoading ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleStopThinking}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8F65']}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="stop" size={20} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim()}
              >
                <LinearGradient
                  colors={
                    inputText.trim()
                      ? ['rgba(249, 168, 137, 1)', 'rgba(255, 180, 162, 1)']
                      : ['rgba(200, 200, 200, 0.5)', 'rgba(220, 220, 220, 0.5)']
                  }
                  style={styles.sendButtonGradient}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={inputText.trim() ? '#ffffff' : '#8e8e93'}
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </BlurView>
      </View>

      {/* 历史记录 BottomSheet */}
      <ChatHistoryBottomSheet
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        sessions={sessions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
      />
      <KeyboardDoneAccessory />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageListEmpty: {
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: 'rgba(249, 168, 137, 0.9)',
  },
  aiBubble: {
    backgroundColor: '#ffffff',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#1d1d1f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'center',
    marginBottom: 32,
  },
  suggestionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  suggestionCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 13,
    color: '#1d1d1f',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAF3F1',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8e8e93',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffebee',
    borderTopWidth: 1,
    borderTopColor: '#ffcdd2',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ff3b30',
    marginRight: 8,
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  retryButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1d1d1f',
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 打字机光标
  cursor: {
    color: '#F9A889',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  // Markdown容器
  markdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  // 元数据容器
  metadataContainer: {
    marginTop: 6,
    paddingLeft: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metadataTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  // 来源链接
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  sourcesLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginLeft: 4,
  },
  sourceLink: {
    maxWidth: 100,
  },
  sourceLinkText: {
    fontSize: 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  moreSourcesText: {
    fontSize: 12,
    color: '#8e8e93',
    marginLeft: 4,
  },
  // Backend questions
  backendQuestionsContainer: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  backendQuestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 137, 0.3)',
  },
  backendQuestionText: {
    flex: 1,
    fontSize: 13,
    color: '#1d1d1f',
    fontWeight: '500',
  },
});

export default AIChatScreen;
