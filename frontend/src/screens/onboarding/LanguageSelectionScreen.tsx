import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { theme } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../utils/i18n';
import { getLocalizedTextWidth } from '../../utils/i18n';

const { width, height } = Dimensions.get('window');

interface LanguageOption {
  code: SupportedLanguage;
  displayName: string;
  nativeName: string;
  flag: string;
  description: string;
}

export const LanguageSelectionScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { 
    deviceLanguage, 
    changeLanguage, 
    markLanguageSelected,
    currentLanguage 
  } = useLanguage();
  
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(deviceLanguage);
  const [isLoading, setIsLoading] = useState(false);
  
  // 动画值
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  // 语言选项配置
  const languageOptions: LanguageOption[] = [
    {
      code: 'zh-CN',
      displayName: t('language.chinese'),
      nativeName: t('language.simplified_chinese'),
      flag: '🇨🇳',
      description: t('language.chinese_description'),
    },
    {
      code: 'en-US',
      displayName: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      description: t('language.english_description'),
    },
  ];

  useEffect(() => {
    // 启动动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLanguageSelect = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
    
    // 触觉反馈
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in window.navigator) {
      (window.navigator as any).vibrate?.(10);
    }
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // 应用选择的语言
      await changeLanguage(selectedLanguage);
      
      // 标记语言选择已完成
      markLanguageSelected();
      
      // 导航到主界面
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanguageOption = (option: LanguageOption) => {
    const isSelected = selectedLanguage === option.code;
    const isRecommended = option.code === deviceLanguage;
    
    return (
      <TouchableOpacity
        key={option.code}
        style={[
          styles.languageOption,
          isSelected && styles.languageOptionSelected,
        ]}
        onPress={() => handleLanguageSelect(option.code)}
        activeOpacity={0.7}
      >
        {/* 推荐标签 */}
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>
              {t('language.recommended')}
            </Text>
          </View>
        )}
        
        {/* 选择指示器 */}
        <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
          {isSelected && (
            <View style={styles.radioInner} />
          )}
        </View>
        
        {/* 语言信息 */}
        <View style={styles.languageInfo}>
          <View style={styles.languageHeader}>
            <Text style={styles.flag}>{option.flag}</Text>
            <Text style={[styles.displayName, isSelected && styles.textSelected]}>
              {option.displayName}
            </Text>
          </View>
          <Text style={[styles.nativeName, isSelected && styles.textSelectedSecondary]}>
            {option.nativeName}
          </Text>
          <Text style={[styles.description, isSelected && styles.textSelectedSecondary]}>
            {option.description}
          </Text>
        </View>
        
        {/* 选中状态指示器 */}
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color={theme.colors.primary} 
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryPressed]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* 头部 */}
          <View style={styles.header}>
            {/* Logo - Shadow优化 */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/logos/pomelo-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            
            {/* 标题 */}
            <Text style={styles.title}>
              {currentLanguage === 'zh-CN' ? t('language.selection.title') : t('language.selection.title_en')}
            </Text>
            <Text style={styles.subtitle}>
              {currentLanguage === 'zh-CN' 
                ? '请选择您偏好的语言' 
                : 'Please select your preferred language'
              }
            </Text>
          </View>

          {/* 语言选项列表 */}
          <View style={styles.optionsContainer}>
            {languageOptions.map(renderLanguageOption)}
          </View>

          {/* 确认按钮 - Shadow优化 */}
          <View style={[styles.confirmButtonShadowContainer, isLoading && styles.confirmButtonDisabled]}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryPressed]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
            <TouchableOpacity
              style={styles.confirmButtonInner}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={styles.loadingDot} />
                  <Animated.View style={[styles.loadingDot, styles.loadingDotDelay1]} />
                  <Animated.View style={[styles.loadingDot, styles.loadingDotDelay2]} />
                </View>
              ) : (
                <>
                  <Text style={styles.confirmButtonText}>
                    {currentLanguage === 'zh-CN' ? t('language.selection.confirm') : t('language.selection.confirm_en')}
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={theme.colors.text.inverse} 
                    style={styles.confirmIcon}
                  />
                </>
              )}
            </TouchableOpacity>
            </LinearGradient>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
  },
  
  // 头部样式
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  // Shadow容器 - 解决LinearGradient阴影冲突
  logoShadowContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius['4xl'],
    backgroundColor: theme.colors.secondary, // solid background用于阴影优化
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  logoImage: {
    width: 80,
    height: 80,
    // 移除tintColor，保持PomeloX logo原色
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.relaxed,
  },
  
  // 选项容器
  optionsContainer: {
    marginBottom: theme.spacing['3xl'],
  },
  
  // 语言选项样式
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    backdropFilter: 'blur(10px)',
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  
  // 推荐标签
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
  },
  recommendedText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  
  // 单选按钮
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  
  // 语言信息
  languageInfo: {
    flex: 1,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  flag: {
    fontSize: theme.typography.fontSize.xl,
    marginRight: theme.spacing.sm,
  },
  displayName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  nativeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  textSelected: {
    color: theme.colors.text.inverse,
  },
  textSelectedSecondary: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  
  // 选中图标
  checkIcon: {
    marginLeft: theme.spacing.sm,
  },
  
  // 确认按钮Shadow容器 - 解决LinearGradient阴影冲突
  confirmButtonShadowContainer: {
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.primary, // solid background用于阴影优化
    ...theme.shadows.button,
  },
  
  confirmButton: {
    borderRadius: theme.borderRadius.button,
    // 移除阴影，由confirmButtonShadowContainer处理
  },
  
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  confirmIcon: {
    marginLeft: theme.spacing.sm,
  },
  
  // 加载动画
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.text.inverse,
    marginHorizontal: 2,
  },
  loadingDotDelay1: {
    // 可以添加动画延迟
  },
  loadingDotDelay2: {
    // 可以添加动画延迟
  },
});