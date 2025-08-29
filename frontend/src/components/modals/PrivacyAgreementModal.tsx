import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';

interface PrivacyAgreementModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const PrivacyAgreementModal: React.FC<PrivacyAgreementModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const { t } = useTranslation();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const scrollHeight = contentSize.height - layoutMeasurement.height;
    
    // 计算滚动进度 (0-1)
    const progress = scrollHeight > 0 ? Math.min(scrollY / scrollHeight, 1) : 1;
    setScrollProgress(progress);
    
    // 检测是否滚动到底部 (允许5px的误差)
    const isAtBottom = scrollY >= scrollHeight - 5;
    setHasScrolledToBottom(isAtBottom);
  };

  const handleModalShow = () => {
    // 重置状态当模态框显示时
    setHasScrolledToBottom(false);
    setScrollProgress(0);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onShow={handleModalShow}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.container}>
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name="shield-checkmark" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                <Text style={styles.title}>
                  {t('auth.register.privacy.title')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('auth.register.privacy.subtitle')}
                </Text>
              </View>

              {/* Scroll Progress Indicator */}
              <View style={styles.progressIndicatorContainer}>
                <View style={styles.progressIndicator}>
                  <View style={[styles.progressBar, { width: `${scrollProgress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {hasScrolledToBottom ? t('auth.register.privacy.read_complete') : t('auth.register.privacy.please_scroll')}
                </Text>
              </View>

              {/* Privacy Content */}
              <ScrollView 
                ref={scrollViewRef}
                style={styles.contentScrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                <Text style={styles.contentText}>
                  {t('auth.register.privacy.content')}
                </Text>

                <View style={styles.highlightBox}>
                  <Ionicons 
                    name="information-circle" 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                  <Text style={styles.highlightText}>
                    {t('auth.register.privacy.data_usage_highlight')}
                  </Text>
                </View>

                <Text style={styles.contentText}>
                  {t('auth.register.privacy.data_protection')}
                </Text>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.declineButton]}
                  onPress={onDecline}
                  activeOpacity={0.8}
                >
                  <Text style={styles.declineButtonText}>
                    {t('auth.register.privacy.decline_button')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.acceptButton,
                    !hasScrolledToBottom && styles.acceptButtonDisabled
                  ]}
                  onPress={onAccept}
                  activeOpacity={hasScrolledToBottom ? 0.8 : 1}
                  disabled={!hasScrolledToBottom}
                >
                  <Text style={[
                    styles.acceptButtonText,
                    !hasScrolledToBottom && styles.acceptButtonTextDisabled
                  ]}>
                    {hasScrolledToBottom ? t('auth.register.privacy.accept_button') : t('auth.register.privacy.scroll_to_accept')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.modal,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    padding: theme.spacing[6],
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  contentScrollView: {
    flex: 1,
    maxHeight: 300,
  },
  contentContainer: {
    padding: theme.spacing[6],
  },
  contentText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing[4],
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    marginVertical: theme.spacing[4],
  },
  highlightText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: theme.spacing[6],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing[2],
  },
  declineButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  declineButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  acceptButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  acceptButtonDisabled: {
    backgroundColor: theme.colors.border.secondary,
    opacity: 0.6,
  },
  acceptButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
  progressIndicatorContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  progressIndicator: {
    height: 3,
    backgroundColor: theme.colors.border.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: theme.spacing[2],
  },
});