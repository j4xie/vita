import React from 'react';
import { View, StyleSheet } from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';

interface OptimizedImageProps extends Omit<FastImageProps, 'source'> {
  source: {
    uri?: string;
    priority?: FastImage.Priority;
  };
  fallbackColor?: string;
  borderRadius?: number;
}

/**
 * 🚀 优化的图片组件
 * 使用react-native-fast-image提供更好的性能和缓存
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  fallbackColor = '#F3F4F6',
  borderRadius = 0,
  resizeMode = FastImage.resizeMode.cover,
  ...props
}) => {
  const fastImageSource = {
    uri: source.uri || '',
    priority: source.priority || FastImage.priority.normal,
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
        resizeMode={resizeMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});