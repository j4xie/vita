// Web兼容的CameraView组件
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import QrScanner from 'qr-scanner';

interface BarCodeEvent {
  type: string;
  data: string;
}

interface WebCameraViewProps {
  style?: any;
  facing?: 'front' | 'back';
  enableTorch?: boolean;
  onBarcodeScanned?: (event: BarCodeEvent) => void;
  barcodeScannerSettings?: {
    barcodeTypes: string[];
  };
}

export const WebCameraView: React.FC<WebCameraViewProps> = ({
  style,
  facing = 'back',
  enableTorch = false,
  onBarcodeScanned,
  barcodeScannerSettings
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      startWebCamera();
    }
    
    // 清理函数
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facing]);

  const startWebCamera = async () => {
    if (Platform.OS !== 'web') return;

    console.log('🔄 [WebCameraView] 开始启动摄像头...');
    console.log('🌍 [WebCameraView] 当前协议:', window.location.protocol);
    console.log('🌍 [WebCameraView] 当前域名:', window.location.hostname);
    console.log('🔐 [WebCameraView] 是否安全上下文:', window.isSecureContext);

    // 检查是否支持摄像头API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ [WebCameraView] 浏览器不支持摄像头API');
      setError('浏览器不支持摄像头访问');
      setHasPermission(false);
      return;
    }

    // 检查安全上下文
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      console.warn('⚠️ [WebCameraView] 非安全上下文，摄像头可能无法正常工作');
      setError('需要HTTPS环境才能使用摄像头。请使用 https:// 或 localhost');
      setHasPermission(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: facing === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('📷 [WebCameraView] 请求摄像头权限:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ [WebCameraView] 摄像头权限获取成功');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('▶️ [WebCameraView] 视频流开始播放');
        setHasPermission(true);
        
        // 先不启动QR Scanner，只显示摄像头画面用于测试
        console.log('📹 [WebCameraView] 摄像头已启动，暂时不启用QR扫描功能');
        
        // 等待视频流准备就绪后再启动QR扫描
        if (onBarcodeScanned) {
          // 等待一小段时间确保video元素完全准备好
          setTimeout(() => {
            if (videoRef.current) {
              console.log('🔍 [WebCameraView] 初始化QR Scanner...');
              try {
                qrScannerRef.current = new QrScanner(
                  videoRef.current,
                  (result) => {
                    console.log('📱 [WebCameraView] QR码扫描成功:', result.data);
                    onBarcodeScanned({
                      type: 'qr',
                      data: result.data
                    });
                  },
                  {
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                  }
                );
                console.log('🔍 [WebCameraView] QR Scanner对象创建成功');
                
                qrScannerRef.current.start()
                  .then(() => {
                    console.log('✅ [WebCameraView] QR Scanner启动成功');
                  })
                  .catch((error) => {
                    console.error('❌ [WebCameraView] QR Scanner启动失败:', error);
                    console.error('❌ [WebCameraView] 错误详情:', error.message);
                  });
              } catch (error) {
                console.error('❌ [WebCameraView] QR Scanner创建失败:', error);
              }
            }
          }, 1000); // 增加延迟到1秒
        }
      }
    } catch (err: any) {
      console.error('❌ [WebCameraView] 摄像头访问失败:', err);
      console.error('❌ [WebCameraView] 错误名称:', err.name);
      console.error('❌ [WebCameraView] 错误信息:', err.message);
      
      let errorMessage = '无法访问摄像头';
      if (err.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '浏览器不支持摄像头功能';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用占用';
      } else {
        errorMessage = err.message || '摄像头启动失败';
      }
      
      setError(errorMessage);
      setHasPermission(false);
    }
  };

  if (Platform.OS === 'web') {
    if (hasPermission === null) {
      return (
        <View style={[style, styles.placeholder]}>
          <Text style={styles.text}>正在启动摄像头...</Text>
        </View>
      );
    }

    if (hasPermission === false || error) {
      return (
        <View style={[style, styles.placeholder]}>
          <Text style={styles.text}>摄像头权限被拒绝</Text>
          <Text style={styles.subtext}>请允许访问摄像头以使用扫码功能</Text>
        </View>
      );
    }

    return (
      <View style={style}>
        <video
          ref={videoRef as any}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          autoPlay
          playsInline
        />
      </View>
    );
  }

  // 原生平台使用expo-camera
  const { CameraView } = require('expo-camera');
  return (
    <CameraView
      style={style}
      facing={facing}
      enableTorch={enableTorch}
      onBarcodeScanned={onBarcodeScanned}
      barcodeScannerSettings={barcodeScannerSettings}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});