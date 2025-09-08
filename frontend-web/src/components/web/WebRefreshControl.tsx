import React from 'react';
import { Platform, RefreshControl as RNRefreshControl } from 'react-native';

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
  // 所有平台都使用原生RefreshControl
  // Web端虽然下拉手势可能不完全响应，但仍提供基本的刷新指示器
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