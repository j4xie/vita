/**
 * AI Chat History Bottom Sheet
 * 显示聊天历史会话列表，支持切换、删除会话
 */

import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Swipeable } from 'react-native-gesture-handler';

import { SessionMetadata } from '../../types/chat';
import { theme } from '../../theme';

const { height: screenHeight } = Dimensions.get('window');

interface ChatHistoryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  sessions: SessionMetadata[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
}

// 会话列表项组件
const SessionItem = React.memo<{
  session: SessionMetadata;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}>(({ session, isActive, onSelect, onDelete }) => {
  const { t } = useTranslation();
  const swipeableRef = useRef<Swipeable>(null);

  // 格式化时间显示
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('ai.chatHistory.yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // 渲染右侧删除按钮
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#ffffff" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity
        style={[
          styles.sessionItem,
          isActive && styles.sessionItemActive,
        ]}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.sessionContent}>
          <View style={styles.sessionHeader}>
            <Text
              style={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
              numberOfLines={1}
            >
              {session.title}
            </Text>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{t('ai.chatHistory.currentSession')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.sessionPreview} numberOfLines={1}>
            {session.previewText || t('ai.chatHistory.noMessages')}
          </Text>
          <View style={styles.sessionFooter}>
            <Text style={styles.sessionTime}>{formatTime(session.updatedAt)}</Text>
            <Text style={styles.sessionCount}>
              {t('ai.chatHistory.messageCount', { count: session.messageCount })}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#8e8e93"
          style={styles.sessionArrow}
        />
      </TouchableOpacity>
    </Swipeable>
  );
});

export const ChatHistoryBottomSheet: React.FC<ChatHistoryBottomSheetProps> = ({
  visible,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  const { t } = useTranslation();

  // 动画值
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;

  // 显示动画
  const showModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [modalOpacity, modalTranslateY]);

  // 隐藏动画
  const hideModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [modalOpacity, modalTranslateY, onClose]);

  // 监听visible变化
  useEffect(() => {
    if (visible) {
      modalOpacity.setValue(0);
      modalTranslateY.setValue(screenHeight);
      setTimeout(() => {
        showModal();
      }, 50);
    }
  }, [visible, showModal, modalOpacity, modalTranslateY]);

  // 处理清空所有
  const handleClearAll = useCallback(() => {
    Alert.alert(
      t('ai.chatHistory.clearAll'),
      t('ai.chatHistory.clearAllConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => {
            onClearAll();
            hideModal();
          },
        },
      ]
    );
  }, [t, onClearAll, hideModal]);

  // 处理删除单个会话
  const handleDeleteSession = useCallback((sessionId: string) => {
    Alert.alert(
      t('ai.chatHistory.deleteSession'),
      t('ai.chatHistory.deleteSessionConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => onDeleteSession(sessionId),
        },
      ]
    );
  }, [t, onDeleteSession]);

  // 渲染会话项
  const renderSessionItem = useCallback(({ item }: { item: SessionMetadata }) => (
    <SessionItem
      session={item}
      isActive={item.sessionId === currentSessionId}
      onSelect={() => {
        onSelectSession(item.sessionId);
        hideModal();
      }}
      onDelete={() => handleDeleteSession(item.sessionId)}
    />
  ), [currentSessionId, onSelectSession, hideModal, handleDeleteSession]);

  // 渲染空状态
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#c7c7cc" />
      <Text style={styles.emptyText}>{t('ai.chatHistory.noHistory')}</Text>
    </View>
  ), [t]);

  // 列表分隔符
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={hideModal}
    >
      {/* 背景遮罩 */}
      <Animated.View style={[styles.backdrop, { opacity: modalOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={hideModal}
        />
      </Animated.View>

      {/* Modal内容 */}
      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: modalTranslateY }] },
        ]}
      >
        {/* 拖动指示器 */}
        <View style={styles.dragIndicator} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.headerTitle}>{t('ai.chatHistory.title')}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideModal}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={24} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        {/* 会话列表 */}
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.sessionId}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={renderEmptyComponent}
          style={styles.sessionList}
          contentContainerStyle={[
            styles.sessionListContent,
            sessions.length === 0 && styles.sessionListEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* 清空所有按钮 */}
        {sessions.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              <Text style={styles.clearAllText}>{t('ai.chatHistory.clearAll')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.7,
    backgroundColor: '#f2f2f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dragIndicator: {
    width: 36,
    height: 5,
    backgroundColor: '#c7c7cc',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  closeButton: {
    padding: 4,
  },
  sessionList: {
    flex: 1,
  },
  sessionListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sessionItemActive: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    flex: 1,
  },
  sessionTitleActive: {
    color: theme.colors.primary,
  },
  activeBadge: {
    backgroundColor: `${theme.colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  sessionPreview: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 6,
  },
  sessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTime: {
    fontSize: 12,
    color: '#aeaeb2',
  },
  sessionCount: {
    fontSize: 12,
    color: '#aeaeb2',
  },
  sessionArrow: {
    marginLeft: 8,
  },
  deleteAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34, // Safe area bottom
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5ea',
    backgroundColor: '#ffffff',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffebee',
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
    marginLeft: 8,
  },
});

export default ChatHistoryBottomSheet;
