import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

interface SimpleQRScannerProps {
  onScan: (data: string) => void;
  style?: any;
}

export const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({ onScan, style }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const lastScannedRef = useRef<string>('');
  const isScanningRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeScanner = async () => {
      try {
        console.log('🚀 SimpleQRScanner: 开始初始化');
        
        // 1. 获取摄像头
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              facingMode: { ideal: 'environment' }
            }
          });
        } catch (error: any) {
          console.warn('⚠️ 摄像头访问失败:', error.message);
          if (error.name === 'NotAllowedError') {
            console.info('💡 提示: 摄像头需要在 HTTPS 环境下使用，或者用户拒绝了摄像头权限');
          }
          throw error;
        }
        
        if (!isMounted || !videoRef.current) return;
        
        const video = videoRef.current;
        video.srcObject = stream;
        
        // 2. 等待视频准备就绪
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            console.log('📹 SimpleQRScanner: 视频元数据加载完成');
            video.play().then(() => {
              console.log('▶️ SimpleQRScanner: 视频开始播放');
              resolve();
            });
          };
        });
        
        // 3. 动态加载QR Scanner库 (最新版本，不需要设置WORKER_PATH)
        if (!(window as any).QrScanner) {
          console.log('📚 SimpleQRScanner: 加载QR Scanner库');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.umd.min.js';
            script.onload = () => {
              console.log('✅ SimpleQRScanner: QR Scanner库加载成功');
              
              // 确保Worker路径设置正确（重要！）
              const QrScanner = (window as any).QrScanner;
              if (QrScanner.WORKER_PATH === undefined) {
                QrScanner.WORKER_PATH = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner-worker.min.js';
                console.log('🔧 SimpleQRScanner: 设置Worker路径');
              }
              
              resolve();
            };
            script.onerror = () => {
              console.error('❌ SimpleQRScanner: QR Scanner库加载失败');
              reject(new Error('Failed to load QR Scanner library'));
            };
            document.head.appendChild(script);
          });
        }
        
        if (!isMounted) return;
        
        // 4. 创建QR扫描器
        console.log('🔧 SimpleQRScanner: 创建QR扫描器实例');
        const QrScanner = (window as any).QrScanner;
        
        const scanner = new QrScanner(
          video,
          (result: any) => {
            // 兼容不同版本的QrScanner返回格式
            const currentData = typeof result === 'string' ? result : result.data;
            console.log('🎯 SimpleQRScanner: 检测到QR码:', currentData);
            
            // 简化逻辑，直接调用回调
            if (currentData && currentData.trim()) {
              console.log('✅ SimpleQRScanner: 立即触发回调，数据:', currentData.substring(0, 50));
              
              try {
                onScan(currentData);
                console.log('📞 SimpleQRScanner: onScan回调执行成功');
              } catch (error) {
                console.error('❌ SimpleQRScanner: onScan回调执行失败:', error);
              }
            } else {
              console.log('⚠️ SimpleQRScanner: 无效的QR数据');
            }
          },
          {
            // 更激进的扫描配置
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 10, // 提高扫描频率
            returnDetailedScanResult: false,
            // 使用更大的扫描区域
            calculateScanRegion: (video) => {
              console.log('📐 SimpleQRScanner: 计算扫描区域, 视频尺寸:', {
                width: video.videoWidth,
                height: video.videoHeight
              });
              return {
                x: 0,
                y: 0,
                width: video.videoWidth,
                height: video.videoHeight
              };
            },
            // 添加更多选项提高检测率
            preferredCamera: 'environment',
            onDecodeError: (error) => {
              // 不打印解码错误，避免控制台刷屏
              // console.log('⚠️ SimpleQRScanner: 解码错误（正常）:', error.message);
            }
          }
        );
        
        // 移除调试定时器，避免内存泄漏
        
        scannerRef.current = scanner;
        
        // 5. 启动扫描器
        await scanner.start();
        console.log('✅ SimpleQRScanner: 扫描器启动成功');
        
        // 添加调试定时器，检查扫描器状态
        const debugInterval = setInterval(() => {
          console.log('🔍 SimpleQRScanner 调试状态:', {
            isActive: scanner._active,
            hasVideo: !!video.srcObject,
            videoReady: video.readyState === 4,
            videoSize: `${video.videoWidth}x${video.videoHeight}`,
            scannerState: { lastScanned, isScanning }
          });
        }, 10000); // 每10秒检查一次
        
        // 在清理时停止调试定时器
        const originalStop = scanner.stop;
        scanner.stop = function() {
          clearInterval(debugInterval);
          return originalStop.call(this);
        };
        
      } catch (error) {
        console.error('❌ SimpleQRScanner: 初始化失败:', error);
      }
    };
    
    // 延迟初始化以确保组件完全挂载
    const timer = setTimeout(initializeScanner, 500);
    
    // 清理函数
    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      if (scannerRef.current) {
        console.log('🧹 SimpleQRScanner: 清理扫描器');
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [onScan]);

  return (
    <View style={[styles.container, style]}>
      <video
        ref={videoRef}
        style={styles.video}
        autoPlay
        playsInline
        muted
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
});