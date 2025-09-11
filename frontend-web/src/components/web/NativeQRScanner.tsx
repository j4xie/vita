import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface NativeQRScannerProps {
  onScan: (data: string) => void;
  style?: any;
}

export const NativeQRScanner: React.FC<NativeQRScannerProps> = ({ onScan, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let isMounted = true;
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        console.log('🚀 NativeQRScanner: 初始化摄像头');
        
        // 获取摄像头
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        if (!isMounted || !videoRef.current) return;

        const video = videoRef.current;
        video.srcObject = stream;
        
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(() => {
              console.log('✅ NativeQRScanner: 摄像头启动成功');
              resolve();
            });
          };
        });

        // 开始扫描
        startScanning();

      } catch (error) {
        console.error('❌ NativeQRScanner: 摄像头初始化失败:', error);
      }
    };

    const startScanning = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!context) return;

      console.log('🔍 NativeQRScanner: 开始扫描循环');

      const scan = () => {
        if (!isMounted || !video.videoWidth || !video.videoHeight) return;

        // 设置canvas尺寸和性能优化
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // 设置willReadFrequently属性以优化性能
        (context as any).willReadFrequently = true;

        // 绘制当前帧
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 获取图像数据
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        try {
          // 使用jsQR库解析QR码
          const qrCode = (window as any).jsQR(imageData.data, canvas.width, canvas.height);
          
          if (qrCode && qrCode.data) {
            console.log('🎯 NativeQRScanner: 检测到QR码:', qrCode.data);
            
            // 立即调用回调
            onScan(qrCode.data);
            
            // 暂停扫描2秒，避免重复
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              setTimeout(() => {
                if (isMounted) startScanning();
              }, 2000);
            }
          }
        } catch (error) {
          // 忽略解析错误，继续扫描
        }
      };

      // 每100ms扫描一次
      scanIntervalRef.current = setInterval(scan, 100);
    };

    // 加载jsQR库并初始化
    const loadLibraryAndInit = async () => {
      if (!(window as any).jsQR) {
        console.log('📚 NativeQRScanner: 加载jsQR库');
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
          script.onload = () => {
            console.log('✅ NativeQRScanner: jsQR库加载成功');
            resolve();
          };
          script.onerror = () => reject(new Error('Failed to load jsQR'));
          document.head.appendChild(script);
        });
      }
      
      await initCamera();
    };

    loadLibraryAndInit();

    // 清理函数
    return () => {
      isMounted = false;
      
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [onScan]);

  if (Platform.OS !== 'web') {
    return <View style={[styles.container, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <video
        ref={videoRef}
        style={styles.video}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as any,
  },
  canvas: {
    display: 'none', // 隐藏canvas，只用于处理
  },
});