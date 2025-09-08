import React from 'react';
import { Platform, RefreshControl } from 'react-native';

interface WebRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
  tintColor?: string;
  progressBackgroundColor?: string;
  progressViewOffset?: number;
  titleColor?: string;
  title?: string;
  style?: any;
}

// Simple wrapper that handles web compatibility
export const WebRefreshControl: React.FC<WebRefreshControlProps> = (props) => {
  if (Platform.OS === 'web') {
    // On web, RefreshControl has limited support, so we'll create a minimal fallback
    // or return null to disable it completely
    return null;
  }

  // On native platforms, use the standard RefreshControl
  return <RefreshControl {...props} />;
};

export default WebRefreshControl;