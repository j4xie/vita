import React, { useState, useRef, useEffect } from 'react';
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
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (searchMode === 'default') {
      // 第一次点击：参考图效果 - Tab区域缩小，搜索框展开
      setSearchMode('expanded');
      
      // 动画序列1：左侧Tab区域缩小为圆形
      leftAreaWidth.value = withTiming(60, { 
        duration: 350, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
      });
      
      // 动画序列2：4个Tab淡出，圆形按钮淡入
      individualTabsOpacity.value = withTiming(0, { duration: 200 });
      compactButtonOpacity.value = withDelay(150, withSpring(1, { 
        damping: 20, 
        stiffness: 300 
      }));
      
      // 动画序列3：搜索区域从右向左展开
      searchAreaWidth.value = withDelay(200, withTiming(screenWidth - 144, { 
        duration: 300, 
        easing: Easing.bezier(0.4, 0, 0.2, 1) 
      }));
      
      // 动画序列4：搜索框内容显示
      searchInputOpacity.value = withDelay(400, withTiming(1, { duration: 150 }));
      
    } else if (searchMode === 'expanded') {
      // 第二次点击：进入输入模式
      setSearchMode('input');
      
      // 显示取消按钮
      cancelButtonOpacity.value = withTiming(1, { duration: 200 });
      
      // 聚焦搜索框
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  const handleCancel = () => {
    console.log('❌ 取消搜索');
    setSearchMode('default');
    setSearchText('');
    Keyboard.dismiss();
    
    // 逆向动画恢复
    cancelButtonOpacity.value = withTiming(0, { duration: 150 });
    searchInputOpacity.value = withTiming(0, { duration: 200 });
    
    searchAreaWidth.value = withTiming(0, { 
      duration: 300, 
      easing: Easing.bezier(0.4, 0, 0.6, 1) 
    });
    
    compactButtonOpacity.value = withTiming(0, { duration: 200 });
    
    leftAreaWidth.value = withDelay(100, withTiming(screenWidth - 88, { 
      duration: 350, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    
    individualTabsOpacity.value = withDelay(250, withTiming(1, { duration: 200 }));
  };

  const handleTabPress = (route: any, isFocused: boolean) => {
    if (searchMode !== 'default') {
      handleCancel();
      return;
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

  return (
    <Animated.View style={[
      styles.container, 
      { bottom: insets.bottom - 7 }
    ]}>
      {/* 统一胶囊背景容器 */}
      <View style={styles.unifiedCapsule}>
        {/* 背景模糊效果 */}
        <BlurView
          intensity={80}
          tint="light"
          style={styles.blurBackground}
        />
        
        {/* 左侧区域：Tab或圆形按钮 */}
        <Animated.View style={[styles.leftArea, leftAreaAnimatedStyle]}>
          {/* 默认模式：4个Tab */}
          <Animated.View style={[styles.individualTabs, individualTabsAnimatedStyle]}>
            {tabs.map((tab, index) => {
              const route = state.routes.find(r => r.name === tab.key);
              if (!route) return null;
              
              const isFocused = state.index === state.routes.indexOf(route);
              
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  onPress={() => handleTabPress(route, isFocused)}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={isFocused ? tab.iconFocused as any : tab.icon as any}
                    size={20}
                    color={isFocused ? '#007AFF' : '#333333'}
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isFocused ? '#007AFF' : '#333333' }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
          
          {/* 紧凑模式：1个圆形按钮 */}
          <Animated.View style={[styles.compactButton, compactButtonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.compactTouch}
              onPress={handleCancel}
              activeOpacity={0.6}
            >
              <Ionicons
                name="apps"
                size={22}
                color="#007AFF"
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* 中间搜索区域 */}
        <Animated.View style={[styles.searchArea, searchAreaAnimatedStyle]}>
          <Animated.View style={[styles.searchContent, searchInputAnimatedStyle]}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder={t('common.search_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </Animated.View>
        </Animated.View>

        {/* 右侧按钮区域 */}
        <View style={styles.rightArea}>
          {/* 默认和展开模式：搜索按钮 */}
          {(searchMode === 'default' || searchMode === 'expanded') && (
            <TouchableOpacity
              style={styles.rightButton}
              onPress={handleSearchPress}
              activeOpacity={0.6}
            >
              <Ionicons
                name="search"
                size={22}
                color="#007AFF"
              />
            </TouchableOpacity>
          )}

          {/* 输入模式：取消按钮 */}
          {searchMode === 'input' && (
            <Animated.View style={cancelButtonAnimatedStyle}>
              <TouchableOpacity
                style={styles.rightButton}
                onPress={handleCancel}
                activeOpacity={0.6}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#007AFF"
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
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
  },
  
  // 统一胶囊背景 - 精确匹配参考图
  unifiedCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)', // 更高透明度，更接近参考图
    borderRadius: 33,
    paddingHorizontal: 8, // 添加内边距
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 }, // 增强阴影
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 0.5, // 添加微妙边框
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 33,
  },
  
  // 左侧区域（Tab或圆形按钮）
  leftArea: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 4个独立Tab容器
  individualTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 4,
  },
  
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 3,
    minWidth: 50, // 确保最小宽度
  },
  
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  
  // 紧凑模式圆形按钮
  compactButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  compactTouch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 中间搜索区域
  searchArea: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 12,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
    height: 40,
  },
  
  // 右侧按钮区域
  rightArea: {
    width: 56,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  rightButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});