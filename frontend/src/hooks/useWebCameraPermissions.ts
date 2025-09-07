// Web兼容的摄像头权限Hook
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface PermissionResponse {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export const useWebCameraPermissions = (): [
  PermissionResponse | null,
  () => Promise<PermissionResponse>
] => {
  const [permission, setPermission] = useState<PermissionResponse | null>(null);

  const requestPermission = async (): Promise<PermissionResponse> => {
    if (Platform.OS === 'web') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // 停止预览流
        
        const result = { granted: true, status: 'granted' as const };
        setPermission(result);
        return result;
      } catch (error) {
        console.error('Web摄像头权限请求失败:', error);
        const result = { granted: false, status: 'denied' as const };
        setPermission(result);
        return result;
      }
    } else {
      // 原生平台使用expo-camera
      const { useCameraPermissions } = require('expo-camera');
      const [nativePermission, requestNative] = useCameraPermissions();
      return requestNative();
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      // 检查权限状态
      navigator.permissions?.query({ name: 'camera' as any }).then(result => {
        setPermission({
          granted: result.state === 'granted',
          status: result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'undetermined'
        });
      }).catch(() => {
        // 如果不支持permissions API，设置为未确定状态
        setPermission({ granted: false, status: 'undetermined' });
      });
    }
  }, []);

  return [permission, requestPermission];
};