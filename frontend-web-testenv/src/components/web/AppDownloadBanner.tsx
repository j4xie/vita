/**
 * App下载横幅组件 - 仅iOS设备显示
 * 参考DealMoon设计，首次访问显示，关闭后不再出现
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { detectDevice } from '../../utils/deviceDetection';
import {
  shouldShowTopBanner,
  markBannerAsShown,
  markBannerAsDismissed,
  handleAppDownload,
  trackUserBehavior,
  AppStoreRegion,
  APP_STORE_CONFIG
} from '../../utils/appPromoBanner';

interface AppDownloadBannerProps {
  onClose?: () => void;
}

export const AppDownloadBanner: React.FC<AppDownloadBannerProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showRegionSelection, setShowRegionSelection] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const checkShouldShow = async () => {
      const device = detectDevice();

      // 只在iOS设备显示
      if (!device.shouldShowAppBanner) {
        return;
      }

      const shouldShow = await shouldShowTopBanner();
      if (shouldShow) {
        setIsVisible(true);
        await markBannerAsShown();
      }
    };

    checkShouldShow();
  }, []);

  const handleClose = async () => {
    setIsClosing(true);

    // 记录用户关闭行为
    await trackUserBehavior('banner_closed', 'top_banner');
    await markBannerAsDismissed();

    // 动画效果
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  const handleDownloadClick = async () => {
    setIsDetecting(true);

    try {
      await handleAppDownload('top_banner');
    } catch (error) {
      console.error('❌ 下载处理失败，显示区域选择:', error);
      setShowRegionSelection(true);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRegionSelect = async (region: AppStoreRegion) => {
    setShowRegionSelection(false);
    setIsDetecting(true);

    try {
      await handleAppDownload('top_banner', region);
    } catch (error) {
      console.error('❌ 区域选择下载失败:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  // 不显示横幅
  if (!isVisible) {
    return null;
  }

  // 区域选择界面
  if (showRegionSelection) {
    return (
      <View style={[styles.container, styles.regionSelectionContainer]}>
        <View style={styles.regionContent}>
          {/* 标题 */}
          <Text style={styles.regionTitle}>
            {t('appDownload.regionSelection.title', '选择您的App Store区域')}
          </Text>

          {/* 区域选项 */}
          <View style={styles.regionOptions}>
            {/* 中国区 */}
            <TouchableOpacity
              style={styles.regionOption}
              onPress={() => handleRegionSelect('CN')}
              activeOpacity={0.7}
            >
              <Text style={styles.regionFlag}>🇨🇳</Text>
              <View style={styles.regionTextContainer}>
                <Text style={styles.regionName}>
                  {t('appDownload.regionSelection.china', '中国大陆 App Store')}
                </Text>
                <Text style={styles.regionHint}>
                  {t('appDownload.regionSelection.chinaHint', '如果您使用中国 Apple ID')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* 美国区 */}
            <TouchableOpacity
              style={styles.regionOption}
              onPress={() => handleRegionSelect('US')}
              activeOpacity={0.7}
            >
              <Text style={styles.regionFlag}>🇺🇸</Text>
              <View style={styles.regionTextContainer}>
                <Text style={styles.regionName}>
                  {t('appDownload.regionSelection.us', 'United States App Store')}
                </Text>
                <Text style={styles.regionHint}>
                  {t('appDownload.regionSelection.usHint', 'If you use US Apple ID')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 关闭按钮 */}
          <TouchableOpacity
            style={styles.regionCloseButton}
            onPress={() => setShowRegionSelection(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.regionCloseText}>
              {t('common.cancel', '取消')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 正常的横幅界面
  return (
    <View style={[styles.container, isClosing && styles.closing]}>
      {/* Logo和文本区域 */}
      <View style={styles.content}>
        {/* 西柚Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Image
              source={require('../../assets/logos/pomelo-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 文本信息 */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {t('appDownload.banner.title', '西柚Pomelo')}
          </Text>
          <Text style={styles.subtitle}>
            {t('appDownload.banner.subtitle', '在App中获得更好体验')}
          </Text>
        </View>

        {/* 打开按钮 */}
        <TouchableOpacity
          style={[styles.openButton, isDetecting && styles.openButtonDisabled]}
          onPress={handleDownloadClick}
          activeOpacity={0.7}
          disabled={isDetecting}
        >
          <Text style={styles.openButtonText}>
            {isDetecting
              ? t('appDownload.banner.detecting', '检测中...')
              : t('appDownload.banner.openButton', '打开')
            }
          </Text>
        </TouchableOpacity>

        {/* 关闭按钮 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 0, // 移除黑色边框线
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 1000,
    ...(Platform.OS === 'web' && {
      position: 'sticky' as any,
      top: 0,
    }),
  },
  closing: {
    opacity: 0,
    transform: [{ translateY: -10 }],
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'transparent', // 透明背景，去掉白边
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  openButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  openButtonDisabled: {
    opacity: 0.6,
  },
  // 区域选择界面样式
  regionSelectionContainer: {
    paddingVertical: 20,
    minHeight: 120,
  },
  regionContent: {
    alignItems: 'center' as const,
  },
  regionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  regionOptions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  regionOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  regionFlag: {
    fontSize: 24,
    marginRight: 8,
  },
  regionTextContainer: {
    flex: 1,
  },
  regionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  regionHint: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  regionCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  regionCloseText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
};

// Web端CSS增强
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    .app-download-banner {
      transition: opacity 0.2s ease-out, transform 0.2s ease-out;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background: rgba(248, 249, 250, 0.95) !important;
    }

    .app-download-banner:hover {
      background: rgba(248, 249, 250, 1) !important;
    }

    .app-download-banner-closing {
      opacity: 0 !important;
      transform: translateY(-10px) !important;
    }

    @media (max-width: 480px) {
      .app-download-banner {
        padding: 8px 12px !important;
      }
    }
  `;
  document.head.appendChild(style);
}