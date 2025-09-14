import React, { useState, useCallback, useRef } from 'react';
import { Image, ImageStyle, StyleProp, Platform } from 'react-native';

interface UltraFastImageProps {
  uri?: string;
  source?: { uri: string }; // 兼容旧API
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  onLoad?: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  // 新增压缩参数
  compressHeight?: number; // 目标压缩高度
  quality?: number; // 压缩质量 0-1
}

// Web端图片压缩函数
const compressImage = (
  imageUrl: string, 
  targetHeight: number = 240, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') {
      // 非Web端直接返回原图
      resolve(imageUrl);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // 计算压缩后的尺寸，保持宽高比
      const aspectRatio = img.width / img.height;
      const targetWidth = targetHeight * aspectRatio;
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // 转换为base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      // 压缩失败，返回原图
      resolve(imageUrl);
    };
    
    img.src = imageUrl;
  });
};

export const UltraFastImage: React.FC<UltraFastImageProps> = ({
  uri,
  source,
  style,
  resizeMode = 'cover',
  onLoad,
  onError,
  onLoadStart,
  compressHeight,
  quality = 0.8,
}) => {
  // 统一处理uri参数
  const imageUri = uri || source?.uri;
  const [compressedUri, setCompressedUri] = useState<string | undefined>(imageUri);
  const [isCompressing, setIsCompressing] = useState(false);
  const compressionRef = useRef<boolean>(false);

  // 处理图片压缩
  const handleImageCompression = useCallback(async () => {
    if (!imageUri || !compressHeight || compressionRef.current || Platform.OS !== 'web') {
      return;
    }

    compressionRef.current = true;
    setIsCompressing(true);
    
    console.log('开始压缩图片:', imageUri, '目标高度:', compressHeight);

    try {
      const compressed = await compressImage(imageUri, compressHeight, quality);
      console.log('图片压缩完成');
      setCompressedUri(compressed);
    } catch (error) {
      console.warn('图片压缩失败，使用原图:', error);
      setCompressedUri(imageUri);
    } finally {
      setIsCompressing(false);
    }
  }, [imageUri, compressHeight, quality]);

  // 组件加载时开始压缩
  React.useEffect(() => {
    if (compressHeight && Platform.OS === 'web' && imageUri) {
      handleImageCompression();
    }
  }, [handleImageCompression, compressHeight, imageUri]);

  if (!imageUri) {
    return null;
  }

  // 如果正在压缩且是Web端，显示原图作为占位
  const finalUri = (Platform.OS === 'web' && compressHeight) ? compressedUri : imageUri;

  return (
    <Image
      source={{ uri: finalUri }}
      style={[
        style,
        Platform.OS === 'web' && {
          objectFit: 'contain', // Web端强制使用contain
        }
      ]}
      resizeMode={resizeMode}
      onLoadStart={onLoadStart}
      onLoad={onLoad}
      onError={onError}
    />
  );
};