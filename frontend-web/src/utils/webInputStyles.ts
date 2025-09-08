import { Platform } from 'react-native';

/**
 * Web环境下TextInput的兼容性样式
 * 修复React Native Web中TextInput无法点击聚焦的问题
 */
export const getWebInputStyles = () => {
  if (Platform.OS !== 'web') {
    return {};
  }
  
  return {
    // CSS样式修复 - 移除不支持的outline属性
    // outline: 'none' - React Native Web不支持
    // outlineStyle: 'none' - React Native Web不支持
    cursor: 'text' as const,
    userSelect: 'text' as const,
    pointerEvents: 'auto' as const,
    WebkitUserSelect: 'text' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    // 确保可以接收事件
    zIndex: 1,
    position: 'relative' as const,
    // 移除borderWidth设置，避免与组件样式冲突
    // borderWidth由各个组件自己控制
  };
};

/**
 * 获取Web环境下TextInput的HTML属性
 * 这些属性需要直接应用到TextInput组件上
 */
export const getWebInputProps = () => {
  if (Platform.OS !== 'web') {
    return {};
  }
  
  return {
    // HTML输入属性
    autoComplete: 'off',
    spellCheck: false,
    // 强制可编辑
    contentEditable: true,
    suppressContentEditableWarning: true,
  };
};

/**
 * 获取包含Web兼容性的TextInput样式
 * @param baseStyle 基础样式
 * @returns 包含Web兼容性修复的样式对象
 */
export const getWebCompatibleInputStyle = (baseStyle: any) => ({
  ...baseStyle,
  ...getWebInputStyles(),
});