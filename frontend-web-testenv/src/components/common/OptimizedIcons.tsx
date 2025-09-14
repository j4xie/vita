// 优化的图标组件 - 减少bundle大小
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

// 只导入最常用的Ionicons，避免导入所有字体包
// 这可以显著减少bundle大小

interface OptimizedIconProps {
  name: keyof typeof IconMap;
  size?: number;
  color?: string;
  style?: any;
}

// 图标映射 - 只包含实际使用的图标
const IconMap = {
  // 导航相关
  home: 'home-outline',
  homeActive: 'home',
  search: 'search-outline',
  person: 'person-outline',
  personActive: 'person',
  settings: 'settings-outline',

  // 操作相关
  close: 'close',
  back: 'chevron-back',
  forward: 'chevron-forward',
  up: 'chevron-up',
  down: 'chevron-down',

  // 状态相关
  check: 'checkmark',
  checkCircle: 'checkmark-circle',
  alert: 'alert-circle',
  info: 'information-circle',

  // 功能相关
  add: 'add',
  remove: 'remove',
  edit: 'create-outline',
  delete: 'trash-outline',
  share: 'share-outline',
  download: 'download-outline',

  // 媒体相关
  camera: 'camera-outline',
  image: 'image-outline',

  // 特殊功能
  qrcode: 'qr-code-outline',
  scan: 'scan-outline',
  location: 'location-outline',
} as const;

export const OptimizedIcon: React.FC<OptimizedIconProps> = ({
  name,
  size = 24,
  color,
  style
}) => {
  const iconName = IconMap[name];

  return (
    <Ionicons
      name={iconName as any}
      size={size}
      color={color}
      style={style}
    />
  );
};

// 导出常用图标组合
export const NavigationIcons = {
  Home: (props: Omit<OptimizedIconProps, 'name'>) =>
    <OptimizedIcon {...props} name="home" />,
  HomeActive: (props: Omit<OptimizedIconProps, 'name'>) =>
    <OptimizedIcon {...props} name="homeActive" />,
  Search: (props: Omit<OptimizedIconProps, 'name'>) =>
    <OptimizedIcon {...props} name="search" />,
  Profile: (props: Omit<OptimizedIconProps, 'name'>) =>
    <OptimizedIcon {...props} name="person" />,
  ProfileActive: (props: Omit<OptimizedIconProps, 'name'>) =>
    <OptimizedIcon {...props} name="personActive" />,
};

export default OptimizedIcon;