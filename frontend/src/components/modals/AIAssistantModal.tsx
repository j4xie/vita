import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Show/hide animations
  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  // AI功能使用主题色
  const themeColor = theme.colors.primary;
  const lightThemeColor = themeColor + '20';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Animated backdrop */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: backdropOpacity }
          ]}
        >
          <View style={styles.blurContainer}>
            {Platform.OS === 'ios' ? (
              <BlurView 
                intensity={15} // 降低毛玻璃强度，防止发灰
                style={StyleSheet.absoluteFill}
                tint={isDarkMode ? 'dark' : 'light'}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { 
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.48)' : 'rgba(0,0,0,0.44)' // 40-48%范围
              }]} />
            )}
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Modal content */}
      <View style={[styles.centeredView, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.modalContent,
              styles.modalContentGlass,
              {
                opacity: contentOpacity,
                transform: [{ scale: contentScale }],
              },
            ]}
          >
            <View style={[styles.contentGradient, styles.contentGlass]}>
              {/* Close button - 36pt直径，44pt触达区域 */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} // 扩展触达区域到44pt
              >
                <Ionicons
                  name="close"
                  size={20} // 稍微减小图标尺寸，符合SF Symbols标准
                  color={isDarkMode ? '#8e8e93' : '#8e8e93'}
                />
              </TouchableOpacity>

              {/* Header with AI icon */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: lightThemeColor }]}>
                  <Ionicons
                    name="sparkles" // AI智能图标
                    size={32}
                    color={themeColor}
                  />
                </View>
                <Text style={[
                  styles.title,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  {t('ai.title')}
                </Text>
              </View>

              {/* AI status badge */}
              <View style={styles.statusSection}>
                <LinearGradient
                  colors={[themeColor + '15', themeColor + '05']}
                  style={styles.statusBadge}
                >
                  <View style={[styles.statusIcon, { backgroundColor: lightThemeColor }]}>
                    <Ionicons
                      name="construct-outline"
                      size={20}
                      color={themeColor}
                    />
                  </View>
                  <Text style={[
                    styles.statusText,
                    { color: isDarkMode ? '#ffffff' : '#1d1d1f' }
                  ]}>
                    {t('ai.status')}
                  </Text>
                </LinearGradient>
              </View>

              {/* Main message */}
              <View style={styles.messageSection}>
                <Text style={[
                  styles.mainMessage,
                  { color: isDarkMode ? '#ffffff' : '#1d1d1f' }
                ]}>
                  {t('ai.mainMessage')}
                </Text>
                <Text style={[
                  styles.description,
                  { color: isDarkMode ? '#8e8e93' : '#8e8e93' }
                ]}>
                  {t('ai.description')}
                </Text>
              </View>

              {/* Feature preview - 精简版 */}
              <View style={styles.featureSection}>
                <Text style={[
                  styles.featureTitle,
                  { color: isDarkMode ? '#ffffff' : '#1d1d1f' }
                ]}>
                  {t('ai.comingFeatures')}
                </Text>
                <View style={styles.featureList}>
                  {[
                    { icon: 'chatbubble-ellipses-outline', text: t('ai.features.chat') },
                    { icon: 'calendar-outline', text: t('ai.features.calendar') },
                    { icon: 'language-outline', text: t('ai.features.translation') },
                    { icon: 'school-outline', text: t('ai.features.academic') },
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons
                        name={feature.icon as any}
                        size={18} // 减小图标尺寸
                        color={themeColor}
                        style={styles.featureIcon}
                      />
                      <Text style={[
                        styles.featureText,
                        { color: isDarkMode ? '#c7c7cc' : '#6d6d70' }
                      ]}>
                        {feature.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action buttons - Dawn Gradient */}
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.primaryButton,
                    styles.l2BrandGlassButton // L2品牌玻璃按钮（推荐方案A）
                  ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {t('ai.gotIt')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)', // 遮罩黑30-40%
  },
  blurContainer: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320, // 控制行宽在280-320pt范围
    borderRadius: 24, // 24pt圆角规范
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // 轻量阴影
    shadowOpacity: 0.08, // opacity≤0.08
    shadowRadius: 16, // 减小阴影半径
    elevation: 8, // Android轻量投影
  },
  contentGradient: {
    borderRadius: 28, // 按建议增加到24-28范围
    paddingVertical: 20,
    paddingHorizontal: 24,
    // L3玻璃效果
    backgroundColor: 'rgba(255, 255, 255, 0.90)', // 90%白
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18, // L1圆形
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12, // 进一步压缩间距
    marginTop: 2, // 进一步压缩间距
  },
  iconContainer: {
    width: 44, // 减小图标容器
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // 压缩间距
    // L2轻染背景
    backgroundColor: 'rgba(249, 168, 137, 0.14)', // Dawn 14%轻染
  },
  title: {
    fontSize: 22, // 20-22pt规范
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28, // 调整行距
    maxWidth: '100%', // 确保两行内
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 16, // 压缩间距
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  statusIcon: {
    width: 42, // Increased from 36 to better accommodate 4-character abbreviations
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  messageSection: {
    marginBottom: 18, // 压缩间距
  },
  mainMessage: {
    fontSize: 16, // 副标题15-17pt规范
    fontWeight: '500',
    lineHeight: 22, // 行距1.3-1.4
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15, // 正文15pt
    lineHeight: 21, // 行距1.4 (15*1.4=21)
    textAlign: 'center',
    maxWidth: 280, // 限制最大宽度确保一行显示
  },
  featureSection: {
    marginBottom: 16, // 进一步压缩区域间距
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8, // 压缩标题间距
    textAlign: 'center',
  },
  featureList: {
    paddingHorizontal: 8,
    alignItems: 'center', // 居中对齐整个列表
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, // 进一步压缩行距
    minHeight: 18, // 减小最小高度
    justifyContent: 'center',
    maxWidth: 200,
  },
  featureIcon: {
    marginRight: 12,
    width: 22, // 20-22pt图标尺寸
  },
  featureText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
    textAlignVertical: 'center', // 与图标基线对齐
  },
  buttonSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16, // 圆角14-16
    minHeight: 48, // 高度44-48
    // 增强对比度的按钮背景
    backgroundColor: 'rgba(249, 168, 137, 0.8)', // 提高到80%确保足够对比度
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 137, 0.9)', // 更深的描边
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF', // 白字
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // 添加文字阴影增强可读性
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // V2.0 L3浮层玻璃模态框
  modalContentGlass: {
    backgroundColor: LIQUID_GLASS_LAYERS.L3.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L3.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L3.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L3.borderRadius.modal,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L3.shadow],
  },
  
  // V2.0 内容玻璃效果
  contentGlass: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

export default AIAssistantModal;