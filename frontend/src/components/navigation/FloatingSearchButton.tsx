import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Glass } from '../../ui/glass/GlassTheme';

interface FloatingSearchButtonProps {
  bottom?: number; // 自定义bottom位置（默认为TabBar上方）
}

/**
 * FloatingSearchButton - 浮动搜索按钮
 *
 * 位于TabBar上方右侧，只在Explore tab显示
 * 点击后水平展开成搜索框
 */
export const FloatingSearchButton: React.FC<FloatingSearchButtonProps> = ({ bottom }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef<TextInput>(null);

  // 计算展开后的宽度（屏幕宽度 - 左右边距）
  const screenWidth = Dimensions.get('window').width;
  const expandedWidth = screenWidth - 32; // 左右各留16px边距

  // 状态
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 动画值
  const buttonWidth = useSharedValue(44); // 初始宽度44（圆形按钮）
  const inputOpacity = useSharedValue(0); // 输入框透明度
  const iconOpacity = useSharedValue(1); // 搜索图标透明度

  // 监听键盘事件
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // 展开搜索框
  const handleExpand = useCallback(() => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }

    setIsExpanded(true);

    // 动画：宽度展开到接近屏幕宽度，图标淡出，输入框淡入
    buttonWidth.value = withTiming(expandedWidth, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    iconOpacity.value = withTiming(0, { duration: 150 });
    inputOpacity.value = withDelay(150, withTiming(1, { duration: 150 }));

    // 延迟聚焦，等待动画完成
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 350);
  }, []);

  // 收起搜索框
  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    setSearchText('');
    Keyboard.dismiss();

    // 清空搜索
    DeviceEventEmitter.emit('searchTextChanged', {
      searchText: '',
      timestamp: Date.now(),
    });

    // 动画：输入框淡出，图标淡入，宽度收起
    inputOpacity.value = withTiming(0, { duration: 150 });
    iconOpacity.value = withDelay(100, withTiming(1, { duration: 150 }));
    buttonWidth.value = withDelay(100, withTiming(44, {
      duration: 250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));
  }, []);

  // 清空搜索内容（保持展开）
  const handleClear = useCallback(() => {
    setSearchText('');
    DeviceEventEmitter.emit('searchTextChanged', {
      searchText: '',
      timestamp: Date.now(),
    });
  }, []);

  // 搜索文本变化
  const handleTextChange = useCallback((text: string) => {
    setSearchText(text);
    DeviceEventEmitter.emit('searchTextChanged', {
      searchText: text.trim(),
      timestamp: Date.now(),
    });
  }, []);

  // 动画样式
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    width: buttonWidth.value,
  }));

  const searchIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  const inputContainerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
  }));

  // 计算bottom位置：优先使用传入的值，否则使用默认的TabBar上方位置
  // 加上键盘高度实现键盘避让
  const baseBottom = bottom !== undefined ? bottom : insets.bottom + 78;
  const bottomPosition = baseBottom + keyboardHeight;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomPosition },
        containerAnimatedStyle,
      ]}
    >
      {/* 收起状态：圆形搜索按钮 */}
      {!isExpanded && (
        <TouchableOpacity
          style={styles.circleButton}
          onPress={handleExpand}
          activeOpacity={0.7}
        >
          <Animated.View style={searchIconAnimatedStyle}>
            <Ionicons name="search" size={22} color="#007AFF" />
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* 展开状态：搜索框 */}
      {isExpanded && (
        <Animated.View style={[styles.expandedContainer, inputContainerAnimatedStyle]}>
          <Ionicons name="search" size={18} color="#666666" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.input}
            placeholder={t('common.search_placeholder', '搜索活动...')}
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={handleTextChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Ionicons name="close-circle" size={18} color="#999999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={handleCollapse}>
            <Ionicons name="close" size={20} color="#666666" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },

  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },

  searchIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    height: 44,
  },

  clearButton: {
    marginLeft: 4,
    marginRight: 8,
    padding: 4,
  },

  closeButton: {
    padding: 4,
  },
});
