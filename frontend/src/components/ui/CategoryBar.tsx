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
  
  // 调试：验证L1Config是否正确
  console.log('CategoryBar L1Config:', L1Config);

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
      height: 60, // 略增高度适配新设计
      paddingHorizontal: 12, // 减少内边距适配窄容器
      backgroundColor: 'rgba(255, 255, 255, 0.85)', // 直接使用L1玻璃背景
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.30)', // 直接使用L1边框色
      borderRadius: 20, // 20pt圆角
      marginHorizontal: -10, // 增加2px，从-8改为-10
      marginVertical: 4, // 4pt垂直边距
      justifyContent: 'center',
      overflow: 'hidden',
      // 直接使用xs阴影
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
    },
    segmentedControlWrapper: {
      flex: 1,
      marginRight: 8, // 减少右边距适配更窄容器
      justifyContent: 'center', // 确保垂直居中
      height: 38, // 与筛选按钮保持一致高度
    },
    filterButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 38, // 确保容器高度与按钮一致
      marginRight: 0, // 移除负边距，给分段控制器更多空间
    },
    filterButton: {
      width: 40, // 略增大适配新设计
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(118, 118, 128, 0.12)', // 非激活状态
      borderWidth: 1,
      borderColor: 'rgba(118, 118, 128, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.xs,
    },
    filterButtonActive: {
      backgroundColor: BRAND_GLASS.tint.primary, // L2品牌玻璃背景
      borderColor: BRAND_GLASS.border.primary, // 品牌色描边
      ...theme.shadows.sm, // 增强阴影
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
                    ? '#FFFFFF' // 品牌玻璃上使用白色图标
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