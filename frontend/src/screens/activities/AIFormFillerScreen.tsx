/**
 * AIFormFillerScreen
 * AI 智能填表主屏幕 - 通过对话式交互填写活动报名表单
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import { FormPreviewCard } from '../../components/activity/FormPreviewCard';
import { useAIFormFilling, ChatMessage, FormField } from '../../hooks/useAIFormFilling';
import formAutoFill from '../../utils/formAutoFill';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../../components/common/KeyboardDismissWrapper';

// ==================== 类型定义 ====================

interface Activity {
  id: string | number;
  title?: string;
  name?: string;
  date?: string;
  location?: string;
  address?: string;
  modelContent?: string;
}

// ==================== 组件实现 ====================

export const AIFormFillerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useUser();
  const scrollViewRef = useRef<ScrollView>(null);

  // 路由参数
  const activity: Activity = route.params?.activity;
  const formSchema: FormField[] = route.params?.formSchema || [];
  const shareUserId = route.params?.shareUserId as number | undefined;

  // 状态
  const [inputText, setInputText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 语音输入
  const {
    isListening,
    transcript,
    interimTranscript,
    error: voiceError,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    cancelListening,
    clearTranscript,
  } = useVoiceInput();

  // 录音动画
  const pulseAnim = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  // TabBar 状态守护
  useTabBarVerification('AIFormFiller', { debugLogs: false });

  // AI 表单填写 Hook
  const {
    messages,
    formData,
    autoFilledData,
    progress,
    isComplete,
    isLoading,
    error,
    autoFilledLabels,
    startSession,
    sendMessage,
    reset,
    getSubmitData,
  } = useAIFormFilling(
    activity?.title || activity?.name || '',
    formSchema,
    user
  );

  // 启动会话
  useEffect(() => {
    startSession();
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 当对话完成时显示预览
  useEffect(() => {
    if (isComplete && !showPreview) {
      setTimeout(() => {
        setShowPreview(true);
      }, 500);
    }
  }, [isComplete, showPreview]);

  // 语音识别结果处理 - 自动填入输入框
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  // 录音脉冲动画
  useEffect(() => {
    if (isListening) {
      pulseAnim.value = withRepeat(
        withTiming(1.2, { duration: 500 }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 1;
    }
  }, [isListening, pulseAnim]);

  /**
   * 发送消息
   */
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  }, [inputText, isLoading, sendMessage]);

  /**
   * 切换语音输入
   */
  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  /**
   * 提交表单
   */
  const handleSubmit = useCallback(async () => {
    if (!user || !user.userId) {
      Alert.alert(t('activities.registration.failed_title'), t('auth.errors.not_logged_in'));
      return;
    }

    setSubmitting(true);
    try {
      const activityIdInt = parseInt(String(activity.id));
      const userIdInt = parseInt(String(user.userId));

      if (isNaN(activityIdInt) || isNaN(userIdInt) || userIdInt <= 0) {
        Alert.alert(t('activities.registration.failed_title'), t('common.error'));
        return;
      }

      const submitData = getSubmitData();
      console.log('[AIFormFiller] 提交表单数据:', submitData);

      const result = await pomeloXAPI.submitActivityRegistration(activityIdInt, userIdInt, submitData, shareUserId);

      if (result.code === 200 && result.data != null && Number(result.data) > 0) {
        setShowSuccessModal(true);
      } else {
        Alert.alert(
          t('activities.registration.failed_title'),
          result.msg || t('activities.registration.failed_message')
        );
      }
    } catch (err: any) {
      const isAlreadyEnrolled = err.message && err.message.includes('报名信息已存在');
      Alert.alert(
        t('activities.registration.failed_title'),
        isAlreadyEnrolled
          ? err.message.replace('活动报名失败: ', '')
          : t('common.network_error')
      );
    } finally {
      setSubmitting(false);
    }
  }, [user, activity, getSubmitData, t]);

  /**
   * 返回编辑
   */
  const handleBackToEdit = useCallback(() => {
    setShowPreview(false);
  }, []);

  /**
   * 重新开始
   */
  const handleRestart = useCallback(async () => {
    Alert.alert(
      t('ai_form.restart_title') || '重新开始',
      t('ai_form.restart_confirm') || '确定要重新填写吗？已填写的内容将被清除。',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setShowPreview(false);
            await reset();
            await startSession();
          },
        },
      ]
    );
  }, [reset, startSession, t]);

  /**
   * 返回
   */
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * 成功后关闭
   */
  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);

    // 发送报名成功事件
    DeviceEventEmitter.emit('activityRegistrationChanged', {
      activityId: activity.id,
      action: 'register',
      timestamp: Date.now(),
    });

    // 返回到活动详情页面（跳过表单选择页面）
    navigation.pop(2);
  }, [activity.id, navigation]);

  /**
   * 渲染消息气泡
   */
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAssistant,
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  // ==================== 渲染 ====================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ai_form.title')}</Text>
        <TouchableOpacity onPress={handleRestart} style={styles.restartButton}>
          <Ionicons name="refresh" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* 活动信息 */}
      <View style={styles.activityInfo}>
        <Text style={styles.activityName} numberOfLines={1}>
          {activity?.title || activity?.name}
        </Text>
        {autoFilledLabels.length > 0 && (
          <View style={styles.autoFilledBadge}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <Text style={styles.autoFilledText}>
              {t('ai_form.auto_filled_count', { count: autoFilledLabels.length })}
            </Text>
          </View>
        )}
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {t('ai_form.progress', { progress })}
        </Text>
      </View>

      {/* 主内容区 */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {showPreview ? (
          // 预览模式
          <ScrollView
            style={styles.previewScrollView}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
            <FormPreviewCard
              formSchema={formSchema}
              formData={formData}
              autoFilledData={autoFilledData}
              showEditButtons={false}
            />

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.backToEditButton}
                onPress={handleBackToEdit}
              >
                <Ionicons name="arrow-back" size={18} color={theme.colors.primary} />
                <Text style={styles.backToEditText}>{t('ai_form.back_to_edit')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>{t('ai_form.confirm_submit')}</Text>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          // 对话模式
          <>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContent}
              keyboardDismissMode="on-drag"
            >
              {messages.map(renderMessage)}

              {isLoading && (
                <View style={[styles.messageRow, styles.messageRowAssistant]}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
                  </View>
                  <View style={[styles.messageBubble, styles.messageBubbleAssistant]}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.thinkingText}>{t('ai_form.thinking')}</Text>
                  </View>
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </ScrollView>

            {/* 语音识别中显示 */}
            {isListening && (
              <View style={styles.listeningContainer}>
                <Animated.View style={[styles.listeningIndicator, pulseStyle]}>
                  <Ionicons name="mic" size={24} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.listeningText}>
                  {interimTranscript || t('ai_form.listening')}
                </Text>
                <TouchableOpacity
                  style={styles.cancelVoiceButton}
                  onPress={cancelListening}
                >
                  <Text style={styles.cancelVoiceText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 语音错误提示 */}
            {voiceError && !isListening && (
              <View style={styles.voiceErrorContainer}>
                <Ionicons name="mic-off" size={14} color={theme.colors.warning} />
                <Text style={styles.voiceErrorText}>{voiceError}</Text>
              </View>
            )}

            {/* 输入区域 */}
            <View style={styles.inputContainer}>
              {/* 语音按钮 */}
              {voiceSupported && (
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isListening && styles.voiceButtonActive,
                  ]}
                  onPress={handleVoiceToggle}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isListening ? 'stop' : 'mic'}
                    size={20}
                    color={isListening ? '#FFFFFF' : theme.colors.primary}
                  />
                </TouchableOpacity>
              )}

              <TextInput
                style={[styles.textInput, voiceSupported && styles.textInputWithVoice]}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isListening ? t('ai_form.speaking') : t('ai_form.input_placeholder')}
                placeholderTextColor={theme.colors.text.disabled}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                editable={!isListening}
                inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading || isListening) && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading || isListening}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() && !isLoading && !isListening ? '#FFFFFF' : theme.colors.text.disabled}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* 成功模态框 */}
      <LiquidSuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title={t('activities.registration.success_title')}
        message={t('activities.registration.success_message')}
        confirmText={t('common.confirm')}
        icon="checkmark-circle"
      />
      <KeyboardDoneAccessory />
    </SafeAreaView>
  );
};

// ==================== 样式 ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.secondary,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  restartButton: {
    padding: 4,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
  },
  autoFilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  autoFilledText: {
    fontSize: 12,
    color: theme.colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.border.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 12,
    minWidth: 50,
  },
  contentContainer: {
    flex: 1,
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleUser: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAssistant: {
    color: theme.colors.text.primary,
  },
  thinkingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.danger,
    marginLeft: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.secondary,
    backgroundColor: theme.colors.background.primary,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text.primary,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border.secondary,
  },
  // 语音相关样式
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: theme.colors.danger,
  },
  textInputWithVoice: {
    marginLeft: 0,
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary + '10',
    borderTopWidth: 1,
    borderTopColor: theme.colors.primary + '30',
  },
  listeningIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    marginLeft: 16,
    fontStyle: 'italic',
  },
  cancelVoiceButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelVoiceText: {
    fontSize: 14,
    color: theme.colors.danger,
    fontWeight: '500',
  },
  voiceErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.warning + '15',
  },
  voiceErrorText: {
    fontSize: 12,
    color: theme.colors.warning,
    marginLeft: 6,
  },
  previewScrollView: {
    flex: 1,
    padding: 16,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  backToEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backToEditText: {
    fontSize: 15,
    color: theme.colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.primary + '60',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});

export default AIFormFillerScreen;
