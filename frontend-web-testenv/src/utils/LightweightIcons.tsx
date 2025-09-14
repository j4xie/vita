// 轻量级图标解决方案 - 完全替代@expo/vector-icons
import React from 'react';
import { Text, View } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// 使用Unicode符号替代字体图标 - bundle大小接近0
const UnicodeIconMap: Record<string, string> = {
  // 导航图标
  'arrow-back': '‹',
  'arrow-forward': '›',
  'chevron-back': '‹',
  'chevron-forward': '›',
  'chevron-down': '⌄',
  'chevron-up': '⌃',

  // 操作图标
  'close': '×',
  'add': '+',
  'remove': '−',
  'checkmark': '✓',
  'checkmark-circle': '✓',

  // 导航图标
  'home': '⌂',
  'home-outline': '⌂',
  'person': '👤',
  'person-outline': '👤',
  'search': '⌕',
  'menu': '☰',

  // 功能图标
  'settings': '⚙',
  'settings-outline': '⚙',
  'notifications': '🔔',
  'notifications-outline': '🔔',

  // 状态图标
  'alert-circle': '⚠',
  'information-circle': 'ⓘ',
  'warning': '⚠',

  // 媒体图标
  'camera': '📷',
  'camera-outline': '📷',
  'image': '🖼',

  // 位置和扫描
  'location': '📍',
  'qr-code-outline': '▦',
  'scan': '⌖',

  // 其他常用
  'gift': '🎁',
  'heart': '♡',
  'heart-outline': '♡',
  'star': '★',
  'star-outline': '☆',
  'download': '⬇',
  'share': '↗',
  'refresh': '↻',
  'sync': '⟲',
};

// 轻量级图标组件
export const LightweightIcon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#000',
  style
}) => {
  const iconSymbol = UnicodeIconMap[name] || '◯'; // 默认符号

  return (
    <View style={[
      {
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center'
      },
      style
    ]}>
      <Text
        style={{
          fontSize: size * 0.8,
          color,
          lineHeight: size,
          textAlign: 'center',
          fontWeight: '400'
        }}
      >
        {iconSymbol}
      </Text>
    </View>
  );
};

// 兼容性导出 - 可以直接替换Ionicons
export const Ionicons = LightweightIcon;

export default LightweightIcon;