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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { ScanFeedbackOverlay, QRCodeBounds } from '../../components/common/ScanFeedbackOverlay';

import { theme } from '../../theme';
import { useOrganization } from '../../context/OrganizationContext';
import { validateInvitationCode } from '../../services/registrationAPI';
import { membershipCardService } from '../../services/MembershipCardService';
import { MerchantQRScanResult, ParsedMerchantQR } from '../../types/cards';
import { Organization } from '../../types/organization';
import { UserIdentityData, ParsedUserQRCode } from '../../types/userIdentity';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { WebCameraView, WebCameraViewRef } from '../../components/web/WebCameraView';
import { useWebCameraPermissions } from '../../hooks/useWebCameraPermissions';

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
  
  // 获取注册的回调函数
  const getRegisteredCallback = (type: 'onScanSuccess' | 'onScanError') => {
    try {
      const state = (navigation as any).getParent()?.getState();
      if (!state || typeof state !== 'object') {
        console.warn('⚠️ [QRScanner] Navigation state is invalid');
        return undefined;
      }
      
      const callbacks = state.qrScannerCallbacks;
      if (!callbacks || typeof callbacks !== 'object') {
        console.warn('⚠️ [QRScanner] qrScannerCallbacks is not available');
        return undefined;
      }
      
      if (!callbackId) {
        console.warn('⚠️ [QRScanner] callbackId is not provided');
        return undefined;
      }
      
      return callbacks[callbackId]?.[type];
    } catch (error) {
      console.error('❌ [QRScanner] Error getting registered callback:', error);
      return undefined;
    }
  };
  
  // 原生和Web平台的相机权限处理
  const [nativePermission, requestNativePermission] = Platform.OS !== 'web' ? useCameraPermissions() : [null, () => Promise.resolve({ granted: false, status: 'denied' as const })];
  const [webPermission, requestWebPermission] = Platform.OS === 'web' ? useWebCameraPermissions() : [null, () => Promise.resolve({ granted: false, status: 'denied' as const })];
  
  const permission = Platform.OS === 'web' ? webPermission : nativePermission;
  const requestPermission = Platform.OS === 'web' ? requestWebPermission : requestNativePermission;
  
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const webCameraRef = useRef<WebCameraViewRef>(null);
  
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

  // 组件卸载时停止摄像头
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && webCameraRef.current) {
        webCameraRef.current.stopCamera();
      }
    };
  }, []);

  // 用于保存扫描数据的ref
  const scannedDataRef = useRef<string>('');

  const handleBarCodeScanned = ({ type, data, bounds }: { type: string; data: string; bounds?: any }) => {
    if (scanned || isProcessing) return;
    
    console.log('🔎 [QRScanner] 检测到二维码:', { type, data: data?.substring(0, 50), bounds });
    
    // 保存扫描数据
    scannedDataRef.current = data;
    
    // 设置扫码状态和二维码位置
    setScanned(true);
    
    // 如果有边界信息，保存用于定位圆圈
    if (bounds) {
      setQRCodeBounds({
        origin: { x: bounds.origin.x, y: bounds.origin.y },
        size: { width: bounds.size.width, height: bounds.size.height }
      });
    }
    
    // 显示扫码反馈动画
    setShowScanFeedback(true);
    
    // iOS触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // 扫码反馈动画完成后处理扫描结果
  const handleScanFeedbackComplete = () => {
    setShowScanFeedback(false);
    
    // 获取最后扫描的数据
    const lastScannedData = scannedDataRef.current;
    if (!lastScannedData) {
      console.warn('⚠️ [QRScanner] 扫码数据丢失');
      setScanned(false);
      return;
    }
    
    console.log('✅ [QRScanner] 开始处理扫码结果:', lastScannedData.substring(0, 50));
    
    // 根据不同用途处理扫描结果
    switch (purpose) {
      case 'register':
        handleRegisterCode(lastScannedData);
        break;
      case 'verify':
        handleVerifyCode(lastScannedData);
        break;
      case 'membership_card':
        handleMembershipCardScan(lastScannedData);
        break;
      case 'user_identity':
        handleUserIdentityScan(lastScannedData);
        break;
      case 'activity_signin':
        handleActivitySignInScan(lastScannedData);
        break;
      default:
        handleGeneralScan(lastScannedData);
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
        const validation = await validateInvitationCode(referralCode);
        
        if (validation.valid) {
          // 显示邀请码信息
          const inviterInfo = validation.data?.inviterName 
            ? `\n推荐人：${validation.data.inviterName}`
            : '';
          const orgInfo = validation.data?.organizationName 
            ? `\n组织：${validation.data.organizationName}`
            : '';
            
          Alert.alert(
            t('qr.results.referral_success_title'),
            t('qr.results.referral_success_message', { referralCode }) + inviterInfo + orgInfo,
            [
              {
                text: t('qr.results.continue_register'),
                onPress: () => {
                  // 跳转到新的注册流程，并标记为邀请码注册
                  navigation.navigate('RegisterStep1', { 
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
          Alert.alert(
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
        console.error('验证邀请码失败:', error);
        // 如果验证接口有问题，仍然允许继续注册
        Alert.alert(
          t('qr.results.referral_success_title'),
          t('qr.results.referral_success_message', { referralCode }) + '\n（验证服务暂不可用）',
          [
            {
              text: t('qr.results.continue_register'),
              onPress: () => {
                navigation.navigate('RegisterStep1', { 
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
      Alert.alert(
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
      Alert.alert(
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
      Alert.alert(
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
    // 检查是否有简单的成功标识
    const successAction = route.params?.onSuccess;
    
    // 优先使用简化的成功处理方案
    if (successAction === 'refresh_stats') {
      try {
        // 验证扫码数据的有效性
        const activityId = parseActivityQRCode(qrData);
        if (!activityId) {
          showScanError(
            t('qr.results.invalid_qr_title'),
            t('qr.results.invalid_activity_qr_message')
          );
          return;
        }

        // 执行签到逻辑
        await performSignIn(activityId);
        // 注意：performSignIn内部已经处理成功/失败的导航
        return;
      } catch (error) {
        console.error('Activity sign-in scan error:', error);
        showScanError(
          t('qr.results.signin_failed_title'),
          t('common.network_error')
        );
      }
      return;
    }

    // 尝试使用回调函数（向后兼容）
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
      Alert.alert(
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
        showScanError(
          t('qr.results.invalid_qr_title'),
          t('qr.results.invalid_activity_qr_message')
        );
        return;
      }

      // 检查用户报名状态
      const signInfo = await pomeloXAPI.getSignInfo(activityId, parseInt(user.userId));
      
      if (signInfo.code === 200) {
        switch (signInfo.data) {
          case 0:
            // 未报名，跳转到活动详情页面
            Alert.alert(
              t('qr.results.not_registered_title'),
              t('qr.results.not_registered_message'),
              [
                {
                  text: t('activities.registration.register_now'),
                  onPress: () => {
                    // 获取活动信息并跳转
                    navigation.navigate('ActivityDetail', { 
                      activity: { id: activityId.toString() }
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
            Alert.alert(
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
      // 假设活动二维码格式为: VG_ACTIVITY_{activityId} 或包含JSON的base64
      if (qrData.startsWith('VG_ACTIVITY_')) {
        const data = qrData.replace('VG_ACTIVITY_', '');
        // 尝试解析为JSON
        try {
          const activityData = JSON.parse(atob(data));
          return activityData.activityId;
        } catch {
          // 如果不是JSON，可能直接是活动ID
          return parseInt(data);
        }
      }
      
      // 尝试直接解析为数字
      const directId = parseInt(qrData);
      if (!isNaN(directId)) {
        return directId;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing activity QR code:', error);
      return null;
    }
  };

  const performSignIn = async (activityId: number) => {
    try {
      const result = await pomeloXAPI.signInActivity(activityId, parseInt(user?.id || '0'));
      
      if (result.code === 200) {
        // 签到成功
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        Alert.alert(
          t('qr.results.signin_success_title'),
          t('qr.results.signin_success_message'),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                if (returnScreen) {
                  navigation.navigate(returnScreen);
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        showScanError(
          t('qr.results.signin_failed_title'),
          result.msg || t('qr.results.signin_failed_message')
        );
      }
    } catch (error) {
      console.error('Sign-in API error:', error);
      showScanError(
        t('qr.results.signin_failed_title'),
        t('common.network_error')
      );
    }
  };

  const handleGeneralScan = (data: string) => {
    // 首先检查是否为用户身份码
    if (data.startsWith('VG_USER_')) {
      handleUserIdentityScan(data);
      return;
    }

    // 检查是否为活动签到码
    if (data.startsWith('VG_ACTIVITY_') || /^\d+$/.test(data)) {
      handleActivitySignInScan(data);
      return;
    }

    Alert.alert(
      t('qr.results.scan_result'),
      data,
      [
        {
          text: '确定',
          onPress: () => setScanned(false),
        },
      ]
    );
  };

  // ==================== 用户身份码扫描处理 ====================

  const handleUserIdentityScan = (qrData: string) => {
    try {
      console.log('🔎 [QR扫描] 开始处理用户身份码扫描');
      const parsedUser = parseUserIdentityQR(qrData);
      
      if (!parsedUser.isValid) {
        console.log('❌ [QR扫描] 身份码无效:', parsedUser.error);
        showScanError(t('qr.errors.invalid_user_code'), parsedUser.error || t('qr.errors.scan_valid_user_qr'));
        return;
      }

      if (!parsedUser.data) {
        console.log('❌ [QR扫描] 身份码数据为空');
        showScanError(t('qr.errors.identity_data_error'), t('qr.errors.cannot_read_user_info'));
        return;
      }

      console.log('✅ [QR扫描] 身份码解析成功，显示用户信息');
      // 显示用户信息
      showUserInfo(parsedUser.data);

    } catch (error) {
      console.error('❌ [QR扫描] 处理用户身份码异常:', error);
      showScanError(t('qr.errors.scan_failed'), t('qr.errors.process_user_code_error'));
    }
  };

  const parseUserIdentityQR = (qrData: string): ParsedUserQRCode => {
    try {
      console.log('🔍 [QR解析] 开始解析用户身份码:', qrData?.substring(0, 50) + '...');
      
      if (!qrData.startsWith('VG_USER_')) {
        console.log('❌ [QR解析] 非用户身份码格式');
        return {
          isValid: false,
          error: '不是有效的用户身份码格式'
        };
      }

      const base64Data = qrData.replace('VG_USER_', '');
      console.log('🔑 [QR解析] 提取的base64数据长度:', base64Data.length);
      
      const encodedString = atob(base64Data);
      console.log('🗜️ [QR解析] atob解码后的字符串长度:', encodedString.length);
      
      const jsonString = decodeURIComponent(encodedString);
      console.log('📜 [QR解析] decodeURIComponent后的JSON字符串长度:', jsonString.length);
      
      const userData: UserIdentityData = JSON.parse(jsonString);
      console.log('✅ [QR解析] JSON解析成功:', {
        userId: userData.userId,
        userName: userData.userName,
        legalName: userData.legalName,
        type: userData.type,
        hasOrganization: !!userData.currentOrganization
      });

      // 验证必要字段
      if (!userData.userId || !userData.userName || !userData.legalName) {
        console.log('⚠️ [QR解析] 缺少必要字段:', {
          hasUserId: !!userData.userId,
          hasUserName: !!userData.userName,
          hasLegalName: !!userData.legalName
        });
        return {
          isValid: false,
          error: '身份码缺少必要信息'
        };
      }

      console.log('✨ [QR解析] 身份码解析成功!');
      return {
        isValid: true,
        data: userData
      };

    } catch (error) {
      console.error('❌ [QR解析] 解析异常:', error);
      return {
        isValid: false,
        error: '身份码格式错误，无法解析'
      };
    }
  };

  const showUserInfo = (userData: UserIdentityData) => {
    // 触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const organizationText = userData.currentOrganization 
      ? `\n组织：${userData.currentOrganization.displayNameZh}`
      : '';

    Alert.alert(
      '用户身份信息',
      `姓名：${userData.legalName}\n英文名：${userData.nickName}\n邮箱：${userData.email}${organizationText}`,
      [
        {
          text: '查看详情',
          onPress: () => {
            // TODO: 跳转到用户详情页面
            console.log('Navigate to user profile:', userData.userId);
            navigation.goBack();
          }
        },
        {
          text: '继续扫描',
          onPress: () => setScanned(false)
        },
        {
          text: '返回',
          style: 'cancel',
          onPress: () => navigation.goBack()
        }
      ]
    );
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
        Alert.alert(
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

      Alert.alert(
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
          Alert.alert(
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
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: '重新扫描',
          onPress: () => {
            setScanned(false);
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
    // Web平台需要先停止摄像头
    if (Platform.OS === 'web' && webCameraRef.current) {
      webCameraRef.current.stopCamera();
    }
    navigation.goBack();
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  const handleManualInput = () => {
    if (purpose === 'register') {
      Alert.prompt(
        t('qr.scanning.manual_input_title'),
        t('qr.scanning.manual_input_desc'),
        [
          {
            text: t('qr.scanning.cancel'),
            style: 'cancel',
          },
          {
            text: t('qr.scanning.confirm'),
            onPress: (text) => {
              if (text) {
                navigation.navigate('RegisterForm', { 
                  referralCode: text,
                  hasReferralCode: true 
                });
              }
            },
          },
        ],
        'plain-text'
      );
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
        <Ionicons name="camera-outline" size={64} color={theme.colors.text.disabled} />
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

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <WebCameraView
          ref={webCameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      ) : (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      )}

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {getQRScannerTitle(purpose)}
          </Text>
          <TouchableOpacity onPress={toggleTorch} style={styles.headerButton}>
            <Ionicons 
              name={torchOn ? "flash" : "flash-outline"} 
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

      {/* 组织切换模态框 */}
      <OrganizationSwitchModal
        visible={showOrganizationSwitchModal}
        onClose={() => setShowOrganizationSwitchModal(false)}
        availableOrganizations={scanResult?.availableOrganizations || []}
        currentOrganization={currentOrganization}
        onOrganizationSelect={handleOrganizationSwitch}
        merchantName={scanResult?.error?.message || ''}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[4],
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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