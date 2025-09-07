// Web兼容的LinearGradient组件
import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export const WebLinearGradient: React.FC<LinearGradientProps> = ({ 
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  children 
}) => {
  if (Platform.OS === 'web') {
    // Web版本使用CSS linear-gradient
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90;
    const webStyle = {
      background: `linear-gradient(${angle}deg, ${colors.join(', ')})`,
    };
    
    return (
      <View style={[style, webStyle]}>
        {children}
      </View>
    );
  }
  
  // 原生平台使用expo-linear-gradient
  const { LinearGradient } = require('expo-linear-gradient');
  return (
    <LinearGradient colors={colors} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
};