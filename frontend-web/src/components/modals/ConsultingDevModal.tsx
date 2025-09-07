import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from '../../components/web/WebBlurView';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';

export interface SchoolInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

interface ConsultingDevModalProps {
  visible: boolean;
  school: SchoolInfo | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ConsultingDevModal: React.FC<ConsultingDevModalProps> = ({
  visible,
  school,
  onClose,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
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

  if (!school) return null;

  const schoolColor = school.color || theme.colors.primary;
  const lightSchoolColor = schoolColor + '20';
  const veryLightSchoolColor = schoolColor + '10';

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
      <View style={[styles.centeredView, { paddingTop: insets.top }]} >
        <TouchableWithoutFeedback>
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

              {/* Header with development icon */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: lightSchoolColor }]}>
                  <Ionicons
                    name="chatbubbles-outline" // 改为对话框图标，符合咨询语义
                    size={32}
                    color={schoolColor}
                  />
                </View>
                <Text style={[
                  styles.title,
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  {t('consulting.moduleDevelopment')}
                </Text>
              </View>

              {/* School badge */}
              <View style={styles.schoolSection}>
                <LinearGradient
                  colors={[schoolColor + '15', schoolColor + '05']}
                  style={styles.schoolBadge}
                >
                  <View style={[styles.schoolIcon, { backgroundColor: lightSchoolColor }]}>
                    <Text style={[styles.schoolShortName, { color: schoolColor }]}>
                      {school.shortName}
                    </Text>
                  </View>
                  <Text style={[
                    styles.schoolFullName,
                    { color: isDarkMode ? '#ffffff' : '#1d1d1f' }
                  ]}>
                    {school.name}
                  </Text>
                </LinearGradient>
              </View>

              {/* Main message */}
              <View style={styles.messageSection}>
                <Text style={[
                  styles.mainMessage,
                  { color: isDarkMode ? '#ffffff' : '#1d1d1f' }
                ]}>
                  {school.shortName 
                    ? t('consulting.developmentMessage', { school: school.shortName })
                    : t('consulting.developmentMessageFallback')
                  }
                </Text>
                <Text style={[
                  styles.description,
                  { color: isDarkMode ? '#8e8e93' : '#8e8e93' }
                ]}>
                  {t('consulting.developmentDescription')}
                </Text>
              </View>

              {/* Feature preview */}
              <View style={styles.featureSection}>
                <Text style={[
                  styles.featureTitle,
                  { color: isDarkMode ? '#ffffff' : '#1d1d1f' }
                ]}>
                  {t('consulting.comingFeatures')}
                </Text>
                <View style={styles.featureList}>
                  {[
                    { icon: 'school-outline', text: t('consulting.academicConsulting') },
                    { icon: 'home-outline', text: t('consulting.lifeGuidance') },
                    { icon: 'briefcase-outline', text: t('consulting.careerPlanning') },
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons
                        name={feature.icon as any}
                        size={20} // 20-22pt图标尺寸规范
                        color={schoolColor}
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
                  <View style={styles.primaryButtonGlass}>
                    <Text style={styles.primaryButtonText}>
                      {t('consulting.iKnow')}
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    borderRadius: 24, // 保持一致的圆角
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36, // 36pt直径
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16, // 调整与学校徽章的间距
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22, // 20-22pt规范
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28, // 调整行距
    maxWidth: '100%', // 确保两行内
  },
  schoolSection: {
    alignItems: 'center',
    marginBottom: 20, // 学校徽章与标题间距12-16pt规范
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
    justifyContent: 'center',
  },
  schoolIcon: {
    width: 42, // Increased from 36 to better accommodate 4-character abbreviations
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  schoolShortName: {
    fontSize: 13, // Reduced from 14 to 13 for better fit with longer abbreviations
    fontWeight: '700',
  },
  schoolFullName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  messageSection: {
    marginBottom: 24,
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
    marginBottom: 28,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureList: {
    paddingHorizontal: 8,
    alignItems: 'center', // 居中对齐整个列表
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9, // 8-10pt行距
    minHeight: 28, // 确保列表项高度一致
    justifyContent: 'center', // 每个功能项内部居中
    maxWidth: 200, // 限制最大宽度
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 50,
  },
  
  // V2.0 白色玻璃按钮
  primaryButtonGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // 极简白色玻璃
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)', // 淡灰边框
    borderTopColor: 'rgba(255, 255, 255, 0.8)', // 顶部白色高光
    ...theme.shadows.xs,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937', // 深灰色字体，在奶橘背景上更清晰
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    minHeight: 46,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginLeft: 4,
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

export default ConsultingDevModal;