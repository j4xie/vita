/**
 * 设备检测工具 - Web端专用
 * 检测iOS设备和浏览器类型，用于显示App下载提示
 */

export interface DeviceInfo {
  isIOS: boolean;
  isSafari: boolean;
  isMobile: boolean;
  shouldShowAppBanner: boolean;
  deviceType: 'iPhone' | 'iPad' | 'iPod' | 'Android' | 'Desktop' | 'Unknown';
  browserType: 'Safari' | 'Chrome' | 'Firefox' | 'Edge' | 'Unknown';
}

/**
 * 检测当前设备和浏览器信息
 */
export const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';

  // iOS设备检测 - 支持iOS 13+的新UA
  const isIOS = (
    /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
  ) || (
    // iOS 13+ iPad可能显示为Mac
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  );

  // 具体设备类型
  let deviceType: DeviceInfo['deviceType'] = 'Unknown';
  if (/iPhone/.test(userAgent)) {
    deviceType = 'iPhone';
  } else if (/iPad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    deviceType = 'iPad';
  } else if (/iPod/.test(userAgent)) {
    deviceType = 'iPod';
  } else if (/Android/.test(userAgent)) {
    deviceType = 'Android';
  } else if (!/Mobi|Android/i.test(userAgent)) {
    deviceType = 'Desktop';
  }

  // 浏览器检测
  let browserType: DeviceInfo['browserType'] = 'Unknown';
  if (/Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|Edge/.test(userAgent)) {
    browserType = 'Safari';
  } else if (/Chrome|CriOS/.test(userAgent)) {
    browserType = 'Chrome';
  } else if (/Firefox|FxiOS/.test(userAgent)) {
    browserType = 'Firefox';
  } else if (/Edge/.test(userAgent)) {
    browserType = 'Edge';
  }

  // 移动端检测
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return {
    isIOS,
    isSafari: browserType === 'Safari',
    isMobile,
    shouldShowAppBanner: isIOS, // 只在iOS设备显示App下载提示
    deviceType,
    browserType,
  };
};

/**
 * 获取视口高度 - 适配iOS Safari地址栏变化
 */
export const useViewportHeight = (): number => {
  if (typeof window === 'undefined') return 0;

  // 优先使用visualViewport (iOS Safari专用)
  if (window.visualViewport) {
    return window.visualViewport.height;
  }

  // 降级方案
  return window.innerHeight;
};

/**
 * 监听视口高度变化 - 适配Safari地址栏隐藏/显示
 */
export const createViewportListener = (callback: (height: number) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleResize = () => {
    const height = useViewportHeight();
    callback(height);
  };

  // iOS Safari专用监听器
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  }

  // 通用监听器（降级方案）
  window.addEventListener('resize', handleResize);

  // 返回清理函数
  return () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleResize);
    }
    window.removeEventListener('resize', handleResize);
  };
};

/**
 * 检测是否应该隐藏浮动按钮的页面/状态
 */
export const shouldHideFloatingButton = (currentRoute: string, modalVisible: boolean = false): boolean => {
  // 1. 扫码相关页面
  const QR_SCANNER_ROUTES = [
    'QRScanner',           // 主扫码页面
    'QRScanResult',        // 扫码结果页面
  ];

  // 2. 全屏模态页面
  const FULLSCREEN_MODALS = [
    'ActivityRegistrationForm', // 活动报名表单
    'UserIdentityQRModal',      // 用户身份二维码
    'ScannedUserModal',         // 扫码用户信息
    'ScannedUserInfoModal',     // 扫码用户详情
    'ActivitySelectionModal',   // 活动选择模态框
    'VolunteerQuickActionModal',// 志愿者快速操作
  ];

  // 3. 特殊页面
  const SPECIAL_ROUTES = [
    'Login',                    // 登录页面
    'RegisterChoice',           // 注册选择
    'ForgotPassword',           // 忘记密码
    'SetNewPassword',           // 设置新密码
    'Verification',             // 验证页面
  ];

  return (
    QR_SCANNER_ROUTES.includes(currentRoute) ||
    FULLSCREEN_MODALS.includes(currentRoute) ||
    SPECIAL_ROUTES.includes(currentRoute) ||
    modalVisible // 任何模态框打开时都隐藏
  );
};

/**
 * 调试用：打印设备信息
 */
export const logDeviceInfo = () => {
  const device = detectDevice();
  console.log('📱 设备检测结果:', {
    ...device,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    visualViewport: !!window.visualViewport,
  });
};