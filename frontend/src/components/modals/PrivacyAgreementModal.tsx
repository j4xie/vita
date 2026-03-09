import React, { useState, useRef, useEffect } from 'react';
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
import { useMemoizedDarkMode, useBlurViewConfig } from '../../hooks/useDarkMode';
import { useTheme } from '../../context/ThemeContext';

interface PrivacyAgreementModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  userArea?: 'zh' | 'en' | 'combined'; // 用户地域选择
  allowRegionSwitch?: boolean; // 是否允许手动切换地域
  onRegionChange?: (region: 'zh' | 'en' | 'combined') => void; // 地域切换回调
}

export const PrivacyAgreementModal: React.FC<PrivacyAgreementModalProps> = ({
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

  // 当userArea改变时更新currentRegion
  useEffect(() => {
    setCurrentRegion(userArea);
  }, [userArea]);
  
  // 🌙 Dark Mode Support
  const darkMode = useMemoizedDarkMode();
  const blurConfig = useBlurViewConfig();
  const { isDarkMode } = darkMode;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const scrollHeight = contentSize.height - layoutMeasurement.height;
    
    // 滚动进度计算
    
    // 计算滚动进度 (0-1)
    const progress = scrollHeight > 0 ? Math.min(scrollY / scrollHeight, 1) : 1;
    setScrollProgress(progress);
    
    // 🚀 更宽松的底部检测 (允许20px的误差)
    const isAtBottom = scrollHeight <= 20 || scrollY >= scrollHeight - 20;
    setHasScrolledToBottom(isAtBottom);
    
    // 如果内容不够长无需滚动，直接标记为已读完
    if (scrollHeight <= 0) {
      setHasScrolledToBottom(true);
    }
  };

  const handleModalShow = () => {
    // 重置状态当模态框显示时
    setHasScrolledToBottom(false);
    setScrollProgress(0);
    
    // 检查内容高度
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.measure(() => {
          // 内容高度检查
        });
      }
    }, 500);
  };

  // 完整的Markdown转换函数
  const convertMarkdownToText = (markdownText: string): string => {
    if (!markdownText) return '';
    
    return markdownText
      // 移除所有标题标记 - 强化清理
      .replace(/#{1,6}\s*/g, '')
      .replace(/##\s*/g, '')
      .replace(/#\s*/g, '')
      // 移除粗体标记
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // 移除斜体标记
      .replace(/\*(.*?)\*/g, '$1')
      // 移除链接格式
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 移除代码块
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // 处理列表项
      .replace(/^[\s]*[•\-*+]\s*/gm, '• ')
      .replace(/^[\s]*\d+\.\s*/gm, '• ')
      // 清理格式
      .replace(/•\s*•\s*/g, '• ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n').map(line => line.trim()).join('\n')
      .trim();
  };

  // 🌍 根据用户语言 + 地理位置选择隐私内容
  const getPrivacyContent = () => {
    // 获取当前语言设置
    const currentLanguage = t('common.brand.name') === 'PomeloX' ? 'zh' : 'en';
    
    // 根据语言 + 地理位置组合决定显示的隐私协议版本
    let rawContent: string;
    if (currentRegion === 'zh') {
      // 用户选择中国版
      rawContent = t('legal.privacy.content_china');
    } else if (currentRegion === 'en') {
      // 用户选择美国版
      rawContent = t('legal.privacy.content_usa');
    } else {
      // 默认显示合并版本
      rawContent = t('legal.privacy.full_content');
    }
    
    // 转换Markdown为纯文本
    return convertMarkdownToText(rawContent);
  };

  // 处理地域切换
  const handleRegionSwitch = (region: 'zh' | 'en' | 'combined') => {
    setCurrentRegion(region);
    // 重置滚动状态，要求用户重新阅读
    setHasScrolledToBottom(false);
    setScrollProgress(0);
    // 回调给父组件
    onRegionChange?.(region);
  };

  // 🌙 Dynamic Styles - 基于Dark Mode动态生成关键样式
  const dynamicModalContainer = {
    ...styles.modalContainer,
    backgroundColor: isDarkMode ? darkMode.elevatedBackground : LIQUID_GLASS_LAYERS.L1.background.light,
    borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : LIQUID_GLASS_LAYERS.L1.border.color.light,
  };

  const dynamicIconColor = isDarkMode ? darkMode.brandPrimary : theme.colors.primary;
  const dynamicTextColor = isDarkMode ? darkMode.primaryText : theme.colors.text.primary;
  const dynamicSecondaryTextColor = isDarkMode ? darkMode.secondaryText : theme.colors.text.secondary;

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
            <View style={dynamicModalContainer}>
              {/* Header - 🌙 Dark Mode适配 */}
              <View style={[styles.header, { borderBottomColor: dynamicSecondaryTextColor }]}>
                <View style={[styles.iconContainer, { backgroundColor: dynamicIconColor + '15' }]}>
                  <Ionicons 
                    name="shield-checkmark" 
                    size={24} 
                    color={dynamicIconColor}
                  />
                </View>
                <Text style={[styles.title, { color: dynamicTextColor }]}>
                  {t('auth.register.privacy.title')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('auth.register.privacy.subtitle_simple') || 'Privacy Policy'}
                </Text>
                
                {/* 移除地理检测结果显示 - 用户不需要看到检测方法 */}
                
                {/* 地域切换器 */}
                {allowRegionSwitch && (
                  <View style={styles.regionSwitcher}>
                    <Text style={[styles.regionLabel, { color: dynamicSecondaryTextColor }]}>
                      {t('auth.register.privacy.version_label')}
                    </Text>
                    <View style={styles.regionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.regionButton,
                          currentRegion === 'combined' && [styles.regionButtonActive, { backgroundColor: dynamicIconColor, borderColor: dynamicIconColor }]
                        ]}
                        onPress={() => handleRegionSwitch('combined')}
                      >
                        <Text style={[
                          styles.regionButtonText,
                          { color: dynamicSecondaryTextColor },
                          currentRegion === 'combined' && styles.regionButtonTextActive
                        ]}>
                          {t('auth.register.privacy.version_combined')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.regionButton,
                          currentRegion === 'zh' && [styles.regionButtonActive, { backgroundColor: dynamicIconColor, borderColor: dynamicIconColor }]
                        ]}
                        onPress={() => handleRegionSwitch('zh')}
                      >
                        <Text style={[
                          styles.regionButtonText,
                          { color: dynamicSecondaryTextColor },
                          currentRegion === 'zh' && styles.regionButtonTextActive
                        ]}>
                          {t('auth.register.privacy.version_china')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.regionButton,
                          currentRegion === 'en' && [styles.regionButtonActive, { backgroundColor: dynamicIconColor, borderColor: dynamicIconColor }]
                        ]}
                        onPress={() => handleRegionSwitch('en')}
                      >
                        <Text style={[
                          styles.regionButtonText,
                          { color: dynamicSecondaryTextColor },
                          currentRegion === 'en' && styles.regionButtonTextActive
                        ]}>
                          {t('auth.register.privacy.version_usa')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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
                bounces={true}
                alwaysBounceVertical={true}
                nestedScrollEnabled={true}
                scrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => {
                  // 内容尺寸变化处理
                }}
                onLayout={() => {
                  // 容器布局处理
                }}
              >
                <Text style={styles.contentText}>
                  {getPrivacyContent()}
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

                {/* SMS Consent Section */}
                <View style={[styles.smsConsentBox, {
                  backgroundColor: isDarkMode
                    ? dynamicIconColor + '12'
                    : theme.colors.primary + '08',
                  borderLeftColor: dynamicIconColor,
                }]}>
                  <Text style={[styles.smsConsentTitle, { color: dynamicIconColor }]}>
                    📱 {t('auth.register.sms.consent_title')}
                  </Text>
                  <Text style={[styles.smsConsentText, { color: dynamicTextColor }]}>
                    ✅ <Text style={styles.smsConsentBold}>{t('auth.register.sms.consent_text')}</Text> - {t('auth.register.sms.consent_description')}
                  </Text>
                  <View style={styles.smsPurposesList}>
                    <Text style={[styles.smsPurposeItem, { color: dynamicTextColor }]}>• {t('auth.register.sms.consent_purposes.authentication')}</Text>
                    <Text style={[styles.smsPurposeItem, { color: dynamicTextColor }]}>• {t('auth.register.sms.consent_purposes.notifications')}</Text>
                    <Text style={[styles.smsPurposeItem, { color: dynamicTextColor }]}>• {t('auth.register.sms.consent_purposes.services')}</Text>
                  </View>
                  <Text style={[styles.smsNoticeText, { color: dynamicSecondaryTextColor }]}>
                    <Text style={styles.smsNoticeBold}>
                      {t('auth.register.sms.notice_prefix')}
                    </Text>
                    {t('auth.register.sms.consent_notice')}
                  </Text>
                </View>
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
                    {hasScrolledToBottom ? (t('auth.register.privacy.accept_simple') || 'Agree') : t('auth.register.privacy.scroll_to_accept')}
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
    height: '80%', // 🚀 使用固定高度比例确保布局稳定
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: 20,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
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
  // 地域切换器样式
  regionSwitcher: {
    marginTop: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
  },
  regionLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  regionButtons: {
    flexDirection: 'row',
    gap: theme.spacing[1],
  },
  regionButton: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: 99,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    backgroundColor: theme.colors.background.secondary,
  },
  regionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  regionButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  regionButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  // SMS Consent Styles
  smsConsentBox: {
    borderLeftWidth: 4,
    padding: theme.spacing[4],
    marginVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
  },
  smsConsentTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[3],
  },
  smsConsentText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing[2],
  },
  smsConsentBold: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  smsPurposesList: {
    marginVertical: theme.spacing[2],
    paddingLeft: theme.spacing[2],
  },
  smsPurposeItem: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing[1],
  },
  smsNoticeText: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
    marginTop: theme.spacing[2],
  },
  smsNoticeBold: {
    fontWeight: theme.typography.fontWeight.bold,
  },
});