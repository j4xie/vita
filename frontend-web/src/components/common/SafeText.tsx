/* Web端特定版本 - 与App端隔离 */
import React from 'react';
import { Text, TextProps } from 'react-native';

interface SafeTextProps extends TextProps {
  children?: any;
  fallback?: string;
}

/**
 * SafeText 组件 - 防止Text渲染错误的安全包装器
 * 
 * 功能：
 * - 确保所有内容都是字符串类型
 * - 处理undefined/null值
 * - 提供默认fallback文案
 * - 防止"Text strings must be rendered within a <Text> component"错误
 */
export const SafeText: React.FC<SafeTextProps> = ({ 
  children, 
  fallback = '', 
  ...props 
}) => {
  // 安全地处理children内容
  const getSafeContent = (): string => {
    try {
      // 如果children是null或undefined
      if (children == null) {
        return fallback;
      }
      
      // 如果children是字符串
      if (typeof children === 'string') {
        return children;
      }
      
      // 如果children是数字
      if (typeof children === 'number') {
        return String(children);
      }
      
      // 如果children是布尔值
      if (typeof children === 'boolean') {
        return children ? 'true' : 'false';
      }
      
      // 如果children是数组
      if (Array.isArray(children)) {
        return children.map(item => 
          typeof item === 'string' ? item : String(item || '')
        ).join('');
      }
      
      // 如果children是对象或其他类型
      if (typeof children === 'object') {
        return fallback || '[对象]';
      }
      
      // 其他情况，强制转换为字符串
      return String(children || fallback);
      
    } catch (error) {
      console.warn('SafeText内容处理错误:', error);
      return fallback || '内容错误';
    }
  };

  return (
    <Text {...props}>
      {getSafeContent()}
    </Text>
  );
};

export default SafeText;