import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NativeQRScannerProps {
  onScan: (data: string) => void;
  style?: any;
}

type CameraStatus = 'initializing' | 'requesting' | 'granted' | 'denied' | 'error';

export const NativeQRScanner: React.FC<NativeQRScannerProps> = ({ onScan, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let isMounted = true;
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        console.log('🚀 NativeQRScanner: 初始化摄像头');
        setCameraStatus('initializing');
        
        // 检查浏览器兼容性
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('当前浏览器不支持摄像头功能');
        }

        // 首先检查摄像头权限状态
        try {
          setCameraStatus('requesting');
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('📹 摄像头权限状态:', permission.state);
          
          if (permission.state === 'denied') {
            setCameraStatus('denied');
            throw new Error('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问');
          }
        } catch (permError) {
          console.log('⚠️ 无法检查权限状态，直接尝试获取摄像头:', permError);
        }
        
        // 获取摄像头 - 增强错误处理
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
          console.log('✅ 摄像头权限获取成功');
          setCameraStatus('granted');
        } catch (mediaError: any) {
          console.error('❌ 摄像头获取失败:', mediaError);
          
          // 根据不同错误类型提供具体提示
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            setCameraStatus('denied');
            throw new Error('摄像头权限被拒绝。请点击地址栏左侧的摄像头图标，选择"允许"来启用摄像头权限。');
          } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
            setCameraStatus('error');
            throw new Error('未检测到摄像头设备，请检查设备连接。');
          } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
            setCameraStatus('error');
            throw new Error('摄像头被其他应用占用，请关闭其他使用摄像头的程序后重试。');
          } else if (mediaError.name === 'OverconstrainedError' || mediaError.name === 'ConstraintNotSatisfiedError') {
            // 尝试使用更宽松的配置
            console.log('🔄 尝试使用基础摄像头配置...');
            stream = await navigator.mediaDevices.getUserMedia({
              video: true
            });
            setCameraStatus('granted');
          } else {
            setCameraStatus('error');
            throw new Error(`摄像头初始化失败: ${mediaError.message}`);
          }
        }

        if (!isMounted || !videoRef.current) return;

        const video = videoRef.current;
        video.srcObject = stream;
        
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play().then(() => {
              console.log('✅ NativeQRScanner: 摄像头启动成功');
              resolve();
            }).catch((playError) => {
              console.error('❌ 视频播放失败:', playError);
              reject(new Error('摄像头视频播放失败，请刷新页面重试'));
            });
          };
          
          video.onerror = () => {
            reject(new Error('摄像头视频加载失败'));
          };
          
          // 设置超时
          setTimeout(() => {
            reject(new Error('摄像头启动超时，请检查设备连接'));
          }, 10000);
        });

        // 开始扫描
        startScanning();

      } catch (error: any) {
        console.error('❌ NativeQRScanner: 摄像头初始化失败:', error);
        
        // 设置错误状态和消息
        setCameraStatus('error');
        const errorMsg = error.message || '摄像头初始化失败，请检查权限设置';
        setErrorMessage(errorMsg);
        
        // 不再自动弹出确认框，而是显示状态指示器让用户手动处理
        console.log('🔧 摄像头初始化失败，显示错误状态指示器');
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

  // 重试摄像头初始化
  const retryCamera = async () => {
    setErrorMessage('');
    setCameraStatus('initializing');
    
    // 重新加载并初始化
    try {
      // 加载jsQR库并初始化
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
    } catch (error) {
      console.error('重试失败:', error);
    }
  };

  // 渲染状态指示器
  const renderStatusOverlay = () => {
    if (cameraStatus === 'granted') return null;

    const getStatusConfig = () => {
      switch (cameraStatus) {
        case 'initializing':
          return {
            icon: 'camera' as const,
            title: '正在初始化摄像头...',
            message: '请稍候',
            showRetry: false,
            color: '#6B7280'
          };
        case 'requesting':
          return {
            icon: 'camera' as const,
            title: '请允许摄像头权限',
            message: '浏览器正在请求摄像头权限，请点击"允许"',
            showRetry: false,
            color: '#F59E0B'
          };
        case 'denied':
          return {
            icon: 'camera-off' as const,
            title: '摄像头权限被拒绝',
            message: '请点击地址栏左侧的摄像头图标，选择"允许"来启用权限',
            showRetry: true,
            color: '#EF4444'
          };
        case 'error':
          return {
            icon: 'warning' as const,
            title: '摄像头启动失败',
            message: errorMessage || '请检查摄像头设备和权限设置',
            showRetry: true,
            color: '#EF4444'
          };
        default:
          return null;
      }
    };

    const config = getStatusConfig();
    if (!config) return null;

    return (
      <View style={[styles.statusOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
        <View style={styles.statusContent}>
          <Ionicons name={config.icon} size={64} color={config.color} />
          <Text style={[styles.statusTitle, { color: config.color }]}>
            {config.title}
          </Text>
          <Text style={styles.statusMessage}>
            {config.message}
          </Text>
          {config.showRetry && (
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: config.color }]}
              onPress={retryCamera}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          )}
          {cameraStatus === 'denied' && (
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => {
                window.open('https://support.google.com/chrome/answer/2693767', '_blank');
              }}
            >
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.helpButtonText}>权限设置帮助</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
      {renderStatusOverlay()}
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
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  statusContent: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    maxWidth: 320,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  helpButtonText: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 6,
  },
});