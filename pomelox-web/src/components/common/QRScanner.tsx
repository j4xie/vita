'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onResult: (result: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  preferredCamera?: 'front' | 'back';
  maxScansPerSecond?: number;
  highlightScanRegion?: boolean;
  highlightCodeOutline?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onResult,
  onError,
  className = '',
  preferredCamera = 'back',
  maxScansPerSecond = 25,
  highlightScanRegion = true,
  highlightCodeOutline = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 处理扫描结果
  const handleScanResult = useCallback((result: QrScanner.ScanResult) => {
    console.log('QR扫描结果:', result.data);
    onResult(result.data);
  }, [onResult]);

  // 处理扫描错误
  const handleScanError = useCallback((error: Error) => {
    console.error('QR扫描错误:', error);
    setError(error.message);
    onError?.(error);
  }, [onError]);

  // 初始化扫描器
  useEffect(() => {
    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        // 检查是否支持摄像头
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          throw new Error('No camera found');
        }

        // 创建QR扫描器实例
        const qrScanner = new QrScanner(
          videoRef.current,
          handleScanResult,
          {
            onDecodeError: (error: string | Error) => {
              // 解码错误通常是正常的（当没有QR码时）
              // 只有严重错误才需要处理
              const errorMessage = typeof error === 'string' ? error : error.message;
              if (errorMessage.includes('No QR code found')) {
                return; // 忽略未找到QR码的错误
              }
              const errorObj = typeof error === 'string' ? new Error(error) : error;
              handleScanError(errorObj);
            },
            maxScansPerSecond,
            highlightScanRegion,
            highlightCodeOutline,
            preferredCamera: preferredCamera === 'front' ? 'user' : 'environment',
          }
        );

        qrScannerRef.current = qrScanner;
        setHasPermission(true);
        
      } catch (error: any) {
        console.error('初始化QR扫描器失败:', error);
        setError(error.message);
        setHasPermission(false);
      }
    };

    initScanner();

    // 清理函数
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [handleScanResult, handleScanError, preferredCamera, maxScansPerSecond, highlightScanRegion, highlightCodeOutline]);

  // 开始扫描
  const startScanning = useCallback(async () => {
    if (!qrScannerRef.current) return;

    try {
      await qrScannerRef.current.start();
      setIsScanning(true);
      setError(null);
    } catch (error: any) {
      console.error('启动扫描失败:', error);
      setError(error.message);
      setHasPermission(false);
    }
  }, []);

  // 停止扫描
  const stopScanning = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsScanning(false);
    }
  }, []);

  // 切换摄像头
  const switchCamera = useCallback(async () => {
    if (!qrScannerRef.current) return;

    try {
      const cameras = await QrScanner.listCameras(true);
      if (cameras.length > 1) {
        // 简单切换到下一个摄像头
        await qrScannerRef.current.setCamera(cameras[1].id);
      }
    } catch (error: any) {
      console.error('切换摄像头失败:', error);
      setError(error.message);
    }
  }, []);

  // 自动开始扫描
  useEffect(() => {
    if (hasPermission && qrScannerRef.current && !isScanning) {
      startScanning();
    }
  }, [hasPermission, startScanning, isScanning]);

  // 权限请求状态
  if (hasPermission === null) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-gray-600">初始化摄像头...</p>
        </div>
      </div>
    );
  }

  // 权限被拒绝或有错误
  if (hasPermission === false || error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">无法访问摄像头</h3>
          <p className="text-gray-600 mb-4">{error || '请允许访问摄像头以使用扫码功能'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            重新尝试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg"
        style={{ transform: 'scaleX(-1)' }} // 镜像翻转，使体验更自然
      />
      
      {/* 扫描状态指示器 */}
      {isScanning && (
        <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-sm font-medium">
          扫描中...
        </div>
      )}
      
      {/* 控制按钮 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        <button
          onClick={isScanning ? stopScanning : startScanning}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isScanning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-primary-500 hover:bg-primary-600 text-white'
          }`}
        >
          {isScanning ? '停止扫描' : '开始扫描'}
        </button>
        
        <button
          onClick={switchCamera}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          title="切换摄像头"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      {/* 扫描区域指示 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-4 border-2 border-white border-opacity-50 rounded-lg">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500"></div>
        </div>
      </div>
    </div>
  );
};