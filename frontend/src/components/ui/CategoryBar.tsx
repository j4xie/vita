import React, { useRef, useEffect } from 'react';
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
  
  // 容器缩放动画
  const containerScale = useRef(new Animated.Value(1)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  
  // V2.0 获取L1分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  // L1Config获取完成

  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'zh' | 'en';
  
  // 修改为基于时间的活动状态分类 - 使用翻译函数
  const segments = [
    t('filters.status.all', '全部'),
    t('filters.status.upcoming', '即将开始'),
    t('filters.status.ended', '已结束')
  ];
  
  // 切换时的动画效果
  useEffect(() => {
    // 轻微的缩放动画，表示状态变化
    Animated.sequence([
      Animated.timing(containerScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(containerScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedSegment]);

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
      paddingHorizontal: 0,
      backgroundColor: isDarkMode ? 'rgba(40, 40, 42, 0.95)' : 'rgba(255, 255, 255, 0.85)', // 加强背景白色
      borderRadius: 24, // 更圆润的背景
      marginHorizontal: 0,
      marginVertical: 0,
      justifyContent: 'center',
      // 加强阴影和边框
      borderWidth: 1.5,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      paddingHorizontal: 0, // 移除padding让气泡可以贴边
    },
    segmentedControlWrapper: {
      flex: 1,
      marginRight: 0, // 移除filter按钮后恢复正常边距
      justifyContent: 'center',
      height: 38, // 恢复正常高度匹配SegmentedControl
      marginLeft: 0, // 移除filter按钮后恢复居中
    },
    // Filter相关样式已移除
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          transform: [{ scale: containerScale }],
          opacity: containerOpacity,
        }
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.segmentedControlWrapper}>
          <SegmentedControl
            segments={segments}
            selectedIndex={selectedSegment}
            onIndexChange={onSegmentChange}
          />
        </View>
        
        {/* Filter按钮已移除 */}
      </View>
    </Animated.View>
  );
};

export default CategoryBar;