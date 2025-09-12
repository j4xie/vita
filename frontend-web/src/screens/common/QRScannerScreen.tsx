import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { WebCameraView } from '../../components/web/WebCameraView';
import { EnhancedWebCameraView } from '../../components/web/EnhancedWebCameraView';
import { SimpleQRScanner } from '../../components/web/SimpleQRScanner';
import { NativeQRScanner } from '../../components/web/NativeQRScanner';
import { ReferralCodeInputSheet } from '../../components/sheets/ReferralCodeInputSheet';
import { ScanFeedbackOverlay, QRCodeBounds } from '../../components/common/ScanFeedbackOverlay';
import { ScannedUserInfoModal } from '../../components/modals/ScannedUserInfoModal';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';

import { theme } from '../../theme';
import { useOrganization } from '../../context/OrganizationContext';
import { validateInvitationCode } from '../../services/registrationAPI';
import { SafeAlert } from '../../utils/SafeAlert';
import { membershipCardService } from '../../services/MembershipCardService';
import { MerchantQRScanResult, ParsedMerchantQR } from '../../types/cards';
import { Organization } from '../../types/organization';
import { UserIdentityData, ParsedUserQRCode } from '../../types/userIdentity';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { extractActivityIdFromHash, isActivityHash } from '../../utils/hashActivityDecoder';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const scanAreaSize = screenWidth * 0.7;

export const QRScannerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const purpose = route.params?.purpose || 'scan'; // 'register' | 'verify' | 'scan' | 'membership_card' | 'user_identity' | 'activity_signin'
  const returnScreen = route.params?.returnScreen;
  const activity = route.params?.activity; // 活动信息
  const callbackId = route.params?.callbackId; // 回调函数标识符
  
  // 获取注册的回调函数 - Web端兼容性修复
  const getRegisteredCallback = (type: 'onScanSuccess' | 'onScanError') => {
    try {
      const parentNavigator = (navigation as any).getParent?.();
      if (!parentNavigator) return null;
      
      const state = parentNavigator.getState?.();
      if (!state || typeof state !== 'object') return null;
      
      const callbacks = state.qrScannerCallbacks;
      if (!callbacks || typeof callbacks !== 'object') return null;
      
      return callbacks[callbackId]?.[type] || null;
    } catch (error) {
      console.warn('⚠️ [QRScanner Web] 获取回调函数失败:', error);
      return null;
    }
  };
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [showReferralInputSheet, setShowReferralInputSheet] = useState(false);
  
  // 扫码反馈状态
  const [showScanFeedback, setShowScanFeedback] = useState(false);
  const [qrCodeBounds, setQRCodeBounds] = useState<QRCodeBounds | undefined>();
  
  // 用户相关状态
  const { user } = useUser();
  
  // 组织相关状态
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization,
    hasOrganizationAccess,
    addMembershipCard 
  } = useOrganization();
  
  // 商家会员卡扫描相关状态
  const [showOrganizationSwitchModal, setShowOrganizationSwitchModal] = useState(false);
  const [scanResult, setScanResult] = useState<MerchantQRScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 用户身份码扫描相关状态
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [scannedUserData, setScannedUserData] = useState<UserIdentityData | null>(null);
  
  // 活动签到成功弹窗状态
  const [showCheckInSuccessModal, setShowCheckInSuccessModal] = useState(false);
  const [checkInModalData, setCheckInModalData] = useState({ title: '', message: '' });

  // 用于保存扫描数据的ref
  const scannedDataRef = useRef<string>('');

  const handleBarCodeScanned = ({ type, data, bounds }: { type: string; data: string; bounds?: any }) => {
    console.log('🔎 [QRScanner Web] handleBarCodeScanned 被调用:', {
      type, 
      data: data?.substring(0, 50), 
      bounds,
      currentState: { scanned, isProcessing }
    });
    
    if (scanned || isProcessing) {
      console.log('⏭️ [QRScanner Web] 跳过处理，状态:', { scanned, isProcessing });
      return;
    }
    
    console.log('✅ [QRScanner Web] 开始处理扫码结果');
    
    // 保存扫描数据
    scannedDataRef.current = data;
    console.log('💾 [QRScanner Web] 保存扫描数据到ref');
    
    // 设置扫码状态和二维码位置
    setScanned(true);
    console.log('🔒 [QRScanner Web] 设置scanned状态为true');
    
    // 如果有边界信息，保存用于定位圆圈
    if (bounds) {
      setQRCodeBounds({
        origin: { x: bounds.origin.x, y: bounds.origin.y },
        size: { width: bounds.size.width, height: bounds.size.height }
      });
      console.log('📍 [QRScanner Web] 设置QR码边界信息');
    }
    
    // 显示扫码反馈动画
    setShowScanFeedback(true);
    console.log('🎬 [QRScanner Web] 显示扫码反馈动画');
    
    // Web端触觉反馈（在ScanFeedbackOverlay中处理）
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // 直接延迟调用处理函数，不依赖动画回调
    console.log('⚡ [QRScanner Web] 设置直接处理定时器');
    setTimeout(() => {
      console.log('⏰ [QRScanner Web] 直接处理定时器触发');
      handleScanFeedbackComplete();
    }, 1000);
  };

  // 处理签到成功弹窗关闭
  const handleCheckInSuccessModalClose = () => {
    setShowCheckInSuccessModal(false);
    
    console.log('📍 [QR签到] 用户点击确定，准备导航');
    if (returnScreen) {
      console.log('🔄 [QR签到] 导航到指定页面:', returnScreen);
      navigation.navigate(returnScreen);
    } else {
      console.log('🔙 [QR签到] 返回上一页');
      navigation.goBack();
    }
  };

  // 扫码反馈动画完成后处理扫描结果
  const handleScanFeedbackComplete = () => {
    console.log('🎬 [QRScanner] handleScanFeedbackComplete 被调用');
    setShowScanFeedback(false);
    
    // 获取最后扫描的数据
    const lastScannedData = scannedDataRef.current;
    console.log('📋 [QRScanner] 扫描数据检查:', {
      hasData: !!lastScannedData,
      dataLength: lastScannedData?.length,
      purpose,
      states: { scanned, isProcessing }
    });
    
    if (!lastScannedData) {
      console.warn('⚠️ [QRScanner Web] 扫码数据丢失，重置状态');
      setScanned(false);
      setIsProcessing(false);
      return;
    }
    
    console.log('✅ [QRScanner Web] 开始处理扫码结果:', lastScannedData.substring(0, 50));
    console.log('🎯 [QRScanner] 处理purpose:', purpose);
    
    // 设置处理状态
    setIsProcessing(true);
    
    // 根据不同用途处理扫描结果
    try {
      switch (purpose) {
        case 'register':
          console.log('📝 [QRScanner] 处理注册码');
          handleRegisterCode(lastScannedData);
          break;
        case 'verify':
          console.log('✅ [QRScanner] 处理验证码');
          handleVerifyCode(lastScannedData);
          break;
        case 'membership_card':
          console.log('💳 [QRScanner] 处理会员卡');
          handleMembershipCardScan(lastScannedData);
          break;
        case 'user_identity':
          console.log('🆔 [QRScanner] 处理用户身份码');
          handleUserIdentityScan(lastScannedData);
          break;
        case 'activity_signin':
          console.log('🏃 [QRScanner] 处理活动签到');
          handleActivitySignInScan(lastScannedData);
          break;
        default:
          console.log('🔍 [QRScanner] 处理通用扫描');
          handleGeneralScan(lastScannedData);
      }
    } catch (error) {
      console.error('❌ [QRScanner] 处理扫描结果异常:', error);
      setScanned(false);
      setIsProcessing(false);
    }
  };

  const handleRegisterCode = async (code: string) => {
    // 验证推荐码格式 - 支持两种格式
    let referralCode = '';
    
    if (code.startsWith('VG_REF_')) {
      referralCode = code.replace('VG_REF_', '');
    } else if (/^[A-Z0-9]{8}$/.test(code)) {
      // 直接的8位推荐码，如 2G7KKG49
      referralCode = code;
    }
    
    if (referralCode) {
      // 验证邀请码有效性
      try {
        console.log('🔍 开始验证邀请码:', referralCode);
        const validation = await validateInvitationCode(referralCode);
        console.log('📋 邀请码验证结果:', validation);
        
        if (validation.valid) {
          // 显示邀请码信息
          const inviterInfo = validation.data?.inviterName 
            ? `\n推荐人：${validation.data.inviterName}`
            : '';
          const orgInfo = validation.data?.organizationName 
            ? `\n组织：${validation.data.organizationName}`
            : '';
            
          SafeAlert.alert(
            t('qr.results.referral_success_title'),
            t('qr.results.referral_success_message', { referralCode }) + inviterInfo + orgInfo,
            [
              {
                text: t('qr.results.continue_register'),
                onPress: () => {
                  // 跳转到新的注册流程，并标记为邀请码注册
                  navigation.navigate('IdentityChoice', { 
                    referralCode,
                    hasReferralCode: true,
                    registrationType: 'invitation', // 标记为邀请码注册
                    invitationData: validation.data // 传递邀请码详细信息
                  });
                },
              },
            ]
          );
        } else {
          SafeAlert.alert(
            t('qr.results.invalid_referral_title'),
            validation.message || t('qr.results.invalid_referral_message'),
            [
              {
                text: t('qr.results.rescan'),
                onPress: () => setScanned(false),
              },
              {
                text: t('qr.results.back'),
                onPress: () => navigation.goBack(),
              },
            ]
          );
        }
      } catch (error) {
        console.error('❌ 验证邀请码失败:', error);
        console.log('📞 API调用异常，使用备用逻辑');
        // 如果验证接口有问题，仍然允许继续注册
        SafeAlert.alert(
          t('qr.results.referral_success_title'),
          t('qr.results.referral_success_message', { referralCode }) + '\n（验证服务暂不可用）',
          [
            {
              text: t('qr.results.continue_register'),
              onPress: () => {
                navigation.navigate('IdentityChoice', { 
                  referralCode,
                  hasReferralCode: true,
                  registrationType: 'invitation'
                });
              },
            },
          ]
        );
      }
    } else {
      console.log(
        t('qr.results.invalid_referral_title'),
        t('qr.results.invalid_referral_message'),
        [
          {
            text: t('qr.results.rescan'),
            onPress: () => setScanned(false),
          },
          {
            text: t('qr.results.back'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleVerifyCode = (code: string) => {
    // 处理活动核销二维码
    if (code.startsWith('VG_EVENT_')) {
      console.log(
        t('qr.results.checkin_success_title'),
        t('qr.results.checkin_success_message'),
        [
          {
            text: t('qr.results.confirm'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      console.log(
        t('qr.results.invalid_qr_title'),
        t('qr.results.invalid_qr_message'),
        [
          {
            text: t('qr.results.rescan'),
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const handleActivitySignInScan = async (qrData: string) => {
    // 如果有注册的回调函数，使用回调
    const onScanSuccess = getRegisteredCallback('onScanSuccess');
    const onScanError = getRegisteredCallback('onScanError');
    
    if (onScanSuccess) {
      try {
        // 验证扫码数据的有效性
        const activityId = parseActivityQRCode(qrData);
        if (!activityId) {
          if (onScanError) {
            onScanError('无效的活动二维码');
          } else {
            showScanError(
              t('qr.results.invalid_qr_title'),
              t('qr.results.invalid_activity_qr_message')
            );
          }
          return;
        }

        // 调用成功回调
        await onScanSuccess(qrData);
      } catch (error) {
        if (onScanError) {
          onScanError('扫码处理失败');
        } else {
          showScanError('扫码失败', '处理扫码结果时出错');
        }
      }
      return;
    }

    // 原有的独立签到逻辑（保持兼容性）
    if (!user?.id) {
      console.log(
        t('qr.results.signin_failed_title'),
        t('auth.errors.not_logged_in'),
        [
          {
            text: t('common.confirm'),
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }

    try {
      // 解析活动二维码，提取活动ID
      const activityId = parseActivityQRCode(qrData);
      
      if (!activityId) {
        console.log('❌ [活动签到] 无法解析活动ID，可能是哈希格式');
        
        // 如果是32位哈希，尝试特殊处理
        if (/^[a-f0-9]{32}$/.test(qrData)) {
          console.log('🔐 [活动签到] 检测到32位哈希，显示特殊提示');
          showScanError(
            '活动码格式不支持',
            `检测到活动相关哈希码：${qrData}\n\n当前不支持此格式的活动码。请联系管理员获取标准格式的活动签到码。`
          );
        } else {
          showScanError(
            t('qr.results.invalid_qr_title'),
            `无法识别的活动码格式：${qrData.substring(0, 50)}\n\n请扫描标准格式的活动签到码。`
          );
        }
        return;
      }

      // 检查用户报名状态
      const signInfo = await pomeloXAPI.getSignInfo(activityId, parseInt(user.userId));
      
      if (signInfo.code === 200) {
        switch (signInfo.data) {
          case 0:
            // 未报名，跳转到活动详情页面
            console.log(
              t('qr.results.not_registered_title'),
              t('qr.results.not_registered_message'),
              [
                {
                  text: t('activities.registration.register_now'),
                  onPress: () => {
                    // 获取活动信息并跳转，传递来源信息
                    const fromProfile = returnScreen?.includes('Profile') || returnScreen?.includes('profile');
                    navigation.navigate('ActivityDetail', { 
                      activity: { id: activityId.toString() },
                      fromProfile,
                      returnScreen
                    });
                  },
                },
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                  onPress: () => setScanned(false),
                },
              ]
            );
            break;
            
          case -1:
            // 已报名未签到，执行签到
            await performSignIn(activityId);
            break;
            
          case 1:
            // 已签到
            console.log(
              t('qr.results.already_signed_in_title'),
              t('qr.results.already_signed_in_message'),
              [
                {
                  text: t('common.confirm'),
                  onPress: () => setScanned(false),
                },
              ]
            );
            break;
            
          default:
            showScanError(
              t('qr.results.signin_failed_title'),
              t('qr.results.unknown_status_message')
            );
        }
      } else {
        showScanError(
          t('qr.results.signin_failed_title'),
          signInfo.msg || t('qr.results.check_status_failed')
        );
      }
    } catch (error) {
      console.error('Activity sign-in scan error:', error);
      showScanError(
        t('qr.results.signin_failed_title'),
        t('common.network_error')
      );
    }
  };

  const parseActivityQRCode = (qrData: string): number | null => {
    try {
      console.log('🔍 [活动码解析] 开始解析活动QR码:', qrData.substring(0, 50));
      
      // 标准活动二维码格式: VG_ACTIVITY_{activityId} 或包含JSON的base64
      if (qrData.startsWith('VG_ACTIVITY_')) {
        console.log('📝 [活动码解析] 标准VG_ACTIVITY_格式');
        const data = qrData.replace('VG_ACTIVITY_', '');
        // 尝试解析为JSON
        try {
          const activityData = JSON.parse(atob(data));
          console.log('✅ [活动码解析] JSON解析成功，活动ID:', activityData.activityId);
          return activityData.activityId;
        } catch (error) {
          // 如果不是JSON，可能直接是活动ID
          const id = parseInt(data);
          console.log('📊 [活动码解析] 直接数字解析，活动ID:', id);
          return isNaN(id) ? null : id;
        }
      }
      
      // 纯数字ID
      if (/^\d+$/.test(qrData)) {
        const directId = parseInt(qrData);
        console.log('🔢 [活动码解析] 纯数字ID:', directId);
        return directId;
      }
      
      // 32位哈希（直接提取活动ID）
      if (isActivityHash(qrData)) {
        console.log('🔐 [活动码解析] 检测到哈希格式，直接提取活动ID');
        const extractResult = extractActivityIdFromHash(qrData);
        
        if (extractResult.success && extractResult.activityId) {
          console.log('✅ [活动码解析] 活动ID提取成功:', {
            activityId: extractResult.activityId,
            method: extractResult.method
          });
          return extractResult.activityId;
        } else {
          console.log('❌ [活动码解析] 无法从哈希中提取有效活动ID');
          return null;
        }
      }
      
      console.log('❌ [活动码解析] 无法识别的格式');
      return null;
    } catch (error) {
      console.error('❌ [活动码解析] 解析异常:', error);
      return null;
    }
  };

  const performSignIn = async (activityId: number) => {
    // 🔒 防重复提交保护
    if (isProcessing) {
      console.log('⏭️ [QR签到] 正在处理中，跳过重复请求');
      return;
    }
    
    setIsProcessing(true);
    console.log('🔄 [QR签到] 开始执行签到操作');
    
    try {
      const result = await pomeloXAPI.signInActivity(activityId, parseInt(user?.id || '0'));
      
      if (result.code === 200) {
        // 签到成功 - 增强反馈和状态广播
        console.log('✅ [QR签到] 活动签到成功:', {
          activityId,
          userId: user?.id,
          result,
          timestamp: new Date().toISOString()
        });
        
        // 触觉反馈
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // 🚀 重要：广播签到成功事件，更新所有相关UI组件
        DeviceEventEmitter.emit('activitySignedIn', { 
          activityId: activityId.toString(),
          userId: user?.id,
          timestamp: new Date().toISOString()
        });
        
        // 广播给活动列表和详情页面
        DeviceEventEmitter.emit('activityStatusChanged', {
          activityId: activityId.toString(),
          newStatus: 'checked_in',
          userId: user?.id
        });
        
        // 重置处理状态，确保弹窗能正常显示
        setIsProcessing(false);
        setShowScanFeedback(false);
        
        console.log('🎉 [QR签到] 准备显示签到成功提示');
        
        // 统一使用LiquidSuccessModal显示签到成功
        console.log('💬 [QR签到] 显示签到成功弹窗');
        
        setCheckInModalData({
          title: t('qr.results.signin_success_title') || '签到成功',
          message: t('qr.results.signin_success_message') || '您已成功签到该活动！'
        });
        setShowCheckInSuccessModal(true);
        
      } else {
        console.warn('⚠️ [QR签到] 签到失败:', {
          activityId,
          code: result.code,
          message: result.msg
        });
        
        showScanError(
          t('qr.results.signin_failed_title'),
          result.msg || t('qr.results.signin_failed_message')
        );
      }
    } catch (error) {
      console.error('❌ [QR签到] API调用异常:', error);
      showScanError(
        t('qr.results.signin_failed_title'),
        t('common.network_error')
      );
    } finally {
      // 🔓 确保在所有情况下都重置处理状态
      setIsProcessing(false);
      console.log('🔓 [QR签到] 重置isProcessing状态');
    }
  };

  const handleGeneralScan = (data: string) => {
    console.log('🔍 [QRScanner] handleGeneralScan 处理数据:', data.substring(0, 100));
    
    // 智能QR码类型识别
    const qrType = identifyQRCodeType(data);
    console.log('🧠 [QRScanner] QR码类型识别结果:', qrType);
    
    switch (qrType.type) {
      case 'user_identity':
        console.log('🆔 [QRScanner] 识别为用户身份码，转发处理');
        handleUserIdentityScan(data);
        return;
        
      case 'activity':
      case 'activity_hash':
        console.log('🏃 [QRScanner] 识别为活动码，转发处理');
        handleActivitySignInScan(data);
        return;
        
      case 'referral':
        console.log('📝 [QRScanner] 识别为推荐码，转发处理');
        handleRegisterCode(data);
        return;
        
      case 'unknown':
      default:
        console.log('📄 [QRScanner] 未知QR码类型，显示详细信息');
        showUnknownQRResult(data, qrType);
        return;
    }
  };

  // QR码类型智能识别函数
  const identifyQRCodeType = (data: string) => {
    console.log('🔍 [QRScanner] 分析QR码格式:', data.substring(0, 50));
    
    // 用户身份码格式 (支持新旧两种格式)
    if (data.startsWith('VG_USER_')) {
      return { type: 'user_identity', confidence: 'high', format: 'VG_USER_' };
    }
    
    // ✅ 新版哈希格式身份码
    if (data.startsWith('VG_HASH_')) {
      return { type: 'user_identity', confidence: 'high', format: 'VG_HASH_' };
    }
    
    // 标准活动码
    if (data.startsWith('VG_ACTIVITY_')) {
      return { type: 'activity', confidence: 'high', format: 'VG_ACTIVITY_' };
    }
    
    // 推荐码格式
    if (data.startsWith('VG_REF_') || /^[A-Z0-9]{8}$/.test(data)) {
      return { type: 'referral', confidence: 'high', format: data.startsWith('VG_REF_') ? 'VG_REF_' : 'direct' };
    }
    
    // 纯数字（可能是活动ID）
    if (/^\d+$/.test(data) && data.length >= 1 && data.length <= 10) {
      return { type: 'activity', confidence: 'medium', format: 'numeric_id' };
    }
    
    // URL格式
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return { type: 'url', confidence: 'high', format: 'url' };
    }
    
    // 32位十六进制（可能是活动哈希）
    if (/^[a-f0-9]{32}$/.test(data)) {
      console.log('🎯 [QRScanner] 检测到32位哈希，可能是活动相关');
      return { type: 'activity_hash', confidence: 'medium', format: 'md5_hash' };
    }
    
    // 64位十六进制
    if (/^[a-f0-9]{64}$/.test(data)) {
      return { type: 'hash', confidence: 'medium', format: 'sha256_hash' };
    }
    
    return { type: 'unknown', confidence: 'low', format: 'unrecognized' };
  };

  // 显示未知QR码的详细结果
  const showUnknownQRResult = (data: string, qrType: any) => {
    console.log('📄 [QRScanner] 显示未知QR码结果，类型:', qrType);
    const formatInfo = getQRFormatInfo(qrType);
    
    console.log('🔔 [QRScanner] 准备显示Alert:', {
      title: t('qr.results.scan_result') || '扫描结果',
      description: formatInfo.description,
      data: data.substring(0, 50)
    });
    
    // 重置处理状态，确保Alert能正常显示
    setIsProcessing(false);
    
    console.log(
      '扫描结果',
      `扫描内容：${data.substring(0, 50)}${data.length > 50 ? '...' : ''}\n\n识别类型：${formatInfo.description}\n格式：${qrType.format}\n\n${formatInfo.suggestion}`,
      [
        {
          text: '重新扫描',
          onPress: () => {
            console.log('🔄 [QRScanner] 重置扫描状态，允许继续扫描');
            setScanned(false);
            setIsProcessing(false);
            scannedDataRef.current = '';
          },
        },
        {
          text: '返回',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ]
    );
    
    console.log('📢 [QRScanner] Alert显示完成');
  };

  // 获取QR码格式说明
  const getQRFormatInfo = (qrType: any) => {
    switch (qrType.type) {
      case 'activity_hash':
        return {
          description: '活动哈希码',
          suggestion: '检测到可能是活动相关的哈希码，已尝试进行活动签到处理。'
        };
      case 'hash':
        return {
          description: '哈希值',
          suggestion: '这不是PomeloX用户身份码。请扫描以"VG_USER_"开头的身份码。'
        };
      case 'url':
        return {
          description: '网址链接',
          suggestion: '这是一个网站链接，不是PomeloX身份码。'
        };
      default:
        return {
          description: '未知格式',
          suggestion: '无法识别此QR码类型。\n\n支持的格式：\n• 用户身份码：VG_USER_...\n• 活动码：VG_ACTIVITY_...\n• 推荐码：VG_REF_... 或 8位字符'
        };
    }
  };

  // ==================== 用户身份码扫描处理 ====================

  const handleUserIdentityScan = async (qrData: string) => {
    try {
      console.log('🔎 [Web-QR扫描] 开始处理用户身份码扫描，数据:', qrData.substring(0, 100));
      
      // ✅ 检查是否为新的哈希格式
      if (qrData.startsWith('VG_HASH_')) {
        console.log('🔐 [Web-QR扫描] 检测到哈希格式身份码');
        await handleHashIdentityScan(qrData);
        return;
      }
      
      // ✅ 检查旧的Base64格式
      if (!qrData.startsWith('VG_USER_')) {
        console.log('❌ [Web-QR扫描] 不是标准身份码格式');
        showScanError(
          '身份码格式错误', 
          `扫描到的不是PomeloX用户身份码。\n\n扫描内容：${qrData.substring(0, 50)}\n\n支持格式："VG_USER_"(旧版) 或 "VG_HASH_"(新版)`
        );
        return;
      }
      
      const parsedUser = parseUserIdentityQR(qrData);
      
      if (!parsedUser.isValid) {
        console.log('❌ [QR扫描] 身份码解析失败:', parsedUser.error);
        showScanError(
          '身份码解析失败', 
          `${parsedUser.error}\n\n请确保扫描的是有效的PomeloX用户身份码。`
        );
        return;
      }

      if (!parsedUser.data) {
        console.log('❌ [QR扫描] 身份码数据为空');
        showScanError(
          '身份码数据错误', 
          '身份码中没有用户信息，请重新生成身份码。'
        );
        return;
      }

      console.log('✅ [QR扫描] 身份码解析成功，显示用户信息');
      setIsProcessing(false); // 重置处理状态
      showUserInfo(parsedUser.data);

    } catch (error) {
      console.error('❌ [QR扫描] 处理用户身份码异常:', error);
      showScanError(
        '扫描失败', 
        `处理身份码时发生错误：${error instanceof Error ? error.message : '未知错误'}\n\n请重试或联系技术支持。`
      );
    }
  };

  // ==================== 哈希格式身份码处理 (Web端) ====================
  
  const handleHashIdentityScan = async (qrData: string) => {
    try {
      console.log('🔐 [Web-QR哈希扫描] 开始处理哈希格式身份码');
      setIsProcessing(true);
      
      // 导入哈希解析工具
      const { parseHashIdentityQR } = require('../../utils/qrHashGenerator');
      const hashResult = parseHashIdentityQR(qrData);
      
      if (!hashResult.isValid) {
        console.log('❌ [Web-QR哈希扫描] 哈希格式无效:', hashResult.error);
        showScanError(
          '身份码格式错误',
          `${hashResult.error}\n\n请确保扫描的是有效的新版PomeloX身份码。`
        );
        return;
      }
      
      // ✅ 通过API查询用户详细信息
      console.log('🌐 [Web-QR哈希扫描] 查询用户信息:', {
        userId: hashResult.userId,
        hash: hashResult.hash,
        timestamp: hashResult.timestamp
      });
      
      try {
        // ✅ 使用现有的用户信息API (零后端改动) 
        const userResponse = await pomeloXAPI.getUserInfo(parseInt(hashResult.userId!));
        
        if (userResponse.code === 200 && userResponse.data) {
          console.log('✅ [Web-QR哈希扫描] 用户信息查询成功');
          
          // ✅ 本地验证哈希确保安全性
          const { validateIdentityHash } = require('../../utils/qrHashGenerator');
          const isValidHash = await validateIdentityHash(
            userResponse.data,
            hashResult.timestamp!,
            hashResult.hash!
          );
          
          if (isValidHash) {
            console.log('🔐 [Web-QR哈希验证] 身份码哈希验证通过');
            showUserInfo(userResponse.data);
          } else {
            console.log('❌ [Web-QR哈希验证] 身份码哈希验证失败');
            showScanError(
              '身份码验证失败',
              '身份码可能已被篡改或数据不匹配，请重新生成身份码。'
            );
          }
        } else {
          console.log('❌ [Web-QR哈希扫描] 用户信息查询失败:', userResponse.msg);
          showScanError(
            '用户不存在',
            `${userResponse.msg || '用户ID不存在或账户已停用'}\n\n请确认用户ID正确。`
          );
        }
      } catch (apiError) {
        console.error('❌ [Web-QR哈希扫描] API查询失败:', apiError);
        showScanError(
          '网络错误',
          '无法获取用户信息，请检查网络连接后重试。'
        );
      }
      
    } catch (error) {
      console.error('❌ [Web-QR哈希扫描] 处理哈希身份码异常:', error);
      showScanError(
        '扫描失败',
        '哈希身份码处理异常，请重试或联系技术支持。'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const parseUserIdentityQR = (qrData: string): ParsedUserQRCode => {
    try {
      console.log('🔍 [Web-QR解析] 开始解析用户身份码:', qrData?.substring(0, 50) + '...');
      
      if (!qrData || typeof qrData !== 'string') {
        console.log('❌ [Web-QR解析] QR数据为空或格式错误');
        return {
          isValid: false,
          error: 'QR码数据无效'
        };
      }

      if (!qrData.startsWith('VG_USER_')) {
        console.log('❌ [Web-QR解析] 非用户身份码格式, 实际格式:', qrData.substring(0, 20));
        return {
          isValid: false,
          error: '不是有效的用户身份码格式'
        };
      }

      const base64Data = qrData.replace('VG_USER_', '').trim();
      console.log('🔑 [Web-QR解析] 提取的base64数据长度:', base64Data.length);
      
      if (!base64Data) {
        console.log('❌ [Web-QR解析] base64数据为空');
        return {
          isValid: false,
          error: '身份码数据为空'
        };
      }

      let encodedString: string;
      let jsonString: string;
      let userData: UserIdentityData;

      // Web端使用atob解码（与App端生成的Base64兼容）
      try {
        encodedString = atob(base64Data);
        console.log('🗜️ [Web-QR解析] atob解码成功，长度:', encodedString.length);
      } catch (atobError) {
        console.error('❌ [Web-QR解析] atob解码失败:', atobError);
        return {
          isValid: false,
          error: '身份码编码格式错误，无法解码'
        };
      }

      // 尝试URL解码
      try {
        jsonString = decodeURIComponent(encodedString);
        console.log('📜 [Web-QR解析] URL解码成功，长度:', jsonString.length);
      } catch (urlError) {
        console.log('⚠️ [Web-QR解析] URL解码失败，直接使用原字符串:', urlError);
        jsonString = encodedString;
      }

      // 尝试JSON解析
      try {
        userData = JSON.parse(jsonString);
        console.log('✅ [Web-QR解析] JSON解析成功:', {
          userId: userData.userId,
          userName: userData.userName,
          legalName: userData.legalName,
          type: userData.type,
          hasOrganization: !!userData.currentOrganization
        });
      } catch (jsonError) {
        console.error('❌ [Web-QR解析] JSON解析失败:', jsonError);
        console.log('📝 [Web-QR解析] 原始JSON字符串:', jsonString.substring(0, 200) + '...');
        return {
          isValid: false,
          error: '身份码内容格式错误，无法解析JSON数据'
        };
      }

      // 验证数据结构
      if (!userData || typeof userData !== 'object') {
        console.log('❌ [Web-QR解析] 解析结果不是有效对象');
        return {
          isValid: false,
          error: '身份码数据结构错误'
        };
      }

      // 验证必要字段
      if (!userData.userId || !userData.userName || !userData.legalName) {
        console.log('⚠️ [Web-QR解析] 缺少必要字段:', {
          hasUserId: !!userData.userId,
          hasUserName: !!userData.userName,
          hasLegalName: !!userData.legalName,
          actualFields: Object.keys(userData)
        });
        return {
          isValid: false,
          error: '身份码缺少必要信息（用户ID、用户名或姓名）'
        };
      }

      // 验证数据类型
      if (userData.type !== 'user_identity') {
        console.log('⚠️ [Web-QR解析] 身份码类型不匹配:', userData.type);
        return {
          isValid: false,
          error: '不是用户身份码类型'
        };
      }

      console.log('✨ [Web-QR解析] 身份码解析完全成功!');
      return {
        isValid: true,
        data: userData
      };

    } catch (error) {
      console.error('❌ [Web-QR解析] 解析过程发生未捕获异常:', error);
      return {
        isValid: false,
        error: `解析异常: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  };

  const showUserInfo = (userData: UserIdentityData) => {
    // Web端触觉反馈
    if (Platform.OS === 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    console.log('✅ [Web-QR扫描] 显示用户信息模态框:', {
      userId: userData.userId,
      legalName: userData.legalName,
      position: userData.position?.displayName,
      organization: userData.currentOrganization?.displayNameZh
    });

    // 使用新的高级用户信息展示组件（Web端适配）
    setScannedUserData(userData);
    setShowUserInfoModal(true);
  };

  // ==================== 商家会员卡扫描处理 ====================

  const handleMembershipCardScan = async (qrData: string) => {
    setIsProcessing(true);
    
    try {
      // 解析QR码
      const parsedQR = membershipCardService.parseMerchantQR(qrData);
      
      if (!parsedQR.isValid) {
        showScanError(t('qr.errors.invalid_qr_code'), parsedQR.error || t('qr.errors.scan_valid_merchant_qr'));
        return;
      }

      if (parsedQR.isExpired) {
        showScanError(t('qr.errors.qr_expired'), t('qr.errors.get_new_qr_from_merchant'));
        return;
      }

      if (!parsedQR.merchantId) {
        showScanError(t('qr.errors.invalid_merchant_qr'), t('qr.errors.missing_merchant_info'));
        return;
      }

      // 检查权限
      await checkMerchantPermission(parsedQR.merchantId, qrData);
      
    } catch (error) {
      console.error('Error processing merchant QR code:', error);
      showScanError(t('qr.errors.scan_failed'), t('qr.errors.process_qr_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const checkMerchantPermission = async (merchantId: string, qrData: string) => {
    if (!currentOrganization) {
      showScanError(t('qr.errors.no_organization_selected'), t('qr.errors.select_organization_first'));
      return;
    }

    // 检查商家权限（应该调用真实API）
    // Mock permissions removed - should use real API call
    const allowedOrganizations: string[] = [];
    
    // Since mock permissions are removed, show service unavailable message
    showScanError(
      t('qr.errors.service_unavailable') || '服务暂不可用',
      t('qr.errors.merchant_permissions_developing') || '商家权限系统开发中，请联系管理员'
    );
  };

  const createMembershipCard = async (merchantId: string, qrData: string) => {
    try {
      if (!currentOrganization) return;

      // 检查是否已经有该商家的会员卡
      const existingCards = await membershipCardService.getCardsByUserId('current_user_id'); // TODO: 获取真实用户ID
      const existingCard = existingCards.find(card => 
        card.merchantId === merchantId && 
        card.organizationId === currentOrganization.id
      );

      if (existingCard) {
        // 已有会员卡，直接跳转到详情
        console.log(
          '已有会员卡',
          '您已经拥有该商家的会员卡',
          [
            {
              text: '查看会员卡',
              onPress: () => {
                // TODO: 导航到会员卡详情页面
                console.log('Navigate to card detail:', existingCard.id);
                navigation.goBack();
              }
            },
            {
              text: '继续扫描',
              onPress: () => setScanned(false)
            }
          ]
        );
        return;
      }

      // 创建新的会员卡
      const newCard = await membershipCardService.createMembershipCard({
        userId: 'current_user_id', // TODO: 获取真实用户ID
        organizationId: currentOrganization.id,
        merchantId,
        cardType: 'merchant'
      });

      // 添加到组织Context
      addMembershipCard(newCard);

      // 成功反馈
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      console.log(
        '会员卡创建成功！',
        `恭喜您获得 ${getMerchantName(merchantId)} 的会员卡`,
        [
          {
            text: '查看会员卡',
            onPress: () => {
              if (returnScreen) {
                navigation.navigate(returnScreen);
              } else {
                // TODO: 导航到会员卡详情页面
                console.log('Navigate to new card detail:', newCard.id);
                navigation.goBack();
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating membership card:', error);
      showScanError(t('qr.errors.creation_failed'), t('qr.errors.card_creation_error'));
    }
  };

  const showOrganizationSwitchPrompt = (merchantId: string, qrData: string, availableOrgs: Organization[]) => {
    const merchantName = getMerchantName(merchantId);
    
    setScanResult({
      success: false,
      hasPermission: false,
      availableOrganizations: availableOrgs,
      error: {
        code: 'NO_PERMISSION',
        message: `当前组织无权限访问 ${merchantName}`,
        suggestedAction: 'SWITCH_ORGANIZATION'
      }
    });
    
    setShowOrganizationSwitchModal(true);
  };

  const handleOrganizationSwitch = async (organization: Organization) => {
    try {
      setShowOrganizationSwitchModal(false);
      setIsProcessing(true);

      const result = await switchOrganization(organization.id);
      
      if (result.success && scanResult) {
        // 切换成功，重新检查权限
        setTimeout(() => {
          const lastQRData = scanResult.error?.code; // 这里应该保存实际的QR数据
          setScanned(false);
          setScanResult(null);
          // 可以自动重新扫描或提示用户重新扫描
          console.log(
            '组织切换成功',
            `已切换到 ${organization.displayNameZh}，请重新扫描二维码`,
            [{ text: '确定', onPress: () => setScanned(false) }]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Error switching organization:', error);
      showScanError(t('qr.errors.switch_failed'), t('qr.errors.organization_switch_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const showScanError = (title: string, message: string) => {
    // 隐藏扫码反馈覆盖层
    setShowScanFeedback(false);
    setIsProcessing(false);
    
    console.log('🚨 [QR扫描] 显示错误信息:', { title, message });
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    if (Platform.OS === 'web') {
      // Web端使用安全的window.confirm
      const userChoice = window.confirm(
        `${title}\n\n${message}\n\n点击确定重新扫描，点击取消返回。`
      );
      
      if (userChoice) {
        console.log('🔄 [QRScanner] 重新扫描，重置状态');
        setScanned(false);
        setIsProcessing(false);
        setQRCodeBounds(undefined);
        scannedDataRef.current = '';
      } else {
        console.log('🔙 [QRScanner] 返回上一页');
        navigation.goBack();
      }
    } else {
      // App端使用console.log
      console.log(
        title,
        message,
        [
          {
            text: '重新扫描',
            onPress: () => {
              console.log('🔄 [QRScanner] 重新扫描，重置状态');
              setScanned(false);
              setIsProcessing(false);
              setQRCodeBounds(undefined);
              scannedDataRef.current = '';
            }
          },
          {
            text: '返回',
            style: 'cancel',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const getMerchantName = (merchantId: string): string => {
    // 模拟商家名称映射（实际应该从API获取）
    const merchantNames: Record<string, string> = {
      'merchant_starbucks': 'Starbucks Coffee',
      'merchant_mcdonalds': 'McDonald\'s',
      'merchant_subway': 'Subway',
    };
    return merchantNames[merchantId] || '未知商家';
  };

  const handleBack = () => {
    console.log('🔙 [QRScanner] handleBack被点击');
    try {
      navigation.goBack();
      console.log('✅ [QRScanner] navigation.goBack()执行成功');
    } catch (error) {
      console.error('❌ [QRScanner] navigation.goBack()执行失败:', error);
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const handleManualInput = () => {
    console.log('🔍 [QRScanner] 手动输入按钮被点击, purpose:', purpose);
    if (purpose === 'register') {
      console.log('✅ [QRScanner] 显示推荐码输入Sheet');
      setShowReferralInputSheet(true);
    } else {
      console.log('❌ [QRScanner] purpose不是register，不显示推荐码输入', { purpose });
    }
  };

  const handleReferralCodeSubmit = async (code: string, setError: (error: string) => void) => {
    console.log('📝 [QRScannerScreen] 用户手动输入推荐码:', code);
    const trimmedCode = code.trim();
    
    try {
      console.log('🔍 开始验证邀请码:', trimmedCode);
      
      // 先进行格式验证
      const formatValidation = await validateInvitationCode(trimmedCode);
      if (!formatValidation.valid) {
        console.log('❌ 邀请码格式错误:', formatValidation.message);
        setError('邀请码错误');
        return; // 不关闭Sheet，让用户看到错误并重新输入
      }
      
      // 格式正确，使用临时注册数据验证邀请码有效性
      const tempTestData = {
        userName: 'temptest' + Date.now(),
        legalName: '临时验证用户',
        nickName: 'TempTest',
        password: 'temp123',
        phonenumber: `199${Date.now().toString().slice(-8)}`, // 更唯一的手机号
        email: `temp${Date.now()}@test.edu`,
        sex: '0',
        deptId: '203',
        orgId: '1',
        invCode: trimmedCode,
        areaCode: 'zh'
      };
      
      // 构建验证请求
      const formData = new URLSearchParams();
      Object.entries(tempTestData).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      
      console.log('🔍 使用临时数据验证邀请码有效性...');
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://www.vitaglobal.icu';
      const response = await fetch(`${apiUrl}/app/user/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
      });
      
      const result = await response.json();
      console.log('🌐 邀请码验证结果:', { code: result.code, msg: result.msg });
      
      // 分析验证结果
      if (result.code === 200) {
        console.log('✅ 邀请码验证通过，跳转注册页面');
        // 验证成功，关闭Sheet并跳转
        setShowReferralInputSheet(false);
        navigation.navigate('IdentityChoice', { 
          referralCode: trimmedCode,
          hasReferralCode: true,
          registrationType: 'invitation'
        });
      } else if (result.msg?.includes('手机号码已存在')) {
        console.log('⚠️ 手机号重复，但邀请码格式正确，允许跳转');
        // 手机号重复不影响邀请码验证，允许跳转
        setShowReferralInputSheet(false);
        navigation.navigate('IdentityChoice', { 
          referralCode: trimmedCode,
          hasReferralCode: true,
          registrationType: 'invitation'
        });
      } else if (result.msg?.includes('邀请码失效') || result.msg?.includes('邀请码')) {
        console.log('❌ 邀请码验证失败:', result.msg);
        setError('邀请码错误');
        return; // 保持Sheet打开，显示错误
      } else {
        console.log('❓ 其他验证错误:', result.msg);
        setError('邀请码错误');
        return; // 保持Sheet打开，显示错误
      }
      
    } catch (error) {
      console.error('🚨 邀请码验证出错:', error);
      setError('邀请码错误');
      return; // 保持Sheet打开，显示错误
    }
  };

  // 根据purpose获取对应的扫描标题
  const getQRScannerTitle = (purpose: string): string => {
    switch (purpose) {
      case 'register':
        return t('qr.scanning.register_title');
      case 'membership_card':
        return t('qr.scanning.membership_title');
      case 'user_identity':
        return t('qr.scanning.user_identity_title');
      case 'activity_signin':
        return t('qr.scanning.activity_signin_title');
      case 'verify':
        return t('qr.scanning.verify_title');
      default:
        return t('qr.scanning.general_title');
    }
  };

  // Web端不需要expo-camera的权限检查
  if (Platform.OS !== 'web') {
    if (!permission) {
      return (
        <View style={styles.container}>
          <Text style={styles.message}>{t('qr.camera.permission_requesting')}</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Ionicons name="camera-off" size={64} color={theme.colors.text.disabled} />
          <Text style={styles.message}>{t('qr.camera.no_permission')}</Text>
          <Text style={styles.submessage}>{t('qr.camera.permission_instruction')}</Text>
          <TouchableOpacity style={[styles.button, { marginBottom: theme.spacing[2] }]} onPress={requestPermission}>
            <Text style={styles.buttonText}>{t('qr.camera.request_permission_button')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleBack}>
            <Text style={styles.buttonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  // 渲染摄像头组件
  const renderCamera = () => {
    console.log('📹 [QRScannerScreen] 渲染摄像头组件, Platform.OS:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('🌐 [QRScannerScreen] 使用NativeQRScanner组件');
      return (
        <NativeQRScanner
          style={StyleSheet.absoluteFillObject}
          onScan={(data) => {
            console.log('📲 [QRScannerScreen] NativeQRScanner回调触发:', data?.substring(0, 50));
            if (!scanned && !isProcessing) {
              console.log('✅ [QRScannerScreen] 状态允许，处理扫描结果');
              handleBarCodeScanned({ type: 'qr', data });
            } else {
              console.log('⏭️ [QRScannerScreen] 跳过扫描，状态:', { scanned, isProcessing });
            }
          }}
        />
      );
    }
    
    return (
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderCamera()}

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.headerButton}
            activeOpacity={0.7}
            onPressIn={() => console.log('🔙 [QRScanner] Back button pressed in')}
            onPressOut={() => console.log('🔙 [QRScanner] Back button pressed out')}
          >
            <Ionicons name="close" size={28} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {getQRScannerTitle(purpose)}
          </Text>
          <TouchableOpacity onPress={toggleTorch} style={styles.headerButton}>
            <Ionicons 
              name={torchOn ? "flash" : "flash-off"} 
              size={24} 
              color={theme.colors.text.inverse} 
            />
          </TouchableOpacity>
        </View>

        {/* Scan Area */}
        <View style={styles.scanContainer}>
          <View style={styles.scanArea}>
            {/* Corners */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Scan Line Animation */}
            <View style={styles.scanLine} />
          </View>
          
          <Text style={styles.tip}>
            {purpose === 'register' 
              ? t('qr.scanning.instruction')
              : purpose === 'membership_card'
              ? t('qr.scanning.merchant_instruction')
              : purpose === 'user_identity'
              ? t('qr.scanning.user_identity_instruction')
              : t('qr.scanning.instruction')}
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {purpose === 'register' && (
            <TouchableOpacity style={styles.manualButton} onPress={handleManualInput}>
              <Ionicons name="keypad-outline" size={24} color={theme.colors.text.inverse} />
              <Text style={styles.manualButtonText}>{t('qr.scanning.manual_input_button')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 扫码反馈覆盖层 */}
      <ScanFeedbackOverlay
        visible={showScanFeedback}
        qrCodeBounds={qrCodeBounds}
        onAnimationComplete={handleScanFeedbackComplete}
      />

      {/* 推荐码输入BottomSheet */}
      <ReferralCodeInputSheet
        visible={showReferralInputSheet}
        onClose={() => setShowReferralInputSheet(false)}
        onSubmit={handleReferralCodeSubmit}
      />

      {/* 用户身份信息模态框 */}
      {scannedUserData && (
        <ScannedUserInfoModal
          visible={showUserInfoModal}
          onClose={() => {
            console.log('🔄 [QRScanner] 关闭用户信息模态框，重置状态');
            setShowUserInfoModal(false);
            setScannedUserData(null);
            setScanned(false); // 允许继续扫描
            setIsProcessing(false); // 重置处理状态
            scannedDataRef.current = ''; // 清空扫描数据
          }}
          scannedUserData={scannedUserData}
        />
      )}

      {/* 组织切换模态框 */}
      <OrganizationSwitchModal
        visible={showOrganizationSwitchModal}
        onClose={() => setShowOrganizationSwitchModal(false)}
        availableOrganizations={scanResult?.availableOrganizations || []}
        currentOrganization={currentOrganization}
        onOrganizationSelect={handleOrganizationSwitch}
        merchantName={scanResult?.error?.message || ''}
      />

      {/* 活动签到成功弹窗 */}
      <LiquidSuccessModal
        visible={showCheckInSuccessModal}
        onClose={handleCheckInSuccessModalClose}
        title={checkInModalData.title}
        message={checkInModalData.message}
        confirmText={t('common.confirm')}
        icon="checkmark-circle"
      />
    </View>
  );
};

// ==================== 组织切换模态框组件 ====================

interface OrganizationSwitchModalProps {
  visible: boolean;
  onClose: () => void;
  availableOrganizations: Organization[];
  currentOrganization: Organization | null;
  onOrganizationSelect: (org: Organization) => void;
  merchantName: string;
}

const OrganizationSwitchModal: React.FC<OrganizationSwitchModalProps> = ({
  visible,
  onClose,
  availableOrganizations,
  currentOrganization,
  onOrganizationSelect,
  merchantName
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{t('qr.organization.switch_title', '切换组织')}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={modalStyles.message}>
            {currentOrganization?.displayNameZh} 无权限访问此商家
          </Text>
          <Text style={modalStyles.submessage}>
            您可以切换到以下有权限的组织：
          </Text>

          <View style={modalStyles.organizationList}>
            {availableOrganizations.map((org) => (
              <TouchableOpacity
                key={org.id}
                style={modalStyles.organizationItem}
                onPress={() => onOrganizationSelect(org)}
              >
                <View style={modalStyles.organizationInfo}>
                  <Text style={modalStyles.organizationName}>
                    {org.displayNameZh}
                  </Text>
                  <Text style={modalStyles.organizationSubtitle}>
                    {org.name}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.colors.text.secondary} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={modalStyles.cancelButton}
            onPress={onClose}
          >
            <Text style={modalStyles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: 320,
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  message: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },

  submessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },

  organizationList: {
    marginBottom: 20,
  },

  organizationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },

  organizationInfo: {
    flex: 1,
  },

  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  organizationSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  cancelButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing[2],
  },
  submessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.disabled,
    marginBottom: theme.spacing[6],
  },
  button: {
    backgroundColor: '#6B7280', // 灰色按钮背景
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  buttonText: {
    color: '#FFFFFF', // 白色文字配灰色背景
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'box-none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[4],
    pointerEvents: 'auto',
    zIndex: 9998,
    position: 'relative',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
    zIndex: 9999,
    position: 'relative',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  scanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#6B7280', // 灰色边框
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6B7280', // 灰色扫描线
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  tip: {
    marginTop: theme.spacing[8],
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  bottomActions: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: theme.spacing[6],
    alignItems: 'center',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  manualButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[2],
  },
});