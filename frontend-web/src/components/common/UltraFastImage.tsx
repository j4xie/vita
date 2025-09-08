import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface UltraFastImageProps {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
}

/**
 * 🚀 极速图片组件 - 零延迟、无动画、无预加载
 * 直接使用原生Image组件，保证最快的加载速度
 */
export const UltraFastImage: React.FC<UltraFastImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  onLoad,
  onError,
  onLoadStart,
}) => {
  if (!uri) {
    return null;
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onLoadStart={onLoadStart}
      onLoad={onLoad}
      onError={onError}
      // Web优化：启用浏览器原生缓存
      {...({
        loading: 'eager', // 立即加载，不等待
        decoding: 'sync', // 同步解码
        fetchpriority: 'high', // 高优先级获取
      } as any)}
    />
  );
};