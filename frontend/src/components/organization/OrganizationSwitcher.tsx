/**
 * 组织轮盘切换器 - 极简稳定版本
 * 不使用SVG，避免渲染错误
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { Organization, OrganizationSwitcherProps } from '../../types/organization';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 优化的设计常量
const DESIGN = {
  // 折叠状态 - 精细调整
  collapsed: {
    height: screenHeight * 0.4, // 适中高度
    width: 8, // 细一点，但仍可见
    touchWidth: 44, // 符合iOS规范的最小触摸目标
    indicatorSize: 4, // 更小的指示点
  },
  // 展开状态 - 保持现有效果
  expanded: {
    height: screenHeight * 0.5,
    width: 160, // 展开时的宽度
  },
  position: { left: 0, top: screenHeight * 0.35 }, // 稍微下移
  colors: {
    collapsedBackground: 'rgba(255, 255, 255, 0.6)', // 更明显一点
    collapsedBorder: 'rgba(255, 107, 53, 0.8)', // 更明显的橙色边缘
    expandedBackground: 'rgba(255, 255, 255, 0.95)', // 展开时背景
    overlayBackground: 'rgba(0, 0, 0, 0.3)', // 遮罩背景
  }
};

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  onOrganizationChange,
  currentOrganization,
  organizations,
  disabled = false,
}) => {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const expandScale = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const breatheOpacity = useSharedValue(0.6); // 呼吸动画的透明度

  // 安全检查
  if (!organizations || organizations.length === 0) {
    console.log('No organizations to display');
    return null;
  }

  const displayOrg = currentOrganization || organizations[0];

  // 呼吸动画效果 - 增强可发现性
  useEffect(() => {
    // 每3秒一次的微妙呼吸动画
    const startBreathe = () => {
      breatheOpacity.value = withRepeat(
        withTiming(0.9, { duration: 1500 }),
        -1, // 无限重复
        true // 来回动画
      );
    };

    const timer = setTimeout(startBreathe, 2000); // 2秒后开始
    return () => clearTimeout(timer);
  }, [breatheOpacity]);

  const handleExpand = useCallback(() => {
    if (disabled) return;

    console.log('Expanding organization switcher');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsExpanded(true);
    expandScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    overlayOpacity.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, [disabled, expandScale, overlayOpacity]);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    expandScale.value = withSpring(0, { damping: 15, stiffness: 100 });
    overlayOpacity.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, [expandScale, overlayOpacity]);

  const handleOrganizationSelect = useCallback((org: Organization) => {
    console.log('Organization selected:', org.name);
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    handleCollapse();
    
    setTimeout(() => {
      onOrganizationChange(org.id);
    }, 200);
  }, [onOrganizationChange, handleCollapse]);

  // 动画样式
  const expandedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: expandScale.value }],
    opacity: expandScale.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const breatheStyle = useAnimatedStyle(() => ({
    opacity: breatheOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* 背景遮罩 */}
      {isExpanded && (
        <Animated.View style={[styles.overlay, overlayStyle]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: DESIGN.colors.overlayBackground }]} />
          )}
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCollapse} />
        </Animated.View>
      )}

      {/* 折叠状态：优化的弧形边缘 */}
      {!isExpanded && (
        <Animated.View style={[styles.collapsedContainer, breatheStyle]}>
          {/* 可见的弧形边缘 */}
          <View style={styles.collapsedEdge}>
            {/* 交互提示指示器 */}
            <View style={styles.interactionHints}>
              <View style={styles.indicatorDot} />
              <View style={styles.indicatorDot} />
              <View style={styles.indicatorDot} />
            </View>
          </View>
          
          {/* 扩大的触摸热区 */}
          <Pressable 
            style={styles.touchArea}
            onPress={handleExpand}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 15 }}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.switch_organization')}
            accessibilityHint={t('accessibility.switch_organization_hint')}
          />
        </Animated.View>
      )}

      {/* 展开状态：组织选择列表 */}
      {isExpanded && (
        <Animated.View style={[styles.expandedFan, expandedStyle]}>
          <ScrollView
            style={styles.orgScrollView}
            contentContainerStyle={styles.orgScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {organizations.map((org) => (
              <Pressable
                key={org.id}
                style={[
                  styles.orgItem,
                  { backgroundColor: org.brandColors.primary },
                  org.id === displayOrg.id && styles.orgItemSelected
                ]}
                onPress={() => handleOrganizationSelect(org)}
              >
                <Text style={styles.orgItemText}>
                  {org.name.includes('Columbia') || org.id.includes('columbia') ? 'CU' : 'CSSA'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: DESIGN.position.left,
    top: DESIGN.position.top,
    zIndex: 1000,
  },

  // 背景遮罩
  overlay: {
    position: 'absolute',
    top: -screenHeight,
    left: -200,
    width: screenWidth + 200,
    height: screenHeight * 2,
    zIndex: 1,
  },

  // 折叠状态容器
  collapsedContainer: {
    position: 'relative',
    zIndex: 2,
  },

  // 可见的弧形边缘 - 优化用户体验
  collapsedEdge: {
    width: DESIGN.collapsed.width,
    height: DESIGN.collapsed.height,
    backgroundColor: DESIGN.colors.collapsedBackground,
    borderRightWidth: 2,
    borderRightColor: DESIGN.colors.collapsedBorder,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // 微妙阴影增强视觉层级
    shadowColor: 'rgba(255, 107, 53, 0.2)',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },

  // 交互提示指示器
  interactionHints: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  indicatorDot: {
    width: DESIGN.collapsed.indicatorSize,
    height: DESIGN.collapsed.indicatorSize,
    borderRadius: DESIGN.collapsed.indicatorSize / 2,
    backgroundColor: 'rgba(255, 107, 53, 0.9)', // 更明显的橙色点
    marginVertical: 12, // 增加间距
  },

  // 扩大的触摸热区
  touchArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: DESIGN.collapsed.touchWidth,
    height: DESIGN.collapsed.height,
    backgroundColor: 'transparent',
    zIndex: 3,
  },


  // 展开状态：扇形列表
  expandedFan: {
    width: DESIGN.expanded.width, // 展开时变宽
    height: DESIGN.expanded.height,
    backgroundColor: DESIGN.colors.expandedBackground,
    borderTopRightRadius: 80,
    borderBottomRightRadius: 80,
    zIndex: 3,
    // 阴影
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },

  orgScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  orgScrollContent: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  orgItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    // 按钮阴影
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },

  orgItemSelected: {
    borderWidth: 3,
    borderColor: '#FF6B35',
    transform: [{ scale: 1.1 }],
  },

  orgItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default OrganizationSwitcher;