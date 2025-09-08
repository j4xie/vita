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
    />
  );
};