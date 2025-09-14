/**
 * Web端区域切换弹窗组件 - React Native Web版本
 * 支持区域切换和隐私条款签署流程
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/index';
import UserRegionPreferences, { UserRegionCode } from '../../services/UserRegionPreferences';
import { PrivacyAgreementModal } from './PrivacyAgreementModal';

interface RegionSwitchModalProps {
  visible: boolean;
  onClose: () => void;
  onRegionChanged: (newRegion: UserRegionCode) => void;
}

export const RegionSwitchModal: React.FC<RegionSwitchModalProps> = ({
  visible,
  onClose,
  onRegionChanged,
}) => {
  const { t } = useTranslation();

  // Component states
  const [currentRegion, setCurrentRegion] = useState<UserRegionCode>('china');
  const [loading, setLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<UserRegionCode | null>(null);
  const [privacySignedRegions, setPrivacySignedRegions] = useState<UserRegionCode[]>([]);

  // Load initial data
  useEffect(() => {
    if (visible) {
      loadRegionData();
    }
  }, [visible]);

  const loadRegionData = async () => {
    try {
      const preferences = await UserRegionPreferences.getPreferences();
      if (preferences) {
        setCurrentRegion(preferences.currentRegion);
        setPrivacySignedRegions(preferences.privacySignedRegions);
      }
    } catch (error) {
      console.error('加载区域数据失败:', error);
    }
  };

  const handleRegionSelect = async (region: UserRegionCode) => {
    if (region === currentRegion) {
      return; // 选择相同区域，无需处理
    }

    try {
      setLoading(true);

      // 检查是否已签署该区域的隐私条款
      const hasSigned = await UserRegionPreferences.hasSignedPrivacyFor(region);
      
      if (!hasSigned) {
        // 需要签署隐私条款
        setPendingRegion(region);
        setShowPrivacyModal(true);
      } else {
        // 直接切换区域
        await switchRegion(region);
      }
    } catch (error) {
      console.error('处理区域选择失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchRegion = async (region: UserRegionCode) => {
    try {
      setLoading(true);
      await UserRegionPreferences.updateCurrentRegion(region);
      setCurrentRegion(region);
      onRegionChanged(region);
      onClose();
    } catch (error) {
      console.error('切换区域失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyAccept = async () => {
    if (!pendingRegion) return;

    try {
      setLoading(true);
      
      // 标记隐私条款已签署
      await UserRegionPreferences.markPrivacySigned(pendingRegion);
      
      // 更新本地状态
      setPrivacySignedRegions(prev => [...prev, pendingRegion]);
      
      // 关闭隐私弹窗
      setShowPrivacyModal(false);
      
      // 执行区域切换
      await switchRegion(pendingRegion);
      
      setPendingRegion(null);
    } catch (error) {
      console.error('处理隐私条款接受失败:', error);
      setShowPrivacyModal(false);
      setPendingRegion(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyModal(false);
    setPendingRegion(null);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  };

  const regions: { code: UserRegionCode; name: string; icon: string; description: string }[] = [
    {
      code: 'china',
      name: t('regions.china.name', '中国'),
      icon: '🇨🇳',
      description: t('regions.china.description', '适用中华人民共和国相关法律法规'),
    },
    {
      code: 'usa',
      name: t('regions.usa.name', '美国'),
      icon: '🇺🇸',
      description: t('regions.usa.description', '适用美国联邦和州相关法律法规'),
    },
  ];

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>📍</Text>
                  </View>
                  <Text style={styles.title}>
                    {t('profile.region_switch.title', '选择地区')}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t('profile.region_switch.subtitle', '切换到不同地区将使用相应的隐私政策')}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={theme.colors.text.secondary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Region Options */}
              <View style={styles.content}>
                {regions.map((region) => (
                  <TouchableOpacity
                    key={region.code}
                    style={[
                      styles.regionOption,
                      currentRegion === region.code && styles.regionOptionActive,
                      loading && styles.regionOptionDisabled,
                    ]}
                    onPress={() => handleRegionSelect(region.code)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.regionContent}>
                      <View style={styles.regionLeft}>
                        <Text style={styles.regionIcon}>{region.icon}</Text>
                        <View style={styles.regionInfo}>
                          <Text style={styles.regionName}>
                            {region.name}
                          </Text>
                          <Text style={styles.regionDescription}>
                            {region.description}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.regionRight}>
                        {currentRegion === region.code && (
                          <Ionicons 
                            name="checkmark-circle" 
                            size={24} 
                            color={theme.colors.primary} 
                          />
                        )}
                        
                        {/* 隐私条款签署状态 */}
                        {privacySignedRegions.includes(region.code) && (
                          <View style={styles.privacySignedIndicator}>
                            <Ionicons 
                              name="shield-checkmark" 
                              size={16} 
                              color={theme.colors.success} 
                            />
                            <Text style={styles.privacySignedText}>
                              {t('profile.region_switch.privacy_signed', '已签署')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.footerInfo}>
                  <Ionicons 
                    name="information-circle-outline" 
                    size={16} 
                    color={theme.colors.text.secondary} 
                  />
                  <Text style={styles.footerText}>
                    {t('profile.region_switch.privacy_notice', '切换地区时如未签署相应隐私政策，将需要重新签署')}
                  </Text>
                </View>
              </View>

              {/* Loading Overlay */}
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>
                    {t('profile.region_switch.loading', '处理中...')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Privacy Agreement Modal */}
      <PrivacyAgreementModal
        visible={showPrivacyModal}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
        userArea={pendingRegion === 'china' ? 'zh' : 'en'}
        allowRegionSwitch={false}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    // Web端优化
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }),
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    minHeight: 400,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    overflow: 'hidden',
    ...theme.shadows.lg,
    // Web端特定样式
    ...(Platform.OS === 'web' && {
      maxWidth: '90vw',
      maxHeight: '90vh',
      minWidth: 400,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  closeButton: {
    padding: theme.spacing[2],
    marginTop: -theme.spacing[2],
    marginRight: -theme.spacing[2],
  },
  content: {
    padding: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
    // Web端优化间距
    ...(Platform.OS === 'web' && {
      paddingHorizontal: theme.spacing[8],
    }),
  },
  regionOption: {
    borderWidth: 2,
    borderColor: theme.colors.border.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.secondary,
    minHeight: 80,
    // Web端优化触摸体验
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },
  regionOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  regionOptionDisabled: {
    opacity: 0.6,
  },
  regionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  regionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  regionIcon: {
    fontSize: 28,
    marginRight: theme.spacing[3],
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  regionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  regionRight: {
    alignItems: 'flex-end',
  },
  privacySignedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[1],
  },
  privacySignedText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing[1],
    color: theme.colors.success,
  },
  footer: {
    padding: theme.spacing[6],
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[3],
  },
});

export default RegionSwitchModal;