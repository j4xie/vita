/**
 * v1.2 骨架屏组件
 * 提供优雅的加载占位效果，符合Liquid-Glass设计语言
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  DimensionValue,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonScreenProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'rect' | 'circle' | 'card';
  lines?: number; // 文本行数
  showShimmer?: boolean;
}

/**
 * 单个骨架屏元素
 */
export const SkeletonElement: React.FC<SkeletonScreenProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  variant = 'rect',
  showShimmer = true,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showShimmer) {
      // v1.2 规范: shimmer动画时长 1100ms
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: theme.performance.image.skeletonDuration, // 1100ms
          useNativeDriver: true,
        })
      ).start();
    }
  }, [showShimmer, shimmerAnim]);

  // 根据变体计算样式
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circle':
        const size = typeof width === 'number' ? width : 50;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'text':
        return {
          width: typeof width === 'number' ? width : parseInt(String(width)) || 0,
          height: 16,
          borderRadius: theme.borderRadius.xs,
        };
      case 'card':
        return {
          width: width as DimensionValue,
          height: (height || 200) as DimensionValue,
          borderRadius: theme.borderRadius.md,
        };
      default:
        return {
          width: width as DimensionValue,
          height: height as DimensionValue,
          borderRadius: borderRadius || theme.borderRadius.sm,
        };
    }
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  return (
    <View style={[styles.skeleton, getVariantStyles(), style]}>
      {showShimmer && (
        <Animated.View
          style={[
            styles.shimmerContainer,
            {
              transform: [{ translateX: shimmerTranslateX }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              'rgba(255, 255, 255, 0.3)',
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
        </Animated.View>
      )}
    </View>
  );
};

/**
 * 文本骨架屏（多行）
 */
export const SkeletonText: React.FC<{
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string | number;
  showShimmer?: boolean;
}> = ({ 
  lines = 3, 
  lineHeight = 16,
  lastLineWidth = '60%',
  showShimmer = true 
}) => {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonElement
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={index > 0 ? { marginTop: theme.spacing[2] } : undefined}
          showShimmer={showShimmer}
        />
      ))}
    </View>
  );
};

/**
 * 活动卡片骨架屏
 */
export const ActivityCardSkeleton: React.FC<{
  showShimmer?: boolean;
}> = ({ showShimmer = true }) => {
  return (
    <View style={styles.cardContainer}>
      {/* 图片区域 */}
      <SkeletonElement
        variant="card"
        height={240}
        showShimmer={showShimmer}
      />
      
      {/* 内容区域 */}
      <View style={styles.cardContent}>
        {/* 标题 */}
        <SkeletonElement
          width="80%"
          height={24}
          showShimmer={showShimmer}
        />
        
        {/* 副标题 */}
        <SkeletonElement
          width="60%"
          height={16}
          style={{ marginTop: theme.spacing[2] }}
          showShimmer={showShimmer}
        />
        
        {/* 元信息 */}
        <View style={styles.metaRow}>
          <SkeletonElement
            width={100}
            height={14}
            showShimmer={showShimmer}
          />
          <SkeletonElement
            width={80}
            height={14}
            style={{ marginLeft: theme.spacing[3] }}
            showShimmer={showShimmer}
          />
        </View>
        
        {/* 底部操作区 */}
        <View style={styles.actionRow}>
          <View style={styles.participantInfo}>
            <SkeletonElement
              variant="circle"
              width={20}
              showShimmer={showShimmer}
            />
            <SkeletonElement
              width={60}
              height={14}
              style={{ marginLeft: theme.spacing[2] }}
              showShimmer={showShimmer}
            />
          </View>
          <SkeletonElement
            width={80}
            height={36}
            borderRadius={theme.borderRadius.full}
            showShimmer={showShimmer}
          />
        </View>
      </View>
    </View>
  );
};

/**
 * 列表骨架屏
 */
export const ListSkeleton: React.FC<{
  count?: number;
  showShimmer?: boolean;
  renderItem?: () => JSX.Element;
}> = ({ 
  count = 3, 
  showShimmer = true,
  renderItem 
}) => {
  const ItemComponent = renderItem || (() => <ActivityCardSkeleton showShimmer={showShimmer} />);
  
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={index > 0 ? { marginTop: theme.spacing[4] } : undefined}>
          <ItemComponent />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.background.tertiary,
    overflow: 'hidden',
    position: 'relative',
  },
  
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  shimmer: {
    width: screenWidth * 2,
    height: '100%',
  },
  
  textContainer: {
    width: '100%',
  },
  
  cardContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  
  cardContent: {
    padding: theme.spacing[4],
  },
  
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[3],
  },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[4],
  },
  
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  listContainer: {
    padding: theme.spacing[4],
  },
});

export default {
  SkeletonElement,
  SkeletonText,
  ActivityCardSkeleton,
  ListSkeleton,
};