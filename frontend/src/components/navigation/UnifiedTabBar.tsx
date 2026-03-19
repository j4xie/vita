import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SearchIcon } from '../common/icons/SearchIcon';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';

const { width: screenWidth } = Dimensions.get('window');

type SearchMode = 'default' | 'expanded' | 'input';

interface UnifiedTabBarProps extends BottomTabBarProps {}

export const UnifiedTabBar: React.FC<UnifiedTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchMode, setSearchMode] = useState<SearchMode>('default');
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // 核心动画值
  const capsuleWidth = useSharedValue(screenWidth - 32);
  const leftAreaWidth = useSharedValue(screenWidth - 88); // Tab区域宽度
  const searchAreaWidth = useSharedValue(0); // 搜索区域宽度
  const rightButtonWidth = useSharedValue(56); // 右侧按钮区域宽度

  // Tab状态动画值
  const individualTabsOpacity = useSharedValue(1); // 4个独立Tab的透明度
  const compactButtonOpacity = useSharedValue(0); // 紧凑圆形按钮透明度
  
  // 搜索相关动画值
  const searchInputOpacity = useSharedValue(0);
  const cancelButtonOpacity = useSharedValue(0);
  
  // 高光扫过动画值
  const highlightSweepX = useSharedValue(-100);
  const highlightOpacity = useSharedValue(0);

  // Tab配置 - 使用i18n翻译
  const tabs = [
    { key: 'Explore', label: t('navigation.tabs.explore'), icon: 'compass-outline', iconFocused: 'compass' },
    { key: 'Community', label: t('navigation.tabs.community'), icon: 'people-outline', iconFocused: 'people' },
    { key: 'Wellbeing', label: t('navigation.tabs.wellbeing'), icon: 'shield-outline', iconFocused: 'shield' },
    { key: 'Profile', label: t('navigation.tabs.profile'), icon: 'person-outline', iconFocused: 'person' },
  ];

  const handleSearchPress = () => {
    console.log('🔍 搜索点击，当前模式:', searchMode);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (searchMode === 'default') {
      // 展开搜索框
      setSearchMode('expanded');
      
      // 动画序列1：4个Tab淡出
      individualTabsOpacity.value = withTiming(0, { duration: 200 });
      
      // 动画序列2：圆形按钮出现  
      compactButtonOpacity.value = withDelay(150, withSpring(1, { 
        damping: Glass.animation.springConfig.damping, 
        stiffness: Glass.animation.springConfig.stiffness
      }));
      
      // 动画序列3：搜索覆盖层展开
      searchAreaWidth.value = withDelay(200, withTiming(screenWidth - 116, { 
        duration: 300, 
        easing: Easing.bezier(0.4, 0, 0.2, 1) 
      }));
      
      // 动画序列4：搜索框内容显示
      searchInputOpacity.value = withDelay(400, withTiming(1, { duration: 200 }));
      
    } else if (searchMode === 'expanded') {
      // 进入输入模式
      setSearchMode('input');
      
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleCancel = () => {
    console.log('❌ 取消搜索');
    setSearchMode('default');
    setSearchText('');
    Keyboard.dismiss();
    
    // 逆向恢复动画
    searchInputOpacity.value = withTiming(0, { duration: Glass.animation.opacityTransition });
    
    searchAreaWidth.value = withTiming(0, { 
      duration: 250, 
      easing: Easing.bezier(0.4, 0, 0.6, 1) 
    });
    
    compactButtonOpacity.value = withTiming(0, { duration: 200 });
    
    individualTabsOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
  };

  // 高光扫过动画触发
  const triggerHighlightSweep = useCallback(() => {
    highlightSweepX.value = -100;
    highlightOpacity.value = 0;
    
    // 扫光从左至右，时长 250ms
    highlightSweepX.value = withTiming(400, {
      duration: Glass.animation.sweepDuration,
      easing: Easing.out(Easing.quad),
    });
    
    highlightOpacity.value = withSequence(
      withTiming(0.08, { duration: 80 }), // 淡入
      withTiming(0.08, { duration: 90 }), // 保持
      withTiming(0, { duration: 80 }) // 淡出
    );
  }, []);

  const handleTabPress = (route: any, isFocused: boolean) => {
    if (searchMode !== 'default') {
      handleCancel();
      return;
    }

    // 触发高光扫过动画
    triggerHighlightSweep();

    // iOS Haptic反馈
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  // 动画样式
  const leftAreaAnimatedStyle = useAnimatedStyle(() => ({
    width: leftAreaWidth.value,
  }));

  const searchAreaAnimatedStyle = useAnimatedStyle(() => ({
    width: searchAreaWidth.value,
  }));

  const individualTabsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: individualTabsOpacity.value,
  }));

  const compactButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: compactButtonOpacity.value,
    transform: [{ scale: compactButtonOpacity.value }],
  }));

  const searchInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchInputOpacity.value,
  }));

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cancelButtonOpacity.value,
    transform: [{ scale: cancelButtonOpacity.value }],
  }));

  // 高光扫过动画样式
  const highlightSweepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightSweepX.value }],
    opacity: highlightOpacity.value,
  }));

  // 搜索覆盖层动画样式
  const searchOverlayAnimatedStyle = useAnimatedStyle(() => ({
    width: searchAreaWidth.value,
    opacity: searchInputOpacity.value,
  }));

  return (
    <Animated.View style={[
      styles.container, 
      { bottom: insets.bottom - 7 }
    ]}>
      {/* Liquid Glass 容器 */}
      <View style={styles.liquidGlassContainer}>
        {/* 背景模糊层 */}
        <BlurView
          intensity={Platform.OS === 'android' ? 22 : Glass.blur}
          style={styles.blurBackground}
          tint="light"
        />
        
        {/* 顶部高光分隔线 */}
        <LinearGradient 
          colors={[Glass.hairlineFrom, Glass.hairlineTo]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }} 
          style={styles.hairline}
        />
        
        {/* 白系叠色渐变 */}
        <LinearGradient 
          colors={[Glass.overlayTop, Glass.overlayBottom]}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }}
          style={styles.overlay}
        />
        
        {/* 高光扫过效果 */}
        <Animated.View style={[styles.sweepHighlight, highlightSweepAnimatedStyle]} pointerEvents="none">
          <LinearGradient
            colors={[
              'transparent',
              'rgba(255,255,255,0.08)',
              'rgba(255,255,255,0.04)',
              'transparent'
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sweepGradient}
          />
        </Animated.View>
        
        {/* Tab容器 */}
        <View style={styles.tabBarContainer}>
          {/* 默认模式：4个Tab */}
          <Animated.View style={[styles.normalTabsContainer, individualTabsAnimatedStyle]}>
            {tabs.map((tab, index) => {
              const route = state.routes.find(r => r.name === tab.key);
              if (!route) return null;
              
              const isFocused = state.index === state.routes.indexOf(route);
              
              return (
                <View key={tab.key} style={styles.tabContainer}>
                  <TouchableOpacity
                    style={styles.tabTouchable}
                    onPress={() => handleTabPress(route, isFocused)}
                    activeOpacity={0.7}
                    accessibilityRole="tab"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    accessibilityLabel={`${tab.label}${isFocused ? ', selected' : ''}`}
                  >
                    <View style={styles.tabContent}>
                      {/* 图标容器 */}
                      <View style={styles.iconContainer}>
                        <Ionicons
                          name={isFocused ? tab.iconFocused as any : tab.icon as any}
                          size={isFocused ? 24 : 22}
                          color={isFocused ? Glass.system.iosBlue : Glass.textMain}
                          style={styles.tabIcon}
                        />
                      </View>
                      
                      {/* 文字标签 */}
                      <Text
                        style={[
                          styles.tabLabel,
                          { 
                            color: isFocused ? Glass.system.iosBlue : Glass.textMain,
                            opacity: isFocused ? 1.0 : 0.7,
                            fontWeight: isFocused ? '600' : '500',
                          }
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.7}
                        allowFontScaling={true}
                      >
                        {tab.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </Animated.View>
          
          {/* 紧凑模式：圆形按钮 */}
          <Animated.View style={[styles.compactButton, compactButtonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.compactButtonTouch}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid"
                size={18}
                color={Glass.textMain}
              />
            </TouchableOpacity>
          </Animated.View>
          
          {/* 搜索按钮 - 默认状态显示 */}
          {searchMode === 'default' && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <View style={styles.searchButtonContent}>
                <SearchIcon
                  size={22}
                  color={Glass.system.iosBlue}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* 取消按钮 - 输入状态显示 */}
          {searchMode === 'input' && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <View style={styles.searchButtonContent}>
                <Ionicons
                  name="close"
                  size={22}
                  color={Glass.system.iosBlue}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 搜索覆盖层 - 独立层级 */}
        <Animated.View style={[
          styles.searchOverlay,
          searchOverlayAnimatedStyle
        ]}>
          <View style={styles.searchOverlayContent}>
            <SearchIcon size={18} color="#666666" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchOverlayInput}
              placeholder={t('common.search_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchOverlayClear}
              onPress={handleCancel}
            >
              <Ionicons name="close" size={18} color="#666666" />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {/* 边框层 */}
        <View style={styles.borderLayer} pointerEvents="none" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 66,
    zIndex: 999,
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  liquidGlassContainer: {
    flex: 1,
    borderRadius: Glass.radius.tabbar,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },

  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Glass.radius.tabbar,
  },

  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Glass.radius.tabbar,
  },

  sweepHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    borderRadius: Glass.radius.tabbar,
  },

  sweepGradient: {
    flex: 1,
    borderRadius: Glass.radius.tabbar,
  },

  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 8,
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },

  // 默认Tab容器
  normalTabsContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: 16,
  },

  // 紧凑圆形按钮
  compactButton: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  compactButtonTouch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // 图标容器
  iconContainer: {
    marginBottom: 6, // 图标和文字间距
  },

  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 12,
    minHeight: Glass.touch.minSize,
    minWidth: Glass.touch.minSize,
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    paddingVertical: 6,
  },

  tabIcon: {
    // 图标样式，动态设置
  },

  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 13,
  },

  borderLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Glass.radius.tabbar,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'transparent',
  },

  // 搜索按钮样式
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  searchButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 搜索覆盖层样式
  searchOverlay: {
    position: 'absolute',
    left: 62,
    right: 54,
    top: 11,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  searchOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },

  searchOverlayInput: {
    flex: 1,
    fontSize: 16,
    color: Glass.textMain,
    marginLeft: 8,
    marginRight: 8,
  },

  searchOverlayClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});