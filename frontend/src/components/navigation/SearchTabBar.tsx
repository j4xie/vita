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
import { LinearGradient } from 'expo-linear-gradient';
import { SearchIcon } from '../common/icons/SearchIcon';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface SearchTabBarProps extends BottomTabBarProps {
  // 额外的搜索相关属性
}

export const SearchTabBar: React.FC<SearchTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchMode, setSearchMode] = useState<'default' | 'expanded' | 'input'>('default');
  const [searchText, setSearchText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchInputRef = useRef<TextInput>(null);

  // 键盘事件监听
  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    };
    
    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };
    
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );
    
    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  // 关键动画值 - 精调版本
  const capsuleWidth = useSharedValue(screenWidth - 32); // 胶囊总宽度
  const tabAreaWidth = useSharedValue(screenWidth - 88); // Tab区域宽度（预留搜索按钮空间）
  const searchAreaWidth = useSharedValue(0); // 搜索区域宽度
  const tabsOpacity = useSharedValue(1); // Tab透明度
  const searchInputOpacity = useSharedValue(0); // 搜索输入框透明度
  const cancelButtonOpacity = useSharedValue(0); // 取消按钮透明度
  const compactModeScale = useSharedValue(0); // 紧凑模式缩放（4个Tab合并为1个圆形）
  
  // 额外的精调动画值
  const capsuleElevation = useSharedValue(8); // 胶囊阴影高度
  const searchFocusScale = useSharedValue(1); // 搜索聚焦时的微妙缩放

  // Tab配置
  const tabs = [
    { key: 'Explore', label: t('navigation.tabs.explore'), icon: 'compass', iconFocused: 'compass' },
    { key: 'Community', label: t('navigation.tabs.community'), icon: 'people-outline', iconFocused: 'people' },
    { key: 'Wellbeing', label: t('navigation.tabs.wellbeing'), icon: 'shield-outline', iconFocused: 'shield' },
    { key: 'Profile', label: t('navigation.tabs.profile'), icon: 'person-outline', iconFocused: 'person' },
  ];

  const handleSearchPress = () => {
    console.log('🔍 搜索按钮点击，当前模式:', searchMode);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (searchMode === 'default') {
      // 第一次点击：精确的轨迹跟随变形动画
      console.log('🎬 开始搜索展开动画');
      setSearchMode('expanded');
      
      // 阶段1 (0-150ms)：Tab开始缩小
      tabAreaWidth.value = withTiming(60, { 
        duration: 350, 
        easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
      });
      
      // 阶段2 (50-200ms)：4个Tab淡出
      tabsOpacity.value = withDelay(50, withTiming(0, { 
        duration: 150,
        easing: Easing.out(Easing.quad) 
      }));
      
      // 阶段3 (150-250ms)：紧凑模式圆形按钮出现
      compactModeScale.value = withDelay(150, withSpring(1, { 
        damping: 22, 
        stiffness: 350,
        mass: 0.7
      }));
      
      // 阶段4 (200-450ms)：搜索框从右侧精确展开
      searchAreaWidth.value = withDelay(200, withTiming(screenWidth - 160, { 
        duration: 250, 
        easing: Easing.bezier(0.4, 0, 0.2, 1) 
      }));
      
      // 阶段5 (350-450ms)：搜索框内容淡入
      searchInputOpacity.value = withDelay(350, withTiming(1, { 
        duration: 100,
        easing: Easing.out(Easing.cubic)
      }));
      
    } else if (searchMode === 'expanded') {
      // 第二次点击：进入键盘输入模式，优化交互体验
      setSearchMode('input');
      
      // 显示取消按钮，使用更自然的动画
      cancelButtonOpacity.value = withSpring(1, { 
        damping: 20, 
        stiffness: 300 
      });
      
      // 搜索聚焦时的微妙视觉反馈
      searchFocusScale.value = withSpring(1.02, { damping: 25, stiffness: 400 });
      capsuleElevation.value = withTiming(12, { duration: 200 });
      
      // 更快地聚焦搜索框，减少等待感
      setTimeout(() => {
        searchInputRef.current?.focus();
        
        // 触觉反馈确认进入输入模式
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, 50);
    }
  };

  const handleCancel = () => {
    console.log('❌ 取消搜索，当前模式:', searchMode);
    setSearchMode('default');
    setSearchText('');
    Keyboard.dismiss();
    
    // 精确的逆向恢复动画 - 按照展开的反向顺序
    
    // 阶段1 (0-100ms)：取消按钮和搜索内容消失
    cancelButtonOpacity.value = withTiming(0, { duration: 100 });
    searchInputOpacity.value = withTiming(0, { duration: 150 });
    
    // 阶段2 (50-300ms)：搜索区域收缩回右侧
    searchAreaWidth.value = withDelay(50, withTiming(0, { 
      duration: 250, 
      easing: Easing.bezier(0.6, 0, 0.4, 1) 
    }));
    
    // 阶段3 (150-250ms)：紧凑模式圆形按钮消失
    compactModeScale.value = withDelay(150, withTiming(0, { 
      duration: 100,
      easing: Easing.in(Easing.quad)
    }));
    
    // 阶段4 (200-500ms)：Tab区域恢复原始宽度
    tabAreaWidth.value = withDelay(200, withTiming(screenWidth - 88, { 
      duration: 300, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    
    // 阶段5 (350-500ms)：4个Tab重新显示
    tabsOpacity.value = withDelay(350, withTiming(1, { 
      duration: 150,
      easing: Easing.out(Easing.quad)
    }));
    
    // 阶段6：重置搜索聚焦效果
    searchFocusScale.value = withDelay(400, withSpring(1, { damping: 25, stiffness: 400 }));
    capsuleElevation.value = withDelay(400, withTiming(8, { duration: 200 }));
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

  // 重新设计的动画样式
  const tabAreaAnimatedStyle = useAnimatedStyle(() => ({
    width: tabAreaWidth.value,
    opacity: tabsOpacity.value,
  }));

  const searchAreaAnimatedStyle = useAnimatedStyle(() => ({
    width: searchAreaWidth.value,
  }));

  const searchInputAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchInputOpacity.value,
  }));

  const cancelButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cancelButtonOpacity.value,
  }));

  const compactModeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: compactModeScale.value }],
    opacity: compactModeScale.value,
  }));

  // 胶囊容器动画样式（支持键盘交互）
  const capsuleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchFocusScale.value }],
    shadowOpacity: capsuleElevation.value / 50, // 动态阴影
  }));

  return (
    <Animated.View style={[
      styles.container, 
      { bottom: insets.bottom - 7 }
    ]}>
      {/* 一体化胶囊容器 */}
      <Animated.View style={[styles.capsuleContainer, capsuleAnimatedStyle]}>
        {/* 背景模糊层 */}
        <BlurView
          intensity={80}
          tint="light"
          style={styles.blurBackground}
        />
        
        {/* Tab区域 */}
        <Animated.View style={[styles.tabArea, tabAreaAnimatedStyle]}>
          {/* 默认模式：4个Tab */}
          <Animated.View style={[styles.tabsContainer, { opacity: tabsOpacity.value }]}>
            {tabs.map((tab, index) => {
              const route = state.routes.find(r => r.name === tab.key);
              if (!route) return null;
              
              const isFocused = state.index === state.routes.indexOf(route);
              
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  onPress={() => handleTabPress(route, isFocused)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isFocused ? tab.iconFocused as any : tab.icon as any}
                    size={20}
                    color={isFocused ? '#007AFF' : '#000000'}
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isFocused ? '#007AFF' : '#000000' }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
          
          {/* 紧凑模式：1个圆形按钮 */}
          <Animated.View style={[styles.compactMode, compactModeAnimatedStyle]}>
            <TouchableOpacity
              style={styles.compactButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Ionicons
                name="apps"
                size={22}
                color="#007AFF"
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* 搜索区域 */}
        <Animated.View style={[styles.searchArea, searchAreaAnimatedStyle]}>
          <Animated.View style={[styles.searchInputContainer, searchInputAnimatedStyle]}>
            <SearchIcon size={18} color="#9CA3AF" />
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
            {/* 搜索框内的取消按钮 */}
            {searchMode !== 'default' && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>

        {/* 右侧按钮区域 */}
        <View style={styles.rightButtonArea}>
          {/* 搜索按钮 */}
          {searchMode === 'default' && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchPress}
              activeOpacity={0.8}
            >
              <SearchIcon
                size={22}
                color="#007AFF"
              />
            </TouchableOpacity>
          )}

          {/* 取消按钮 */}
          {(searchMode === 'expanded' || searchMode === 'input') && (
            <Animated.View style={cancelButtonAnimatedStyle}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButtonTouch}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Animated.View>
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
  
  // 一体化胶囊容器
  capsuleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 33,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 33,
  },
  
  // Tab区域（左侧）
  tabArea: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // 紧凑模式圆形按钮
  compactMode: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 搜索区域（中间）
  searchArea: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    height: 40,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
    height: 40,
  },
  
  // 右侧按钮区域
  rightButtonArea: {
    width: 60,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 8,
  },
  
  searchButton: {
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
  
  cancelButtonTouch: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },

  // 搜索框内的清除按钮
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});