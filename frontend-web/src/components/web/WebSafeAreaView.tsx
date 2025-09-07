// Web兼容的SafeAreaView组件
import React from 'react';
import { View, ViewStyle, Platform, Dimensions } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { WebScrollContainer } from './WebScrollContainer';

interface WebSafeAreaViewProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  enableScroll?: boolean; // 是否支持内容滚动
}

export const WebSafeAreaView: React.FC<WebSafeAreaViewProps> = ({ 
  style, 
  children,
  edges = ['top', 'right', 'bottom', 'left'],
  enableScroll = false
}) => {
  if (Platform.OS === 'web') {
    // Web平台 - 使用原生滚动容器完全绕过React Native限制
    return (
      <WebScrollContainer
        style={{
          ...((typeof style === 'object' && style) || {}),
        }}
      >
        {children}
      </WebScrollContainer>
    );
  }

  // 原生平台使用标准SafeAreaView
  return (
    <RNSafeAreaView style={style} edges={edges}>
      {children}
    </RNSafeAreaView>
  );
};