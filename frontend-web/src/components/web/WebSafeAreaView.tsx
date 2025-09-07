// Web兼容的SafeAreaView组件
import React from 'react';
import { View, ViewStyle, Platform, Dimensions } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

interface WebSafeAreaViewProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}

export const WebSafeAreaView: React.FC<WebSafeAreaViewProps> = ({ 
  style, 
  children,
  edges = ['top', 'right', 'bottom', 'left']
}) => {
  if (Platform.OS === 'web') {
    // Web平台真正响应式设计 - 充分利用屏幕空间
    const webSafeAreaStyle: ViewStyle = {
      flex: 1,
      width: '100vw', // 充满整个视口宽度
      minHeight: '100vh', // 最小高度为视口高度
      overflow: 'visible', // 允许内容正常显示
      position: 'relative',
      // 响应式容器 - 桌面端居中，移动端全宽
      alignSelf: 'stretch',
      // 移除固定padding，让子组件自己控制间距
    } as ViewStyle;

    return (
      <View style={[webSafeAreaStyle, style]}>
        {children}
      </View>
    );
  }

  // 原生平台使用标准SafeAreaView
  return (
    <RNSafeAreaView style={style} edges={edges}>
      {children}
    </RNSafeAreaView>
  );
};