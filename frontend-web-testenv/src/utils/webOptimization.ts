// Web端激进优化配置
// 目标：将bundle从2.90MB缩小到1MB以下

// 1. 只导入必要的图标库 - 节省约1.5MB
export { Ionicons } from '@expo/vector-icons'; // 432KB - 必须保留

// 移除未使用的大字体包
// MaterialCommunityIcons: 1.1MB - 完全移除
// FontAwesome6_Solid: 414KB - 完全移除
// MaterialIcons: 348KB - 完全移除
// Fontisto: 306KB - 完全移除

// 2. 图标替换映射 - 用Ionicons替换其他图标库
export const IconReplacements = {
  // MaterialIcons替换
  'check-circle': 'checkmark-circle', // MaterialIcons → Ionicons
  'info': 'information-circle',

  // FontAwesome替换
  'download': 'download-outline',
  'share': 'share-outline',

  // MaterialCommunityIcons替换
  'account': 'person',
  'home': 'home',
} as const;

// 3. 轻量级图标组件
export const WebOptimizedIcon = ({ name, size = 24, color }: {
  name: string;
  size?: number;
  color?: string;
}) => {
  const { Ionicons } = require('@expo/vector-icons');
  return <Ionicons name={name} size={size} color={color} />;
};

// 4. 图片资源优化策略
export const ImageOptimization = {
  // 使用WebP格式（体积减少30-50%）
  preferWebP: true,

  // 懒加载大图片
  lazyLoadThreshold: 50, // KB

  // CDN配置
  useCDN: true,
  cdnBase: 'https://cdn.vitaglobal.icu',
};

// 5. 移除大logo，只使用压缩版本
export const LOGO_CONFIG = {
  // 移除468KB的大logo
  useLargeLogo: false,

  // 只使用25KB的压缩logo
  compressedLogoPath: '/assets/src/assets/logos/pomelo-logo-compressed.png',
};