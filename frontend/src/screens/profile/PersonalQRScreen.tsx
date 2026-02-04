import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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

  return (
    <View style={styles.container}>
      {/* Header with explicit safe area padding */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + 12,
          zIndex: 10
        }
      ]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('common.brand.name') === 'Pomelo' ? 'Profile/QR Code' : '身份/二维码'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 32 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Centered User Info */}
        <View style={styles.centeredUserInfo}>
          <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#1C1C1E' : '#E5E7EB' }]}>
            <Text style={[styles.avatarText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {userData.legalName?.charAt(0) || '管'}
            </Text>
          </View>
          <Text style={styles.userName}>{userData.legalName}</Text>

          {/* Points Display */}
          <View style={styles.pointsRow}>
            <Text style={styles.pointsText}>102</Text>
            <Ionicons name="leaf-outline" size={14} color="#FF6B35" />
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {(userData.currentOrganization || userData.school) && (
              <View style={[styles.badge, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}>
                <Text style={styles.badgeText}>
                  {userData.currentOrganization?.displayNameZh || userData.school?.name}
                </Text>
              </View>
            )}
            {userData.position && (
              <View style={[styles.badge, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' }]}>
                <Text style={styles.badgeText}>
                  {userData.position.displayName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* QR Code White Card */}
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
                  </View>
                );
              }
            })()}
          </View>

          <Text style={styles.descriptionText}>
            {t('common.brand.name') === 'Pomelo'
              ? 'Share your QR code to quickly show your identity information'
              : '展示此码以便其他成员快速识别您的身份'}
          </Text>
          <Text style={styles.networkInfoText}>
            {t('common.brand.name') === 'Pomelo'
              ? 'Visible to all organization members'
              : '组织内所有成员均可快速识别'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
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
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              {t('common.brand.name') === 'Pomelo' ? 'Scan QR Code' : '扫一扫识别码'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareQRCode}
            activeOpacity={0.7}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={isDarkMode ? '#FFFFFF' : '#374151'}
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>
              {t('common.brand.name') === 'Pomelo' ? 'Share QR Code' : '分享识别码'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSaveToAlbum}
            activeOpacity={0.7}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={isDarkMode ? '#FFFFFF' : '#374151'}
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>
              {t('common.brand.name') === 'Pomelo' ? 'Save to Album' : '保存到相册'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F2', // Light cream background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  centeredUserInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  qrCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  qrCodeWrapper: {
    marginBottom: 24,
  },
  qrCodePlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  networkInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  primaryActionButton: {
    backgroundColor: '#FF6F61',
    borderColor: '#FF6F61',
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
  },
});

export default PersonalQRScreen;
