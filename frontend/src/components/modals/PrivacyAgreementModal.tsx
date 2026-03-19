import React, { useState, useRef, useEffect, memo } from 'react';
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
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, CORE_SHADOWS, DAWN_GRADIENTS } from '../../theme/core';
import { useMemoizedDarkMode, useBlurViewConfig } from '../../hooks/useDarkMode';

interface PrivacyAgreementModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userArea?: 'zh' | 'en' | 'combined';
  allowRegionSwitch?: boolean;
  onRegionChange?: (region: 'zh' | 'en' | 'combined') => void;
}

export const PrivacyAgreementModal: React.FC<PrivacyAgreementModalProps> = memo(({
  visible,
  onAccept,
  onDecline,
  userArea = 'combined',
  allowRegionSwitch = true,
  onRegionChange,
}) => {
  const { t } = useTranslation();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentRegion, setCurrentRegion] = useState<'zh' | 'en' | 'combined'>(userArea);
  const scrollViewRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCurrentRegion(userArea);
  }, [userArea]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: scrollProgress,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [scrollProgress]);

  const darkMode = useMemoizedDarkMode();
  const blurConfig = useBlurViewConfig();
  const { isDarkMode } = darkMode;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const scrollHeight = contentSize.height - layoutMeasurement.height;

    const progress = scrollHeight > 0 ? Math.min(scrollY / scrollHeight, 1) : 1;
    setScrollProgress(progress);

    const isAtBottom = scrollHeight <= 20 || scrollY >= scrollHeight - 20;
    setHasScrolledToBottom(isAtBottom);

    if (scrollHeight <= 0) {
      setHasScrolledToBottom(true);
    }
  };

  const handleModalShow = () => {
    setHasScrolledToBottom(false);
    setScrollProgress(0);
  };

  const convertMarkdownToText = (markdownText: string): string => {
    if (!markdownText) return '';
    return markdownText
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^[\s]*[•\-*+]\s*/gm, '• ')
      .replace(/^[\s]*\d+\.\s*/gm, '• ')
      .replace(/•\s*•\s*/g, '• ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n').map(line => line.trim()).join('\n')
      .trim();
  };

  const getPrivacyContent = () => {
    let rawContent: string;
    if (currentRegion === 'zh') {
      rawContent = t('legal.privacy.content_china');
    } else if (currentRegion === 'en') {
      rawContent = t('legal.privacy.content_usa');
    } else {
      rawContent = t('legal.privacy.full_content');
    }
    return convertMarkdownToText(rawContent);
  };

  const handleRegionSwitch = (region: 'zh' | 'en' | 'combined') => {
    setCurrentRegion(region);
    setHasScrolledToBottom(false);
    setScrollProgress(0);
    onRegionChange?.(region);
  };

  const dynamicBg = isDarkMode ? darkMode.elevatedBackground : '#FFFFFF';
  const dynamicBorder = isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(0, 0, 0, 0.06)';
  const dynamicIconColor = isDarkMode ? darkMode.brandPrimary : theme.colors.primary;
  const dynamicTextColor = isDarkMode ? darkMode.primaryText : theme.colors.text.primary;
  const dynamicSecondaryTextColor = isDarkMode ? darkMode.secondaryText : theme.colors.text.secondary;

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onShow={handleModalShow}
    >
      <BlurView intensity={blurConfig.intensity} tint={blurConfig.tint} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={styles.container}>
          <View style={styles.overlay}>
            <View style={[styles.modalContainer, { backgroundColor: dynamicBg, borderColor: dynamicBorder }]}>

              {/* Header */}
              <View style={styles.header}>
                {/* Icon with gradient ring */}
                <View style={styles.iconOuter}>
                  <LinearGradient
                    colors={['#FF6B35', '#FF8F65']}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                <Text style={[styles.title, { color: dynamicTextColor }]}>
                  {t('auth.register.privacy.title')}
                </Text>
                <Text style={[styles.subtitle, { color: dynamicSecondaryTextColor }]}>
                  {t('auth.register.privacy.subtitle_simple') || 'Privacy Policy'}
                </Text>

                {/* Region switcher */}
                {allowRegionSwitch && (
                  <View style={styles.regionSwitcher}>
                    {(['combined', 'zh', 'en'] as const).map((region) => (
                      <TouchableOpacity
                        key={region}
                        style={[
                          styles.regionButton,
                          currentRegion === region && styles.regionButtonActive,
                        ]}
                        onPress={() => handleRegionSwitch(region)}
                      >
                        <Text style={[
                          styles.regionButtonText,
                          currentRegion === region && styles.regionButtonTextActive,
                        ]}>
                          {t(`auth.register.privacy.version_${region === 'combined' ? 'combined' : region === 'zh' ? 'china' : 'usa'}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Progress bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressBarWidth,
                        backgroundColor: hasScrolledToBottom ? '#2ED573' : theme.colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabelRow}>
                  <Ionicons
                    name={hasScrolledToBottom ? 'checkmark-circle' : 'arrow-down-circle-outline'}
                    size={14}
                    color={hasScrolledToBottom ? '#2ED573' : theme.colors.text.tertiary}
                  />
                  <Text style={[
                    styles.progressText,
                    hasScrolledToBottom && styles.progressTextDone,
                  ]}>
                    {hasScrolledToBottom
                      ? t('auth.register.privacy.read_complete')
                      : t('auth.register.privacy.please_scroll')}
                  </Text>
                </View>
              </View>

              {/* Scrollable content */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.contentScrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                bounces={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.contentText, { color: dynamicTextColor }]}>
                  {getPrivacyContent()}
                </Text>

                <View style={[styles.highlightBox, { borderLeftColor: dynamicIconColor }]}>
                  <Ionicons name="information-circle" size={18} color={dynamicIconColor} />
                  <Text style={[styles.highlightText, { color: dynamicTextColor }]}>
                    {t('auth.register.privacy.data_usage_highlight')}
                  </Text>
                </View>

                <Text style={[styles.contentText, { color: dynamicTextColor }]}>
                  {t('auth.register.privacy.data_protection')}
                </Text>

                {/* SMS Consent */}
                <View style={[styles.smsConsentBox, { borderLeftColor: dynamicIconColor }]}>
                  <Text style={[styles.smsConsentTitle, { color: dynamicIconColor }]}>
                    {t('auth.register.sms.consent_title')}
                  </Text>
                  <Text style={[styles.smsConsentText, { color: dynamicTextColor }]}>
                    {t('auth.register.sms.consent_text')} - {t('auth.register.sms.consent_description')}
                  </Text>
                  <View style={styles.smsPurposesList}>
                    <Text style={[styles.smsPurposeItem, { color: dynamicTextColor }]}>• {t('auth.register.sms.consent_purposes.authentication')}</Text>
                    <Text style={[styles.smsPurposeItem, { color: dynamicTextColor }]}>• {t('auth.register.sms.consent_purposes.notifications')}</Text>
                    <Text style={[styles.smsPurposeItem, { color: dynamicTextColor }]}>• {t('auth.register.sms.consent_purposes.services')}</Text>
                  </View>
                  <Text style={[styles.smsNoticeText, { color: dynamicSecondaryTextColor }]}>
                    <Text style={styles.smsNoticeBold}>{t('auth.register.sms.notice_prefix')}</Text>
                    {t('auth.register.sms.consent_notice')}
                  </Text>
                </View>

                {/* Bottom spacer for scroll detection */}
                <View style={{ height: 8 }} />
              </ScrollView>

              {/* Action buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={onDecline}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineButtonText}>
                    {t('auth.register.privacy.decline_button')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.acceptButton,
                    !hasScrolledToBottom && styles.acceptButtonDisabled,
                  ]}
                  onPress={onAccept}
                  activeOpacity={hasScrolledToBottom ? 0.8 : 1}
                  disabled={!hasScrolledToBottom}
                >
                  {hasScrolledToBottom ? (
                    <LinearGradient
                      colors={['#FF6B35', '#FF8F65']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.acceptButtonGradient}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.acceptButtonText}>
                        {t('auth.register.privacy.accept_simple') || 'Agree'}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.acceptButtonInner}>
                      <Ionicons name="lock-closed" size={14} color={theme.colors.text.disabled} style={{ marginRight: 6 }} />
                      <Text style={styles.acceptButtonTextDisabled}>
                        {t('auth.register.privacy.scroll_to_accept')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    height: '80%',
    borderRadius: LIQUID_GLASS_LAYERS.L3.borderRadius.modal,
    borderWidth: 1,
    overflow: 'hidden',
    ...CORE_SHADOWS.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  iconOuter: {
    marginBottom: 14,
    ...CORE_SHADOWS.button,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Region switcher
  regionSwitcher: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
  },
  regionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  regionButtonActive: {
    backgroundColor: '#FFFFFF',
    ...CORE_SHADOWS.xs,
  },
  regionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  regionButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Progress
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  progressTextDone: {
    color: '#2ED573',
    fontWeight: '500',
  },

  // Content
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 3,
    marginVertical: 12,
    gap: 10,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },

  // SMS Consent
  smsConsentBox: {
    borderLeftWidth: 3,
    padding: 14,
    marginVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.04)',
  },
  smsConsentTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  smsConsentText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  smsPurposesList: {
    marginVertical: 6,
    paddingLeft: 4,
  },
  smsPurposeItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 3,
  },
  smsNoticeText: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
  },
  smsNoticeBold: {
    fontWeight: '700',
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  declineButton: {
    flex: 0.4,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  acceptButton: {
    flex: 0.6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  acceptButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  acceptButtonTextDisabled: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.disabled,
  },
});
