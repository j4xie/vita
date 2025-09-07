import React from 'react';
import { View, StyleSheet, Image, Platform, ImageProps } from 'react-native';

// Web-compatible image props
interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: {
    uri?: string;
    priority?: 'low' | 'normal' | 'high';
  };
  fallbackColor?: string;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

/**
 * 🚀 优化的图片组件
 * Web平台使用标准Image，原生平台使用react-native-fast-image
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  fallbackColor = '#F3F4F6',
  borderRadius = 0,
  resizeMode = 'cover',
  ...props
}) => {
  if (Platform.OS === 'web') {
    // Web版本使用标准Image组件
    return (
      <View style={[
        styles.container, 
        style, 
        { backgroundColor: fallbackColor, borderRadius }
      ]}>
        <Image
          {...props}
          source={{ uri: source.uri || '' }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  // 原生平台使用FastImage
  try {
    const FastImage = require('react-native-fast-image');
    const fastImageSource = {
      uri: source.uri || '',
      priority: source.priority === 'high' ? FastImage.priority.high :
                source.priority === 'low' ? FastImage.priority.low :
                FastImage.priority.normal,
    };

    const fastResizeMode = resizeMode === 'cover' ? FastImage.resizeMode.cover :
                          resizeMode === 'contain' ? FastImage.resizeMode.contain :
                          resizeMode === 'stretch' ? FastImage.resizeMode.stretch :
                          resizeMode === 'center' ? FastImage.resizeMode.center :
                          FastImage.resizeMode.cover;

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
          resizeMode={fastResizeMode}
        />
      </View>
    );
  } catch (error) {
    // 降级到标准Image
    return (
      <View style={[
        styles.container, 
        style, 
        { backgroundColor: fallbackColor, borderRadius }
      ]}>
        <Image
          {...props}
          source={{ uri: source.uri || '' }}
          style={[StyleSheet.absoluteFill, { borderRadius }]}
          resizeMode={resizeMode}
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});