// Web兼容的SafeArea hooks
import { Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets as useRNSafeAreaInsets } from 'react-native-safe-area-context';

export const useWebSafeAreaInsets = () => {
  const nativeInsets = useRNSafeAreaInsets();
  
  if (Platform.OS === 'web') {
    // Web平台固定的安全区域 - 避免动态计算导致循环
    return {
      top: 20,
      bottom: 90, 
      left: 16,
      right: 16,
    };
  }
  
  // 原生平台返回真实的安全区域
  return nativeInsets;
};