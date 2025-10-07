import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ChatMessage } from '../types/ai';
import { apiService } from '../services/api';
import { theme } from '../theme';
import { useUser } from '../context/UserContext';
import { ThinkingIndicator } from '../components/ai/ThinkingIndicator';

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
];

// 随机选择3个引导问题
const getRandomQuestions = () => {
  const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

export const AIChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState(() => getRandomQuestions());

  // 打字机效果状态
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [typingText, setTypingText] = useState('');
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 从路由参数获取初始消息
  const initialMessage = route.params?.initialMessage as string | undefined;

  // 清理打字机定时器
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // 打字机效果函数
  const startTypingEffect = (messageIndex: number, fullText: string) => {
    setTypingMessageIndex(messageIndex);
    setTypingText('');

    let charIndex = 0;
    typingIntervalRef.current = setInterval(() => {
      if (charIndex < fullText.length) {
        setTypingText(fullText.slice(0, charIndex + 1));
        charIndex++;
        // 自动滚动
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 10);
      } else {
        // 打字完成
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setTypingMessageIndex(null);
        setTypingText('');
      }
    }, 40); // 40ms 每个字符
  };

  // 跳过打字效果，直接显示全文
  const skipTyping = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setTypingMessageIndex(null);
    setTypingText('');
  };

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

  // 加载会话
  const loadSession = async () => {
    try {
      const savedSessionId = await AsyncStorage.getItem('@ai_session_id');
      const savedMessages = await AsyncStorage.getItem('@ai_messages');

      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Load session error:', error);
    }
  };

  // 保存会话
  const saveSession = async (newMessages: ChatMessage[], newSessionId?: string) => {
    try {
      await AsyncStorage.setItem('@ai_messages', JSON.stringify(newMessages));
      if (newSessionId) {
        await AsyncStorage.setItem('@ai_session_id', newSessionId);
      }
    } catch (error) {
      console.error('Save session error:', error);
    }
  };

  // 发送消息
  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputText.trim();
    if (!text) return;

    setInputText('');
    setError(null);

    // 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // 调用AI API
      const response = await apiService.sendAIMessage({
        message: text,
        session_id: sessionId || undefined,
        user_id: user?.userId?.toString(),
      });

      // 添加AI回复
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);
      setSessionId(response.session_id);

      // 启动打字机效果
      const messageIndex = updatedMessages.length - 1;
      startTypingEffect(messageIndex, response.reply);

      // 保存会话
      await saveSession(updatedMessages, response.session_id);
    } catch (err: any) {
      console.error('Send message error:', err);
      setError(err.message || t('ai.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  // 新建对话
  const startNewChat = async () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    setSuggestedQuestions(getRandomQuestions()); // 刷新引导问题
    await AsyncStorage.multiRemove(['@ai_session_id', '@ai_messages']);
  };

  // 点击引导问题
  const handleSuggestedQuestion = (questionKey: string) => {
    // 使用翻译键获取问题文本
    const question = t(`ai.questions.${questionKey}`);
    if (question) {
      sendMessage(question);
    }
  };

  // 渲染消息项
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.role === 'user';
    const isLastMessage = index === messages.length - 1;
    const isTyping = typingMessageIndex === index;

    // 显示打字效果或完整内容
    const displayContent = isTyping && typingText ? typingText : item.content;
    const showCursor = isTyping && displayContent.length < item.content.length;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
        onPress={isTyping ? skipTyping : undefined}
        activeOpacity={isTyping ? 0.7 : 1}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {displayContent}
            {showCursor && <Text style={styles.cursor}>▊</Text>}
          </Text>
        </View>
      </TouchableOpacity>
    );
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

        <TouchableOpacity
          style={styles.headerButton}
          onPress={startNewChat}
        >
          <Ionicons name="create-outline" size={24} color="#1d1d1f" />
        </TouchableOpacity>
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
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* 加载指示器 - Grok风格 */}
      {isLoading && <ThinkingIndicator estimatedTime={3} />}

      {/* 错误提示 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close-circle" size={20} color="#ff3b30" />
          </TouchableOpacity>
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
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient
                colors={
                  inputText.trim() && !isLoading
                    ? ['rgba(249, 168, 137, 1)', 'rgba(255, 180, 162, 1)']
                    : ['rgba(200, 200, 200, 0.5)', 'rgba(220, 220, 220, 0.5)']
                }
                style={styles.sendButtonGradient}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() && !isLoading ? '#ffffff' : '#8e8e93'}
                />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    backgroundColor: '#e5e5ea',
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
    backgroundColor: '#f9f9f9',
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
});

export default AIChatScreen;
