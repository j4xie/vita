import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Animated, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 🚀 简单的图片缓存管理器
class ImageCacheManager {
  private static cache = new Map<string, boolean>();
  private static preloadPromises = new Map<string, Promise<boolean>>();

  static isCached(uri: string): boolean {
    return this.cache.has(uri);
  }

  static setCached(uri: string): void {
    this.cache.set(uri, true);
  }

  static async preload(uri: string): Promise<boolean> {
    if (this.isCached(uri)) {
      return true;
    }

    // 避免重复预加载
    if (this.preloadPromises.has(uri)) {
      return this.preloadPromises.get(uri)!;
    }

    const promise = this._doPreload(uri);
    this.preloadPromises.set(uri, promise);
    
    try {
      const result = await promise;
      if (result) {
        this.setCached(uri);
      }
      return result;
    } finally {
      this.preloadPromises.delete(uri);
    }
  }

  private static _doPreload(uri: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        const img = new window.Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = uri;
      } else {
        Image.prefetch(uri)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }
    });
  }

  static clearCache(): void {
    this.cache.clear();
    this.preloadPromises.clear();
  }
}

interface EnhancedImageProps {
  uri?: string;
  style?: any;
  fallbackColor?: string;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  showLoadingIndicator?: boolean;
  showPlaceholder?: boolean;
  preload?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
}

/**
 * 🚀 增强的图片组件 - 支持预加载、平滑过渡、缓存优化
 * 解决闪屏问题的核心组件
 */
export const EnhancedImage: React.FC<EnhancedImageProps> = ({
  uri,
  style,
  fallbackColor = '#f5f5f5',
  borderRadius = 0,
  resizeMode = 'cover',
  showLoadingIndicator = true,
  showPlaceholder = true,
  preload = false,
  onLoad,
  onError,
  onLoadStart,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const placeholderFadeAnim = useRef(new Animated.Value(1)).current;

  // 🚀 预加载机制
  useEffect(() => {
    if (uri && preload && !isPreloaded) {
      preloadImage(uri);
    }
  }, [uri, preload]);

  // 🖼️ 图片预加载函数
  const preloadImage = async (imageUri: string) => {
    // 检查缓存
    if (ImageCacheManager.isCached(imageUri)) {
      console.log('🎯 图片已缓存:', imageUri);
      setIsPreloaded(true);
      return;
    }

    try {
      const success = await ImageCacheManager.preload(imageUri);
      if (success) {
        console.log('✅ 图片预加载成功:', imageUri);
        setIsPreloaded(true);
      } else {
        console.warn('⚠️ 图片预加载失败:', imageUri);
        setHasError(true);
      }
    } catch (error) {
      console.warn('⚠️ 图片预加载异常:', imageUri, error);
      setHasError(true);
    }
  };

  // 🎭 图片加载开始
  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  // ✅ 图片加载成功
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // 记录到缓存
    if (uri) {
      ImageCacheManager.setCached(uri);
    }
    
    // 🎨 平滑淡入动画（快速显示）
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 0, // 立即显示，无动画
        useNativeDriver: true,
      }),
      Animated.timing(placeholderFadeAnim, {
        toValue: 0,
        duration: 0, // 立即隐藏占位图
        useNativeDriver: true,
      }),
    ]).start();
    
    onLoad?.();
  };

  // ❌ 图片加载失败
  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    console.warn('⚠️ 图片加载失败:', uri, error.nativeEvent?.error);
    onError?.(error);
  };

  // 🎯 优化的渲染逻辑
  const renderContent = () => {
    if (!uri) {
      return renderPlaceholder();
    }

    return (
      <>
        {/* 🖼️ 主图片 */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <Image
            source={{ uri }}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
            resizeMode={resizeMode}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
          />
        </Animated.View>

        {/* 🎭 占位图/加载状态 */}
        {(isLoading || hasError) && (
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                opacity: placeholderFadeAnim,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: fallbackColor,
                borderRadius,
              }
            ]}
          >
            {renderPlaceholder()}
          </Animated.View>
        )}
      </>
    );
  };

  // 🎭 占位图渲染
  const renderPlaceholder = () => {
    if (hasError) {
      // ❌ 错误状态
      return (
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={32} color="#ccc" />
        </View>
      );
    }

    if (isLoading && showLoadingIndicator) {
      // 🔄 加载状态
      return (
        <View style={styles.placeholderContainer}>
          {showPlaceholder && (
            <Ionicons name="image-outline" size={32} color="#e5e5e5" style={styles.placeholderIcon} />
          )}
          <ActivityIndicator 
            size="small" 
            color="#999" 
            style={styles.loadingIndicator}
          />
        </View>
      );
    }

    if (showPlaceholder) {
      // 🎭 默认占位图
      return (
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={32} color="#ddd" />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[
      styles.container,
      style,
      { 
        backgroundColor: fallbackColor, 
        borderRadius,
        overflow: 'hidden'
      }
    ]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderIcon: {
    marginBottom: 8,
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
});