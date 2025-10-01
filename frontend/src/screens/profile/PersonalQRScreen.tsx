import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Share,
  Dimensions,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { UserIdentityData } from '../../types/userIdentity';
import { mapUserToIdentityData } from '../../utils/userIdentityMapper';
import { generateUserQRContent } from '../../utils/userIdentityMapper';

const { width: screenWidth } = Dimensions.get('window');
const qrSize = Math.min(screenWidth * 0.50, 220);

export const PersonalQRScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const { user, isAuthenticated } = useUser();

  const [isSaving, setIsSaving] = useState(false);

  // 生成用户身份数据
  const generateUserIdentityData = (): UserIdentityData => {
    if (!user || !isAuthenticated) {
      return mapUserToIdentityData(null);
    }

    const isEnglish = t('common.brand.name') === 'Pomelo';
    return mapUserToIdentityData(user, isEnglish);
  };

  const userData = generateUserIdentityData();

  // 生成QR码内容 - 使用简洁的短ID格式
  const generateQRContent = (): string => {
    try {
      if (!userData || userData.userId === 'guest') {
        return 'VG_GUEST_NO_QR';
      }
      // ✅ 新格式：VG_USER_ID_{userId}
      // 优点：数据量小（约20字节），二维码清晰简洁
      // 需要：扫描时联网查询用户信息
      return `VG_USER_ID_${userData.userId}`;
    } catch (error) {
      console.error('QR码内容生成失败:', error);
      return `VG_USER_ERROR_${userData?.userId || 'unknown'}`;
    }
  };

  // 复制用户ID
  const handleCopyUserId = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      Clipboard.setString(userData.userId);
      const isEnglish = t('common.brand.name') === 'Pomelo';
      Alert.alert(
        isEnglish ? 'Copied to clipboard' : '已复制到剪贴板',
        '',
        [{ text: t('common.got_it', isEnglish ? 'OK' : '我知道了') }]
      );
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 分享二维码
  const handleShareQRCode = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const shareContent = {
        title: t('qr.share.title'),
        message: t('qr.share.message', {
          name: userData.legalName,
          organization: userData.currentOrganization?.displayNameZh || '',
        }),
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  // 保存到相册
  const handleSaveToAlbum = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const isEnglish = t('common.brand.name') === 'Pomelo';
      Alert.alert(
        t('common.feature_developing', isEnglish ? 'Feature Under Development' : '功能开发中'),
        t('qr.save_feature_developing', isEnglish ? 'QR code save feature is under development' : '二维码保存功能正在开发中，敬请期待'),
        [{ text: t('common.got_it', isEnglish ? 'OK' : '我知道了') }]
      );
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 扫描他人二维码
  const handleScanOthers = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    navigation.navigate('QRScanner' as never);
  };

  // 关闭页面
  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000000' : '#F5F5F5',
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#000000',
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
    },

    // 用户信息区
    userInfoCard: {
      backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDarkMode ? '#2C2C2E' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: 'rgba(255, 107, 53, 0.2)',
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#000000',
      marginBottom: 8,
      textAlign: 'center',
    },
    userIdContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 12,
    },
    userId: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      marginRight: 6,
    },
    organizationInfo: {
      alignItems: 'center',
    },
    organizationText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#D1D5DB' : '#374151',
      textAlign: 'center',
      marginBottom: 4,
    },
    positionBadge: {
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    positionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FF6B35',
    },

    // 二维码展示区
    qrCodeCard: {
      backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    qrCodeWrapper: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    qrCodePlaceholder: {
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
    },
    placeholderText: {
      color: '#6B7280',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },
    descriptionText: {
      fontSize: 14,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 12,
    },
    networkInfoText: {
      fontSize: 13,
      color: isDarkMode ? '#6B7280' : '#9CA3AF',
      textAlign: 'center',
      marginTop: 8,
    },

    // 操作按钮区
    actionsContainer: {
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    primaryActionButton: {
      backgroundColor: '#FF6B35',
      borderColor: '#FF6B35',
    },
    actionButtonIcon: {
      marginRight: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#FFFFFF' : '#000000',
    },
    primaryActionButtonText: {
      color: '#FFFFFF',
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.headerTitle}>
            {t('common.brand.name') === 'Pomelo' ? 'My QR Code' : '我的二维码'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 用户信息卡片 */}
          <View style={styles.userInfoCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color="#9CA3AF" />
            </View>
            <Text style={styles.userName}>{userData.legalName}</Text>

            {/* 用户ID */}
            <TouchableOpacity
              style={styles.userIdContainer}
              onPress={handleCopyUserId}
              activeOpacity={0.7}
            >
              <Text style={styles.userId}>
                {userData.userId.length > 12
                  ? `${userData.userId.substring(0, 6)}...${userData.userId.substring(
                      userData.userId.length - 6
                    )}`
                  : userData.userId}
              </Text>
              <Ionicons
                name="copy-outline"
                size={14}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>

            {/* 组织和学校信息 */}
            {(userData.currentOrganization || userData.school) && (
              <View style={styles.organizationInfo}>
                {userData.currentOrganization && userData.school ? (
                  <Text style={styles.organizationText}>
                    {userData.currentOrganization.displayNameZh} •{' '}
                    {userData.school.name}
                  </Text>
                ) : userData.currentOrganization ? (
                  <Text style={styles.organizationText}>
                    {userData.currentOrganization.displayNameZh}
                  </Text>
                ) : (
                  <Text style={styles.organizationText}>
                    {userData.school?.name}
                  </Text>
                )}

                {/* 职位信息 */}
                {userData.position && (
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>
                      {userData.position.displayName}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 二维码卡片 */}
          <View style={styles.qrCodeCard}>
            <View style={styles.qrCodeWrapper}>
              {(() => {
                try {
                  const qrContent = generateQRContent();

                  if (!qrContent || qrContent.length < 5) {
                    return (
                      <View
                        style={[
                          styles.qrCodePlaceholder,
                          { width: qrSize, height: qrSize },
                        ]}
                      >
                        <Ionicons
                          name="qr-code-outline"
                          size={qrSize * 0.5}
                          color="#9CA3AF"
                        />
                        <Text style={styles.placeholderText}>
                          {t('common.brand.name') === 'Pomelo' ? 'Error' : '错误'}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <QRCode
                      value={qrContent}
                      size={qrSize}
                      backgroundColor="#FFFFFF"
                      color="#000000"
                      quietZone={10}
                    />
                  );
                } catch (error) {
                  console.error('QR码渲染失败:', error);
                  return (
                    <View
                      style={[
                        styles.qrCodePlaceholder,
                        { width: qrSize, height: qrSize },
                      ]}
                    >
                      <Ionicons
                        name="qr-code-outline"
                        size={qrSize * 0.5}
                        color="#9CA3AF"
                      />
                      <Text style={styles.placeholderText}>
                        {t('common.brand.name') === 'Pomelo' ? 'Error' : '错误'}
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>

            <Text style={styles.descriptionText}>
              {t('common.brand.name') === 'Pomelo'
                ? 'Share your QR code to quickly show your identity information'
                : '分享二维码给他人，快速展示我的身份信息'}
            </Text>
            <Text style={styles.networkInfoText}>
              {t('common.brand.name') === 'Pomelo'
                ? 'Visible to all organization members'
                : '支持组织内所有成员查看'}
            </Text>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionsContainer}>
            {/* 扫描他人二维码 */}
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryActionButton]}
              onPress={handleScanOthers}
              activeOpacity={0.7}
            >
              <Ionicons
                name="scan-outline"
                size={20}
                color="#FFFFFF"
                style={styles.actionButtonIcon}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  styles.primaryActionButtonText,
                ]}
              >
                {t('common.brand.name') === 'Pomelo' ? 'Scan QR code' : '扫描他人二维码'}
              </Text>
            </TouchableOpacity>

            {/* 分享二维码 */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareQRCode}
              activeOpacity={0.7}
            >
              <Ionicons
                name="share-outline"
                size={20}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
                style={styles.actionButtonIcon}
              />
              <Text style={styles.actionButtonText}>
                {t('common.brand.name') === 'Pomelo' ? 'Share QR code' : '分享二维码'}
              </Text>
            </TouchableOpacity>

            {/* 保存到相册 */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                isSaving && styles.disabledButton,
              ]}
              onPress={handleSaveToAlbum}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSaving ? 'hourglass-outline' : 'download-outline'}
                size={20}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
                style={styles.actionButtonIcon}
              />
              <Text style={styles.actionButtonText}>
                {isSaving
                  ? t('common.brand.name') === 'Pomelo'
                    ? 'Saving...'
                    : '保存中...'
                  : t('common.brand.name') === 'Pomelo'
                  ? 'Save to album'
                  : '保存到相册'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PersonalQRScreen;
