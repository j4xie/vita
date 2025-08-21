import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { SegmentedControl } from './SegmentedControl';
import { ACTIVITY_CATEGORIES } from '../../data/activityCategories';

interface CategoryBarProps {
  selectedSegment: number;
  onSegmentChange: (index: number) => void;
  onFilterPress: () => void;
  hasActiveFilters?: boolean;
  activeFiltersCount?: number;
}

const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedSegment,
  onSegmentChange,
  onFilterPress,
  hasActiveFilters = false,
  activeFiltersCount = 0,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const filterButtonScale = useRef(new Animated.Value(1)).current;
  
  // V2.0 获取L1分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  // L1Config获取完成

  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'zh' | 'en';
  
  const segments = [
    t('activities.filters.all'),
    ...ACTIVITY_CATEGORIES.map(category => category.name[currentLanguage])
  ];

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Add press animation - 180ms标准时长
    Animated.sequence([
      Animated.timing(filterButtonScale, {
        toValue: 0.95,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(filterButtonScale, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
    
    onFilterPress();
  };

  const styles = StyleSheet.create({
    container: {
      height: 48,
      paddingHorizontal: 0, // 移除padding，让内容自己控制间距
      backgroundColor: 'rgba(255, 255, 255, 0.85)', // 强制显示玻璃背景以便调试
      borderWidth: 1, // 临时添加边框以便看到容器
      borderColor: 'rgba(255, 255, 255, 0.30)', // 玻璃边框
      borderRadius: 20, // 添加圆角
      marginHorizontal: 0, // 完全移除边距
      marginVertical: 0, // 完全移除垂直边距
      justifyContent: 'center',
      // 添加阴影确保可见性
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      paddingHorizontal: 1.5, // 4个按钮往中间移动1.5px
    },
    segmentedControlWrapper: {
      flex: 1,
      marginRight: 8, // 减少右边距适配更窄容器
      justifyContent: 'center', // 确保垂直居中
      height: 38, // 与筛选按钮保持一致高度
      // 移除调试边框
    },
    filterButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 38, // 确保容器高度与按钮一致
      marginLeft: -2, // 再往左移动2px，从0改为-2
    },
    filterButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      // 强制使用固定的玻璃背景，避免配置问题
      backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.30)',
      alignItems: 'center',
      justifyContent: 'center',
      // 优化阴影效果，提高性能
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 }, // Reduced from 6 to 2
      shadowOpacity: 0.08, // Reduced from 0.12 to 0.08
      shadowRadius: 8, // Reduced from 16 to 8
      elevation: 3, // Reduced from 6 to 3
    },
    filterButtonActive: {
      // 强制使用固定的品牌色背景
      backgroundColor: isDarkMode ? 'rgba(255, 107, 53, 0.14)' : 'rgba(255, 107, 53, 0.14)',
      borderColor: isDarkMode ? 'rgba(255, 107, 53, 0.18)' : 'rgba(255, 107, 53, 0.22)',
    },
    filterBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.text.inverse,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.segmentedControlWrapper}>
          <SegmentedControl
            segments={segments}
            selectedIndex={selectedSegment}
            onIndexChange={onSegmentChange}
          />
        </View>
        
        <View style={styles.filterButtonContainer}>
          <Animated.View style={{ transform: [{ scale: filterButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
              onPress={handleFilterPress}
              accessibilityLabel={t('common.filter', { count: activeFiltersCount })}
              accessibilityHint={t('common.filterHint')}
              accessibilityRole="button"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="options"
                size={22} // 略增大图标
                color={
                  hasActiveFilters
                    ? theme.colors.text.inverse
                    : theme.colors.text.secondary
                }
              />
            </TouchableOpacity>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {activeFiltersCount > 9 ? '9+' : activeFiltersCount}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default CategoryBar;