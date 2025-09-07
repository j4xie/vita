// Web兼容的CameraView组件
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      startWebCamera();
    }
  }, [facing]);

  const startWebCamera = async () => {
    if (Platform.OS !== 'web') return;

    try {
      const constraints = {
        video: {
          facingMode: facing === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
        
        // 如果需要QR扫码，可以在这里集成qr-scanner
        if (onBarcodeScanned && (globalThis as any).QrScanner) {
          const QrScanner = (globalThis as any).QrScanner;
          const qrScanner = new QrScanner(
            videoRef.current,
            (result: { data: string }) => {
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
          qrScanner.start();
        }
      }
    } catch (err: any) {
      console.error('摄像头访问失败:', err);
      setError(err.message || '无法访问摄像头');
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