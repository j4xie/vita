import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Glass } from './GlassTheme';

interface GlassSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
}

export const GlassSearchBar: React.FC<GlassSearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onFocus,
  onBlur,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusIntensity = useSharedValue(0);
  
  const handleFocus = () => {
    setIsFocused(true);
    // 聚焦时亮度+0.03
    focusIntensity.value = withTiming(1, { duration: Glass.animation.opacityTransition });
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusIntensity.value = withTiming(0, { duration: Glass.animation.opacityTransition });
    onBlur?.();
  };

  // 聚焦时的亮度增强样式
  const focusAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${0.18 + 0.03 * focusIntensity.value})`,
  }));

  return (
    <View style={styles.container}>
      <BlurView intensity={Glass.blur} tint="light" style={styles.blurContainer}>
        {/* 顶部1px高光分隔线 */}
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

        {/* 聚焦时的额外亮度层 */}
        <Animated.View style={[styles.focusOverlay, focusAnimatedStyle]} />

        {/* 内容区 */}
        <View style={styles.content}>
          {/* 搜索图标 */}
          <Ionicons
            name="search"
            size={18}
            color={isFocused ? Glass.textMain : Glass.textWeak}
            style={styles.searchIcon}
          />
          
          {/* 输入框 */}
          <TextInput
            style={[
              styles.textInput,
              { color: Glass.textMain }
            ]}
            placeholder={placeholder}
            placeholderTextColor={`rgba(17,17,17,${isFocused ? 0.25 : 0.45})`}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            returnKeyType="search"
            enablesReturnKeyAutomatically
            clearButtonMode="while-editing"
          />
          
          {/* 清除按钮 (Android) */}
          {Platform.OS === 'android' && value.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => onChangeText('')}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={Glass.textWeak}
              />
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48, // 搜索框高度48pt
    borderRadius: 14, // 圆角14pt
    overflow: 'hidden',
  },
  
  blurContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
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
    borderRadius: 14,
  },

  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },

  searchIcon: {
    marginRight: 8,
    width: 18, // 固定宽度确保对齐
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 0, // 移除默认padding
    height: 32, // 输入区高度32pt
  },

  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default GlassSearchBar;