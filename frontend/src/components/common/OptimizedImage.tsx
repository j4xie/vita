import React from 'react';
import { View, StyleSheet, Image, Platform, ImageResizeMode } from 'react-native';
import FastImage from 'react-native-fast-image';

interface OptimizedImageProps {
  source: {
    uri?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  style?: any;
  fallbackColor?: string;
  borderRadius?: number;
  resizeMode?: ImageResizeMode;
  onLoad?: () => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

/**
 * 🚀 优化的图片组件
 * 移动端优化图片组件，使用react-native-fast-image
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  fallbackColor = '#F3F4F6',
  borderRadius = 0,
  resizeMode = 'cover',
  onLoad,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}) => {
  // 移动端使用FastImage
  const fastImageSource = {
    uri: source.uri || '',
    priority: source.priority === 'high' ? FastImage.priority.high : 
             source.priority === 'low' ? FastImage.priority.low : 
             FastImage.priority.normal,
  };

  return (
    <View style={[
      styles.container, 
      style, 
      { backgroundColor: fallbackColor, borderRadius }
    ]}>
      <FastImage
        {...props}
        source={fastImageSource}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        resizeMode={FastImage.resizeMode[resizeMode] || FastImage.resizeMode.cover}
        onLoad={onLoad}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});