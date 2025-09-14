// 轻量级图标组件 - 替代@expo/vector-icons减少bundle
import React from 'react';
import { Text, View } from 'react-native';

interface LightweightIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// CSS图标映射 - 使用Unicode符号替代字体图标
const IconMap: Record<string, string> = {
  // 导航图标
  'arrow-back': '←',
  'arrow-forward': '→',
  'chevron-down': '▼',
  'chevron-up': '▲',
  'chevron-left': '◀',
  'chevron-right': '▶',

  // 操作图标
  'close': '×',
  'add': '+',
  'remove': '−',
  'checkmark': '✓',
  'checkmark-circle': '✅',

  // 功能图标
  'home': '🏠',
  'home-outline': '🏡',
  'person': '👤',
  'person-outline': '👤',
  'search': '🔍',
  'settings': '⚙️',
  'menu': '☰',

  // 状态图标
  'alert-circle': '⚠️',
  'information-circle': 'ℹ️',
  'warning': '⚠️',

  // 媒体图标
  'camera': '📷',
  'camera-outline': '📸',
  'image': '🖼️',

  // 特殊图标
  'qr-code': '▦',
  'scan': '⌖',
  'location': '📍',
  'gift': '🎁',

  // 通用图标
  'ellipsis-horizontal': '⋯',
  'ellipsis-vertical': '⋮',
  'refresh': '↻',
  'download': '⬇️',
  'share': '📤',
};

export const LightweightIcon: React.FC<LightweightIconProps> = ({
  name,
  size = 24,
  color = '#000',
  style
}) => {
  const iconSymbol = IconMap[name] || '?';

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text
        style={{
          fontSize: size * 0.8, // 稍微小一点保持比例
          color,
          lineHeight: size,
          textAlign: 'center',
        }}
      >
        {iconSymbol}
      </Text>
    </View>
  );
};

// 兼容性包装器 - 可以替代Ionicons
export const IoniconsFallback = LightweightIcon;

export default LightweightIcon;