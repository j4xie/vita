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
import { useMemoizedDarkMode } from '../../hooks/useDarkMode';
import { SegmentedControl } from './SegmentedControl';
import { ACTIVITY_CATEGORIES } from '../../data/activityCategories';

interface CategoryBarProps {
  selectedSegment: number;
  onSegmentChange: (index: number) => void;
  onFilterPress?: () => void; // 设为可选
  onScanPress: () => void; // 新增扫码按钮回调
  hasActiveFilters?: boolean;
  activeFiltersCount?: number;
}

const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedSegment,
  onSegmentChange,
  onFilterPress,
  onScanPress,
  hasActiveFilters = false,
  activeFiltersCount = 0,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // 🌙 Dark Mode Support - 使用统一的Hook
  const darkMode = useMemoizedDarkMode();
  const { isDarkMode } = darkMode;
  
  const filterButtonScale = useRef(new Animated.Value(1)).current;
  const scanButtonScale = useRef(new Animated.Value(1)).current;
  
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
    t('filters.status.available', '可报名'),
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
    if (!onFilterPress) return;
    
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

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Add press animation
    Animated.sequence([
      Animated.timing(scanButtonScale, {
        toValue: 0.95,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scanButtonScale, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
    
    onScanPress();
  };


  const styles = StyleSheet.create({
    container: {
      height: 40,
      paddingHorizontal: 0,
      backgroundColor: isDarkMode ? darkMode.elevatedBackground : 'rgba(255, 255, 255, 0.85)',
      borderRadius: 20,
      marginHorizontal: 0,
      marginVertical: 0,
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(255, 255, 255, 0.8)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.25 : 0.12,
      shadowRadius: isDarkMode ? 6 : 4,
      elevation: isDarkMode ? 5 : 3,
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      paddingHorizontal: 8,
    },
    rightButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    scanButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: '#F9A889',
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentedControlWrapper: {
      flex: 1,
      marginHorizontal: 8,
      justifyContent: 'center',
      height: 32,
    }
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
        
        {/* 分段控件 */}
        <View style={styles.segmentedControlWrapper}>
          <SegmentedControl
            segments={segments}
            selectedIndex={selectedSegment}
            onIndexChange={onSegmentChange}
          />
        </View>
        
        {/* 右侧扫码按钮 */}
        <View style={styles.rightButtonContainer}>
          <Animated.View style={{ transform: [{ scale: scanButtonScale }] }}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanPress}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="scan-outline"
                size={18}
                color="#F9A889"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

export default CategoryBar;