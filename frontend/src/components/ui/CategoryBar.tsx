import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { LIQUID_GLASS_LAYERS, BRAND_GLASS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { SegmentedControl } from './SegmentedControl';

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

  const segments = [
    t('activities.filters.all'),
    t('activities.filters.ongoing'), 
    t('activities.filters.upcoming')
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
      height: 56,
      paddingHorizontal: 16, // 与底部导航栏保持一致的内边距
      backgroundColor: isDarkMode 
        ? 'rgba(28, 28, 30, 0.95)' // 系统深色次级背景
        : 'rgba(242, 242, 247, 0.95)', // 系统浅色次级背景
      borderRadius: 18,
      marginHorizontal: 0, // 移除外边距，与卡片/导航栏宽度完全对齐
      marginVertical: 0, // 移除垂直边距消除白块
      justifyContent: 'center',
      // 添加边框裁剪防止模糊边缘溢出
      overflow: 'hidden',
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
    },
    segmentedControlWrapper: {
      flex: 1,
      marginRight: 12, // 12pt间距
      justifyContent: 'center', // 确保垂直居中
      height: 38, // 与筛选按钮保持一致高度
    },
    filterButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 38, // 确保容器高度与按钮一致
      marginRight: -2, // 微调右边距，与底部导航栏"安心"按钮对齐
    },
    filterButton: {
      width: 38,
      height: 38, // 确保与SegmentedControl相同高度
      borderRadius: 19,
      backgroundColor: isDarkMode 
        ? 'rgba(118, 118, 128, 0.24)'
        : 'rgba(118, 118, 128, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary,
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
                size={20}
                color={
                  hasActiveFilters
                    ? theme.colors.text.inverse
                    : isDarkMode
                    ? 'rgba(235, 235, 245, 0.6)'
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