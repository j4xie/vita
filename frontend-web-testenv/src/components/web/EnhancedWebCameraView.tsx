import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface CameraError {
  name: string;
  message: string;
  code?: string;
}

interface BarcodeData {
  type: string;
  data: string;
}

interface EnhancedWebCameraViewProps {
  style?: any;
  facing?: 'front' | 'back';
  enableTorch?: boolean;
  onBarcodeScanned?: (data: BarcodeData) => void;
  barcodeScannerSettings?: {
    barcodeTypes: string[];
  };
}

export interface EnhancedWebCameraViewRef {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  takePicture: () => Promise<string | null>;
}

export const EnhancedWebCameraView = forwardRef<EnhancedWebCameraViewRef, EnhancedWebCameraViewProps>(({
  style,
  facing = 'back',
  enableTorch = false,
  onBarcodeScanned,
  barcodeScannerSettings
}, ref) => {
  const { t } = useTranslation();
  
  // 组件渲染调试
  console.log('🎬 [EnhancedWebCameraView] 组件开始渲染:', {
    timestamp: new Date().toISOString(),
    props: { facing, enableTorch, hasOnBarcodeScanned: !!onBarcodeScanned }
  });
  
  // 状态管理
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  
  // 引用
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrScannerRef = useRef<any>(null);
  
  // 调试：监控videoRef的变化
  useEffect(() => {
    console.log('🔧 [EnhancedWebCameraView] videoRef状态变化:', {
      current: !!videoRef.current,
      timestamp: new Date().toISOString()
    });
  }, [videoRef.current]);

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    startCamera,
    stopCamera,
    switchCamera,
    takePicture,
  }));

  // 环境检查
  const checkEnvironment = (): { isValid: boolean; error?: string } => {
    // 检查是否为Web环境
    if (Platform.OS !== 'web') {
      return { isValid: false, error: '此组件仅支持Web环境' };
    }

    // 检查HTTPS要求
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        return { 
          isValid: false, 
          error: '摄像头访问需要HTTPS环境或localhost'
        };
      }
    }

    // 检查MediaDevices API支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { 
        isValid: false, 
        error: '浏览器不支持摄像头访问API'
      };
    }

    return { isValid: true };
  };

  // 获取可用摄像头设备
  const getAvailableDevices = async (): Promise<MediaDeviceInfo[]> => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      
      console.log(`📷 [EnhancedWebCameraView] 检测到 ${videoDevices.length} 个摄像头设备`);
      videoDevices.forEach((device, index) => {
        console.log(`   设备${index + 1}: ${device.label || '未知设备'}`);
      });
      
      return videoDevices;
    } catch (error) {
      console.error('获取设备列表失败:', error);
      return [];
    }
  };

  // 检查权限状态
  const checkPermissionStatus = async (): Promise<void> => {
    if (!navigator.permissions) {
      console.log('浏览器不支持权限查询API');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log(`📷 [EnhancedWebCameraView] 当前权限状态: ${result.state}`);
      
      result.onchange = () => {
        console.log(`📷 [EnhancedWebCameraView] 权限状态变更: ${result.state}`);
        if (result.state === 'granted') {
          setHasPermission(true);
          setError(null);
        } else if (result.state === 'denied') {
          setHasPermission(false);
          setError({
            name: 'NotAllowedError',
            message: '摄像头权限被拒绝'
          });
        }
      };
    } catch (error) {
      console.log('权限查询失败:', error);
    }
  };

  // 防重复调用标志
  const isStartingRef = useRef(false);
  
  // 启动摄像头
  const startCamera = async (): Promise<void> => {
    // 防止重复调用
    if (isStartingRef.current) {
      console.log('⚠️ [EnhancedWebCameraView] startCamera已在执行中，跳过重复调用');
      return;
    }
    
    isStartingRef.current = true;
    console.log('🚀 [EnhancedWebCameraView] 开始启动摄像头流程');
    
    setIsLoading(true);
    setError(null);

    try {
      // 检查是否已有活跃的流
      if (streamRef.current && streamRef.current.active && videoRef.current?.srcObject) {
        console.log('✅ [EnhancedWebCameraView] 已有活跃的摄像头流，跳过重复获取');
        setIsLoading(false);
        isStartingRef.current = false;
        return;
      }
      
      // 环境检查
      const envCheck = checkEnvironment();
      if (!envCheck.isValid) {
        throw new Error(envCheck.error);
      }

      // 获取设备列表
      const availableDevices = await getAvailableDevices();
      setDevices(availableDevices);

      if (availableDevices.length === 0) {
        throw new Error('未检测到摄像头设备');
      }

      // 构建约束条件
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      // 设备选择
      if (availableDevices.length > 0) {
        const targetDevice = availableDevices[currentDeviceIndex] || availableDevices[0];
        if (targetDevice.deviceId) {
          (constraints.video as MediaTrackConstraints).deviceId = { exact: targetDevice.deviceId };
        } else {
          // 如果没有设备ID，使用facingMode
          (constraints.video as MediaTrackConstraints).facingMode = { ideal: facing === 'front' ? 'user' : 'environment' };
        }
      }

      console.log('📷 [EnhancedWebCameraView] 请求摄像头权限:', constraints);

      // 请求摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ [EnhancedWebCameraView] 摄像头权限获取成功', {
        streamId: stream.id,
        tracks: stream.getTracks().length,
        videoTracks: stream.getVideoTracks().length
      });
      
      // 停止之前的流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      streamRef.current = stream;
      setHasPermission(true);
      
      console.log('🔄 [EnhancedWebCameraView] 准备设置视频流，videoRef.current存在:', !!videoRef.current);
      console.log('🔄 [EnhancedWebCameraView] stream详情:', {
        streamId: stream.id,
        streamActive: stream.active,
        tracksCount: stream.getTracks().length,
        videoTracksCount: stream.getVideoTracks().length
      });
      
      // 设置视频流 - 使用更强健的方法  
      if (videoRef.current) {
        const video = videoRef.current;
        
        console.log('🎬 [EnhancedWebCameraView] 开始设置视频流到video元素');
        
        // 清理之前的事件监听器
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onplaying = null;
        video.onerror = null;
        
        // 强制设置视频属性
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.controls = false;
        
        // 通过setAttribute确保属性被正确设置
        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.removeAttribute('controls');
        
        // 添加错误处理
        video.onerror = (error) => {
          console.error('❌ [EnhancedWebCameraView] Video元素错误:', error);
        };
        
        // 关键：先设置事件监听器，再设置srcObject
        video.onloadedmetadata = () => {
          console.log(`📐 [EnhancedWebCameraView] loadedmetadata触发: ${video.videoWidth}x${video.videoHeight}, readyState=${video.readyState}`);
        };
        
        video.oncanplay = () => {
          console.log('▶️ [EnhancedWebCameraView] canplay事件触发，视频准备播放');
        };
        
        video.onplaying = () => {
          console.log('✅ [EnhancedWebCameraView] playing事件触发，视频正在播放');
        };
        
        video.onloadstart = () => {
          console.log('🔄 [EnhancedWebCameraView] loadstart事件触发');
        };
        
        video.onloadeddata = () => {
          console.log('📊 [EnhancedWebCameraView] loadeddata事件触发');
        };
        
        // 设置视频流源
        try {
          console.log('🔗 [EnhancedWebCameraView] 设置srcObject...');
          video.srcObject = stream;
          
          console.log('📋 [EnhancedWebCameraView] srcObject设置完成，当前状态:', {
            srcObject: video.srcObject ? 'MediaStream对象存在' : '空',
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          
          // 延迟播放避免中断冲突
          console.log('⏰ [EnhancedWebCameraView] 延迟500ms后播放，避免加载冲突');
          setTimeout(() => {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('▶️ [EnhancedWebCameraView] 延迟播放成功');
                })
                .catch((playErr) => {
                  console.error('❌ [EnhancedWebCameraView] 延迟播放失败:', playErr.message);
                  // 如果自动播放失败，可能需要用户交互
                  if (playErr.name === 'NotAllowedError') {
                    console.log('ℹ️ [EnhancedWebCameraView] 需要用户交互才能播放，这是正常的');
                  } else {
                    // 再次延迟重试
                    console.log('🔄 [EnhancedWebCameraView] 1秒后再次尝试播放');
                    setTimeout(() => {
                      video.play().then(() => {
                        console.log('✅ [EnhancedWebCameraView] 二次重试播放成功');
                      }).catch(e => {
                        console.log('⚠️ [EnhancedWebCameraView] 二次重试播放失败，可能需要用户交互:', e.message);
                      });
                    }, 1000);
                  }
                });
            }
          }, 500);
        } catch (srcError) {
          console.error('❌ [EnhancedWebCameraView] 设置srcObject失败:', srcError);
          throw srcError;
        }

        // 启动QR扫描（如果需要） - 更强力的初始化策略
        if (onBarcodeScanned) {
          console.log('🚀 [EnhancedWebCameraView] 准备启动QR扫描，使用多策略初始化');
          
          // 策略1: 立即尝试初始化（不等待）
          setTimeout(async () => {
            console.log('📊 [策略1] 立即尝试初始化QR扫描器');
            await initializeQRScanner();
          }, 500);
          
          // 策略2: 等待视频就绪后初始化
          const waitForVideoReady = () => {
            const video = videoRef.current;
            if (!video) return;
            
            if (video.readyState >= 3 && video.videoWidth > 0 && video.videoHeight > 0) {
              console.log('📊 [策略2] 视频已就绪，启动QR扫描');
              setTimeout(async () => {
                await initializeQRScanner();
              }, 500);
            } else {
              console.log('📊 [策略2] 等待视频就绪...', {
                readyState: video.readyState,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight
              });
              setTimeout(waitForVideoReady, 500);
            }
          };
          setTimeout(waitForVideoReady, 1500);
          
          // 策略3: 延迟5秒强制初始化
          setTimeout(async () => {
            console.log('📊 [策略3] 5秒延迟强制初始化QR扫描器');
            await initializeQRScanner();
          }, 5000);
          
          // 策略4: 持续重试机制
          let retryCount = 0;
          const retryInitialization = async () => {
            retryCount++;
            console.log(`📊 [策略4] 第${retryCount}次重试初始化QR扫描器`);
            
            if (retryCount <= 10 && !qrScannerRef.current) {
              await initializeQRScanner();
              setTimeout(retryInitialization, 2000);
            } else if (qrScannerRef.current) {
              console.log('✅ [策略4] QR扫描器初始化成功，停止重试');
            } else {
              console.log('❌ [策略4] 达到最大重试次数，停止重试');
            }
          };
          setTimeout(retryInitialization, 3000);
        }

        // 定期检查视频状态并尝试修复
        const checkVideoStatus = () => {
          const w = video.videoWidth;
          const h = video.videoHeight;
          const rs = video.readyState;
          
          console.log(`🔍 [EnhancedWebCameraView] 定期检查: ${w}x${h}, readyState=${rs}, paused=${video.paused}`);
          
          if (rs === 0 && video.srcObject) {
            console.warn('⚠️ [EnhancedWebCameraView] ReadyState为0但有srcObject，尝试重新播放');
            video.play().catch(e => console.log('重播失败:', e.message));
          }
          
          if ((!w || !h) && rs > 0) {
            console.warn('⚠️ [EnhancedWebCameraView] 有readyState但视频尺寸为0');
          }
        };
        
        // 2秒后开始定期检查，然后每5秒检查一次
        setTimeout(checkVideoStatus, 2000);
        const statusInterval = setInterval(checkVideoStatus, 5000);
        
        // 清理定时器
        setTimeout(() => clearInterval(statusInterval), 30000); // 30秒后停止检查
      } else {
        console.error('❌ [EnhancedWebCameraView] CRITICAL ERROR: videoRef.current为null，无法设置摄像头流');
        console.log('🔧 [EnhancedWebCameraView] 调试信息:', {
          streamExists: !!stream,
          streamId: stream?.id,
          componentMounted: true,
          videoRefType: typeof videoRef.current,
          timestamp: new Date().toISOString()
        });
        
        // 尝试延迟重试
        console.log('🔧 [EnhancedWebCameraView] 尝试延迟重试设置video流...');
        setTimeout(() => {
          console.log('🔧 [EnhancedWebCameraView] 延迟重试，videoRef.current现在存在:', !!videoRef.current);
          if (videoRef.current && stream && stream.active) {
            console.log('🔧 [EnhancedWebCameraView] 延迟重试设置srcObject');
            const video = videoRef.current;
            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.play().then(() => {
              console.log('✅ [EnhancedWebCameraView] 延迟重试播放成功!');
            }).catch(err => {
              console.error('❌ [EnhancedWebCameraView] 延迟重试播放失败:', err);
            });
          } else {
            console.error('❌ [EnhancedWebCameraView] 延迟重试仍然失败，videoRef或stream不可用');
          }
        }, 1000);
        
        // 再次延迟重试
        setTimeout(() => {
          console.log('🔧 [EnhancedWebCameraView] 第二次延迟重试，videoRef.current存在:', !!videoRef.current);
          if (videoRef.current && stream && stream.active) {
            console.log('🔧 [EnhancedWebCameraView] 第二次重试设置srcObject');
            const video = videoRef.current;
            video.srcObject = stream;
            video.muted = true;
            video.autoplay = true;
            video.play().catch(err => console.log('第二次重试播放结果:', err?.message || '成功'));
          }
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('📷 [EnhancedWebCameraView] 摄像头启动失败:', error);
      
      const cameraError: CameraError = {
        name: error.name || 'UnknownError',
        message: error.message || '未知错误',
        code: error.code
      };
      
      setError(cameraError);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
      isStartingRef.current = false;
      console.log('🏁 [EnhancedWebCameraView] startCamera流程完成');
    }
  };

  // 停止摄像头
  const stopCamera = (): void => {
    console.log('📷 [EnhancedWebCameraView] 停止摄像头');
    
    // 停止QR扫描
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    // 停止视频流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // 清空视频元素
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setHasPermission(null);
  };

  // 切换摄像头
  const switchCamera = async (): Promise<void> => {
    if (devices.length <= 1) {
      console.log('只有一个摄像头设备，无法切换');
      return;
    }
    
    const nextIndex = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(nextIndex);
    
    // 重启摄像头使用新设备
    await startCamera();
  };

  // 拍照
  const takePicture = async (): Promise<string | null> => {
    if (!videoRef.current || !streamRef.current) {
      throw new Error('摄像头未启动');
    }

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法创建Canvas上下文');
      
      ctx.drawImage(video, 0, 0);
      
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('拍照失败:', error);
      return null;
    }
  };

  // 动态加载QR Scanner库
  const loadQRScannerLibrary = async (): Promise<boolean> => {
    if ((globalThis as any).QrScanner) {
      return true;
    }

    return new Promise((resolve) => {
      console.log('🔄 [EnhancedWebCameraView] 动态加载QR Scanner库...');
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.umd.min.js';
      script.onload = () => {
        console.log('✅ [EnhancedWebCameraView] QR Scanner库加载成功');
        // 设置worker路径
        if ((globalThis as any).QrScanner) {
          (globalThis as any).QrScanner.WORKER_PATH = 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner-worker.min.js';
        }
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ [EnhancedWebCameraView] QR Scanner库加载失败');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  // 初始化QR扫描器 - 改进版本
  const initializeQRScanner = async (): Promise<void> => {
    if (!onBarcodeScanned || !videoRef.current) {
      console.log('⏭️ [EnhancedWebCameraView] 跳过QR扫描器初始化：缺少必要条件');
      return;
    }

    // 防止重复初始化
    if (qrScannerRef.current) {
      console.log('⏭️ [EnhancedWebCameraView] QR扫描器已存在，跳过重复初始化');
      return;
    }

    try {
      console.log('🚀 [EnhancedWebCameraView] 开始初始化QR扫描器');
      
      // 确保库已加载
      const libraryLoaded = await loadQRScannerLibrary();
      if (!libraryLoaded) {
        console.error('❌ [EnhancedWebCameraView] QR Scanner库加载失败，无法启动扫描');
        return;
      }

      const QrScanner = (globalThis as any).QrScanner;
      if (!QrScanner) {
        console.error('❌ [EnhancedWebCameraView] QrScanner依然不可用');
        return;
      }

      const video = videoRef.current;
      console.log('📹 [EnhancedWebCameraView] 创建QR扫描器实例，video元素状态:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        srcObject: !!video.srcObject
      });

      // 即使视频还没完全就绪也尝试创建扫描器
      const scanner = new QrScanner(
        video,
        (result: { data: string }) => {
          console.log('🎯 [QR扫描] 检测到二维码:', result.data);
          
          // 触觉反馈
          if (Platform.OS === 'web' && 'vibrate' in navigator) {
            navigator.vibrate(100);
          }
          
          onBarcodeScanned({
            type: 'qr',
            data: result.data
          });
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: false,
          maxScansPerSecond: 5,
          preferredCamera: 'environment', // 优先使用后置摄像头
        }
      );

      qrScannerRef.current = scanner;
      
      // 启动扫描器
      await scanner.start();
      console.log('✅ [QR扫描] QR扫描器启动成功');
      
      // 额外检查：确保扫描器真的在工作
      setTimeout(() => {
        if (qrScannerRef.current) {
          console.log('🔍 [QR扫描] 扫描器状态检查: 正在运行');
        } else {
          console.warn('⚠️ [QR扫描] 扫描器状态检查: 未找到运行中的扫描器');
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ [EnhancedWebCameraView] QR扫描器启动失败:', {
        error: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // 清理失败的扫描器引用
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.destroy();
        } catch (e) {
          console.log('清理失败的扫描器时出错:', e);
        }
        qrScannerRef.current = null;
      }
    }
  };

  // 获取错误指导信息
  const getErrorGuidance = (error: CameraError): string => {
    switch (error.name) {
      case 'NotAllowedError':
        return '请点击浏览器地址栏的🔒图标，选择"允许"摄像头访问';
      case 'NotFoundError':
        return '未检测到摄像头设备，请检查设备连接';
      case 'OverconstrainedError':
        return '摄像头不支持当前设置，请尝试切换摄像头';
      case 'NotReadableError':
        return '摄像头被其他应用占用，请关闭其他应用后重试';
      case 'AbortError':
        return '摄像头访问被中断，请重新尝试';
      case 'TypeError':
        return '浏览器不支持摄像头功能，请使用Chrome、Safari等现代浏览器';
      default:
        return error.message || '摄像头访问失败，请检查浏览器设置';
    }
  };

  // 组件挂载时检查权限
  useEffect(() => {
    checkPermissionStatus();
    return () => {
      stopCamera();
    };
  }, []);

  // 挂载后自动尝试启动摄像头（Web 环境）
  useEffect(() => {
    if (Platform.OS === 'web') {
      // 延迟启动确保组件完全挂载
      const startTimeout = setTimeout(() => {
        startCamera().catch((error) => {
          console.error('自动启动摄像头失败:', error);
        });
      }, 500);
      
      return () => clearTimeout(startTimeout);
    }
  }, []);

  // 渲染错误状态
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Ionicons name="camera-off" size={64} color={theme.colors.text.disabled} />
        <Text style={styles.errorTitle}>摄像头访问失败</Text>
        <Text style={styles.errorMessage}>{getErrorGuidance(error)}</Text>
        
        <View style={styles.errorActions}>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={startCamera}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.text.inverse} />
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
          
          {devices.length > 1 && (
            <TouchableOpacity 
              style={styles.switchButton}
              onPress={switchCamera}
            >
              <Ionicons name="camera-reverse" size={20} color={theme.colors.primary} />
              <Text style={styles.switchButtonText}>切换摄像头</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // 渲染加载状态
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <Ionicons name="camera" size={64} color={theme.colors.primary} />
        <Text style={styles.loadingText}>正在启动摄像头...</Text>
      </View>
    );
  }

  // 渲染权限请求状态
  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.permissionContainer, style]}>
        <Ionicons name="camera-outline" size={64} color={theme.colors.text.disabled} />
        <Text style={styles.permissionTitle}>需要摄像头权限</Text>
        <Text style={styles.permissionMessage}>
          请允许访问摄像头以使用扫码功能
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={startCamera}
        >
          <Text style={styles.permissionButtonText}>授权摄像头访问</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 渲染摄像头视图
  return (
    <View style={[styles.container, style]}>
      <video
        ref={(ref) => {
          console.log('🔧 [EnhancedWebCameraView] video元素ref回调执行:', {
            refExists: !!ref,
            previousRef: !!videoRef.current,
            timestamp: new Date().toISOString()
          });
          videoRef.current = ref;
          
          // 如果video元素创建了但还没有摄像头，立即尝试启动
          if (ref && !streamRef.current && hasPermission !== false && !isStartingRef.current) {
            console.log('🔧 [EnhancedWebCameraView] video元素创建完成，立即启动摄像头');
            setTimeout(() => {
              startCamera().catch(error => {
                console.error('❌ [EnhancedWebCameraView] ref回调启动摄像头失败:', error);
              });
            }, 100);
          }
        }}
        style={styles.video}
        autoPlay
        playsInline
        muted
        onError={(e) => {
          console.error('❌ [EnhancedWebCameraView] Video元素错误事件:', e);
        }}
        onLoadStart={() => {
          console.log('🔧 [EnhancedWebCameraView] Video loadStart事件');
        }}
        onLoadedMetadata={(e) => {
          console.log('📐 [EnhancedWebCameraView] Video loadedMetadata事件:', {
            videoWidth: e.currentTarget.videoWidth,
            videoHeight: e.currentTarget.videoHeight
          });
        }}
        onCanPlay={() => {
          console.log('▶️ [EnhancedWebCameraView] Video canPlay事件');
        }}
        onPlaying={() => {
          console.log('✅ [EnhancedWebCameraView] Video playing事件');
        }}
      />
      
      {/* 控制按钮 - 移到左下角以避免与QR扫描器的右上角按钮冲突 */}
      {hasPermission && devices.length > 1 && (
        <TouchableOpacity 
          style={styles.switchCameraButtonBottomLeft}
          onPress={switchCamera}
        >
          <Ionicons name="camera-reverse" size={20} color={theme.colors.text.inverse} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as any,
    backgroundColor: '#000000',
    position: 'relative' as any,
    zIndex: 1,
    // React Native Web 兼容性修复
    WebkitTransform: 'translateZ(0)', // 启用硬件加速
    transform: 'translateZ(0)' as any,
  },
  errorContainer: {
    backgroundColor: theme.colors.background.secondary,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
  switchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  switchButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  permissionContainer: {
    backgroundColor: theme.colors.background.secondary,
    padding: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchCameraButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchCameraButtonBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});



