import React, { useState, useEffect } from 'react';
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

import { theme } from '../../theme';
import { useOrganization } from '../../context/OrganizationContext';
import { validateInvitationCode } from '../../services/registrationAPI';
import { membershipCardService } from '../../services/MembershipCardService';
import { MerchantQRScanResult, ParsedMerchantQR } from '../../types/cards';
import { Organization } from '../../types/organization';
import { UserIdentityData, ParsedUserQRCode } from '../../types/userIdentity';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const scanAreaSize = screenWidth * 0.7;

export const QRScannerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const purpose = route.params?.purpose || 'scan'; // 'register' | 'verify' | 'scan' | 'membership_card' | 'user_identity'
  const returnScreen = route.params?.returnScreen;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  
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

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    
    // 触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // 根据不同用途处理扫描结果
    switch (purpose) {
      case 'register':
        handleRegisterCode(data);
        break;
      case 'verify':
        handleVerifyCode(data);
        break;
      case 'membership_card':
        handleMembershipCardScan(data);
        break;
      case 'user_identity':
        handleUserIdentityScan(data);
        break;
      default:
        handleGeneralScan(data);
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

  const handleGeneralScan = (data: string) => {
    // 首先检查是否为用户身份码
    if (data.startsWith('VG_USER_')) {
      handleUserIdentityScan(data);
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
      const parsedUser = parseUserIdentityQR(qrData);
      
      if (!parsedUser.isValid) {
        showScanError('无效的用户身份码', parsedUser.error || '请扫描有效的用户身份二维码');
        return;
      }


      if (!parsedUser.data) {
        showScanError('身份码数据错误', '无法读取用户身份信息');
        return;
      }

      // 显示用户信息
      showUserInfo(parsedUser.data);

    } catch (error) {
      console.error('Error processing user identity QR code:', error);
      showScanError('扫描失败', '处理用户身份码时发生错误');
    }
  };

  const parseUserIdentityQR = (qrData: string): ParsedUserQRCode => {
    try {
      if (!qrData.startsWith('VG_USER_')) {
        return {
          isValid: false,
          error: '不是有效的用户身份码格式'
        };
      }

      const base64Data = qrData.replace('VG_USER_', '');
      const encodedString = atob(base64Data);
      const jsonString = decodeURIComponent(encodedString);
      const userData: UserIdentityData = JSON.parse(jsonString);

      // 验证必要字段
      if (!userData.userId || !userData.userName || !userData.legalName) {
        return {
          isValid: false,
          error: '身份码缺少必要信息'
        };
      }

      return {
        isValid: true,
        data: userData
      };

    } catch (error) {
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
        showScanError('无效的QR码', parsedQR.error || '请扫描有效的商家二维码');
        return;
      }

      if (parsedQR.isExpired) {
        showScanError('QR码已过期', '请向商家获取新的二维码');
        return;
      }

      if (!parsedQR.merchantId) {
        showScanError('无效的商家QR码', '缺少商家信息');
        return;
      }

      // 检查权限
      await checkMerchantPermission(parsedQR.merchantId, qrData);
      
    } catch (error) {
      console.error('Error processing merchant QR code:', error);
      showScanError('扫描失败', '处理二维码时发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const checkMerchantPermission = async (merchantId: string, qrData: string) => {
    if (!currentOrganization) {
      showScanError('未选择组织', '请先选择您所属的学联组织');
      return;
    }

    // 模拟检查商家权限（实际应该调用API）
    const mockMerchantPermissions = {
      'merchant_starbucks': ['org_columbia_cu', 'org_cssa'],
      'merchant_mcdonalds': ['org_columbia_cu'],
      'merchant_subway': ['org_cssa'],
    };

    const allowedOrganizations = mockMerchantPermissions[merchantId as keyof typeof mockMerchantPermissions] || [];
    
    if (allowedOrganizations.includes(currentOrganization.id)) {
      // 有权限，可以创建会员卡
      await createMembershipCard(merchantId, qrData);
    } else {
      // 无权限，检查是否有其他可用组织
      const availableOrgs = organizations.filter(org => 
        allowedOrganizations.includes(org.id) && hasOrganizationAccess(org.id)
      );

      if (availableOrgs.length > 0) {
        // 显示组织切换提示
        showOrganizationSwitchPrompt(merchantId, qrData, availableOrgs);
      } else {
        showScanError(
          '无访问权限', 
          `您所在的组织 ${currentOrganization.displayNameZh} 没有权限访问此商家的会员服务`
        );
      }
    }
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
      showScanError('创建失败', '创建会员卡时发生错误');
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
      showScanError('切换失败', '切换组织时发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const showScanError = (title: string, message: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: '重新扫描',
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

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={theme.colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {purpose === 'register' ? t('qr.scanning.title') : t('qr.scanning.title')}
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
            <Text style={modalStyles.title}>切换组织</Text>
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
            <Text style={modalStyles.cancelButtonText}>取消</Text>
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