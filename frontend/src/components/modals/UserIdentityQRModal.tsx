import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
// import * as MediaLibrary from 'expo-media-library';
// import * as FileSystem from 'expo-file-system';
// import { captureRef } from 'react-native-view-shot';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { UserIdentityData, IdentityQRCodeProps } from '../../types/userIdentity';
import { generateUserQRContent } from '../../utils/userIdentityMapper';

const { width: screenWidth } = Dimensions.get('window');
const qrSize = Math.min(screenWidth * 0.6, 280);

export const UserIdentityQRModal: React.FC<IdentityQRCodeProps> = ({
  visible,
  onClose,
  userData,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  
  const [qrRef, setQrRef] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 生成QR码内容 - 使用优化的生成函数
  const generateQRContent = (): string => {
    try {
      if (!userData) {
        return 'VG_USER_NO_DATA';
      }
      
      // 检查是否为访客用户，不生成二维码
      if (userData.userId === 'guest' || userData.userName === 'guest') {
        return 'VG_GUEST_NO_QR';
      }
      
      return generateUserQRContent(userData);
    } catch (error) {
      console.error('QR码内容生成失败:', error);
      return `VG_USER_${userData?.userId || 'unknown'}_${Date.now()}`;
    }
  };

  const handleSaveQRCode = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      
      // 触觉反馈
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // 暂时禁用保存功能，显示提示
      Alert.alert(
        '功能开发中',
        '二维码保存功能正在开发中，敬请期待'
      );

    } catch (error) {
      console.error('Error saving QR code:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareQRCode = async () => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const shareContent = {
        title: t('qr.share.title'),
        message: t('qr.share.message', { 
          name: userData.legalName,
          organization: userData.currentOrganization?.displayNameZh || ''
        }),
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    container: {
      backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      maxWidth: 320,
      width: '100%',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : theme.colors.text.primary,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    qrContainer: {
      backgroundColor: '#FFFFFF',
      padding: 20,
      borderRadius: 16,
      marginBottom: 20,
      alignItems: 'center',
      // 阴影效果
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    userInfo: {
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'rgba(255, 107, 53, 0.2)',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#111827',
      marginBottom: 4,
      textAlign: 'center',
    },
    userEmail: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    orgSchoolInfo: {
      alignItems: 'center',
      marginBottom: 12,
    },
    combinedOrgSchoolText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#D1D5DB' : '#374151',
      textAlign: 'center',
    },
    separator: {
      fontSize: 14,
      fontWeight: '400',
      color: isDarkMode ? '#9CA3AF' : '#9CA3AF',
    },
    schoolNameInline: {
      fontSize: 14,
      fontWeight: '400',
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    },
    organizationInfo: {
      alignItems: 'center',
      marginBottom: 12,
    },
    organizationName: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#D1D5DB' : '#374151',
      textAlign: 'center',
    },
    schoolInfo: {
      alignItems: 'center',
      marginBottom: 12,
    },
    schoolName: {
      fontSize: 13,
      fontWeight: '400',
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    positionInfo: {
      alignItems: 'center',
      marginBottom: 20,
    },
    positionName: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FF6B35',
      textAlign: 'center',
      backgroundColor: isDarkMode ? 'rgba(255, 107, 53, 0.1)' : 'rgba(255, 107, 53, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    qrCodeWrapper: {
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      alignItems: 'center',
    },
    qrInfo: {
      marginTop: 12,
      alignItems: 'center',
    },
    qrLabel: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },
    saveButton: {
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
    },
    shareButton: {
      backgroundColor: '#FF6B35',
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#374151',
    },
    shareButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 32 }} />
            <Text style={styles.title}>
              {t('qr.identity.title', '我的身份码')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDarkMode ? '#FFFFFF' : theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* QR Code Container */}
          <View
            style={styles.qrContainer}
          >
            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#9CA3AF" />
              </View>
              <Text style={styles.userName}>
                {userData.legalName}
              </Text>
              {userData.nickName && (
                <Text style={styles.userEmail}>
                  {userData.nickName}
                </Text>
              )}
              {userData.userName && (
                <Text style={styles.userEmail}>
                  {userData.userName}
                </Text>
              )}
            </View>

            {/* Organization & School Info - Combined */}
            <View style={styles.orgSchoolInfo}>
              {userData.currentOrganization && userData.school ? (
                <Text style={styles.combinedOrgSchoolText}>
                  {userData.currentOrganization.displayNameZh}
                  <Text style={styles.separator}> • </Text>
                  <Text style={styles.schoolNameInline}>
                    {userData.school.name}
                  </Text>
                </Text>
              ) : userData.currentOrganization ? (
                <Text style={styles.organizationName}>
                  {userData.currentOrganization.displayNameZh}
                </Text>
              ) : userData.school ? (
                <Text style={styles.schoolName}>
                  {userData.school.name}
                </Text>
              ) : null}
            </View>

            {/* Position Info */}
            {userData.position && (
              <View style={styles.positionInfo}>
                <Text style={styles.positionName}>
                  {userData.position.displayName}
                </Text>
              </View>
            )}

            {/* QR Code */}
            <View style={styles.qrCodeWrapper}>
              {(() => {
                try {
                  return (
                    <QRCode
                      value={generateQRContent()}
                      size={qrSize}
                      backgroundColor="#FFFFFF"
                      color="#000000"
                      logoSize={qrSize * 0.2}
                      logoMargin={2}
                      logoBorderRadius={8}
                      quietZone={10}
                    />
                  );
                } catch (error) {
                  console.error('QRCode组件渲染失败:', error);
                  return (
                    <View style={{ width: qrSize, height: qrSize, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="qr-code-outline" size={qrSize * 0.5} color="#9CA3AF" />
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>二维码生成失败</Text>
                    </View>
                  );
                }
              })()}
              <View style={styles.qrInfo}>
                <Text style={styles.qrLabel}>
                  {t('qr.identity.scan_instruction', '扫描二维码查看我的信息')}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.saveButton,
                isSaving && styles.disabledButton,
              ]}
              onPress={handleSaveQRCode}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSaving ? "hourglass-outline" : "download-outline"}
                size={16}
                color={isDarkMode ? '#FFFFFF' : '#374151'}
              />
              <Text style={styles.saveButtonText}>
                {isSaving ? t('qr.actions.saving') : t('qr.actions.save')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShareQRCode}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={16} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>
                {t('qr.actions.share')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UserIdentityQRModal;