// Web兼容的BlurView组件
import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';

interface BlurViewProps {
  intensity?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export const WebBlurView: React.FC<BlurViewProps> = ({ 
  intensity = 50, 
  style, 
  children 
}) => {
  if (Platform.OS === 'web') {
    // Web版本使用CSS backdrop-filter
    const webStyle = {
      backdropFilter: `blur(${intensity / 5}px)`,
      WebkitBackdropFilter: `blur(${intensity / 5}px)`,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    };
    
    return (
      <View style={[style, webStyle]}>
        {children}
      </View>
    );
  }
  
  // 原生平台使用expo-blur
  const { BlurView } = require('expo-blur');
  return (
    <BlurView intensity={intensity} style={style}>
      {children}
    </BlurView>
  );
};