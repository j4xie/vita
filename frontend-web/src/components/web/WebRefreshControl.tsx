import React from 'react';
import { Platform, RefreshControl as RNRefreshControl, View, Text, StyleSheet } from 'react-native';

interface WebRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
  tintColor?: string;
  progressBackgroundColor?: string;
  progressViewOffset?: number;
  titleColor?: string;
}

export const WebRefreshControl: React.FC<WebRefreshControlProps> = ({
  refreshing,
  onRefresh,
  colors = ['#FF6B35'],
  tintColor = '#FF6B35',
  progressBackgroundColor = '#FFFFFF',
  progressViewOffset,
  titleColor,
}) => {
  if (Platform.OS === 'web') {
    // Web平台：使用简化的RefreshControl，避免复杂配置
    return (
      <RNRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={tintColor}
        // 移除可能导致问题的属性
        // colors={colors}
        // progressBackgroundColor={progressBackgroundColor}
        // progressViewOffset={progressViewOffset}
      />
    );
  }

  // 移动端：使用完整的RefreshControl
  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={colors}
      tintColor={tintColor}
      progressBackgroundColor={progressBackgroundColor}
      progressViewOffset={progressViewOffset}
    />
  );
};

export default WebRefreshControl;