// 图标优化 - 只导入使用的图标
// 这个文件帮助减少bundle大小，避免全量导入所有图标字体

// 只导入实际使用的图标集合
export { Ionicons } from '@expo/vector-icons';
export { MaterialIcons } from '@expo/vector-icons';
export { Feather } from '@expo/vector-icons';

// 注释掉未使用的大字体包
// export { MaterialCommunityIcons } from '@expo/vector-icons'; // 1.15MB - 暂时移除
// export { FontAwesome6 } from '@expo/vector-icons'; // 424KB - 暂时移除
// export { FontAwesome5 } from '@expo/vector-icons'; // 203KB - 暂时移除

// 创建一个轻量级的图标映射
export const OptimizedIcons = {
  // 只保留实际使用的图标
  home: 'home',
  search: 'search',
  person: 'person',
  settings: 'settings',
  close: 'close',
  back: 'chevron-back',
  forward: 'chevron-forward',
  check: 'checkmark',
  add: 'add',
  remove: 'remove',
} as const;

// 使用说明：
// 在组件中使用 import { Ionicons } from './utils/iconOptimization'
// 而不是 import { Ionicons } from '@expo/vector-icons'