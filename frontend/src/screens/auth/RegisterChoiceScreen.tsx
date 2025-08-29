import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { PrivacyAgreementModal } from '../../components/modals/PrivacyAgreementModal';
import { TermsModal } from '../../components/modals/TermsModal';

export const RegisterChoiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy'>('terms');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleQRRegister = () => {
    navigation.navigate('QRScanner', { purpose: 'register' });
  };

  const handleNormalRegister = () => {
    // 显示隐私协议弹窗
    setShowPrivacyModal(true);
  };

  const handlePrivacyAccept = () => {
    setShowPrivacyModal(false);
    // 用户同意隐私协议后才能进入注册表单
    navigation.navigate('RegisterForm');
  };

  const handlePrivacyDecline = () => {
    setShowPrivacyModal(false);
    // 用户拒绝隐私协议，返回上一页面（通常是登录页面）
    navigation.goBack();
  };

  const handleSkip = () => {
    navigation.navigate('Main');
  };

  // 处理条款和隐私政策点击
  const handleTermsPress = (type: 'terms' | 'privacy') => {
    setTermsModalType(type);
    setTermsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('auth.login.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logos/pomelo-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>{t('auth.register.join_pomelo')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.choose_registration_method')}</Text>
        </View>

        {/* Registration Options */}
        <View style={styles.optionsSection}>
          {/* QR Code Registration - Primary */}
          <TouchableOpacity
            style={[styles.optionCard, styles.primaryCard]}
            onPress={handleQRRegister}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="qr-code" size={48} color={theme.colors.text.inverse} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{t('auth.register.referral_registration')}</Text>
                <Text style={styles.cardDescription}>
                  {t('auth.register.referral_description')}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('auth.register.referral_badge')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.inverse} />
            </View>
          </TouchableOpacity>

          {/* Normal Registration */}
          <TouchableOpacity
            style={[styles.optionCard, styles.secondaryCard]}
            onPress={handleNormalRegister}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, styles.secondaryIconContainer]}>
                <Ionicons name="person-add" size={40} color={theme.colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.cardTitle, styles.secondaryCardTitle]}>
                  {t('auth.register.normal_registration')}
                </Text>
                <Text style={[styles.cardDescription, styles.secondaryCardDescription]}>
                  {t('auth.register.normal_description')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>{t('auth.register.benefits_title')}</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>{t('auth.register.benefits.join_activities')}</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>{t('auth.register.benefits.get_qr_codes')}</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>{t('auth.register.benefits.manage_registrations')}</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>{t('auth.register.benefits.receive_notifications')}</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.terms}>
            {t('auth.register.terms_agreement')}
            <TouchableOpacity onPress={() => handleTermsPress('terms')}>
              <Text style={styles.termsLink}> {t('auth.register.terms_of_service')} </Text>
            </TouchableOpacity>
            {t('auth.register.and')}
            <TouchableOpacity onPress={() => handleTermsPress('privacy')}>
              <Text style={styles.termsLink}> {t('auth.register.privacy_policy')}</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>

      {/* Privacy Agreement Modal */}
      <PrivacyAgreementModal
        visible={showPrivacyModal}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
      />
      
      <TermsModal
        visible={termsModalVisible}
        type={termsModalType}
        onClose={() => setTermsModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
  },
  skipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
  },
  logoSection: {
    alignItems: 'center',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[8],
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  logoText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  logoImage: {
    width: 72,
    height: 72,
    // 移除tintColor，保持PomeloX logo原色
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  optionsSection: {
    marginBottom: theme.spacing[8],
  },
  optionCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    ...theme.shadows.sm,
  },
  primaryCard: {
    backgroundColor: theme.colors.primary, // 主色调背景
    borderColor: theme.colors.primary,
  },
  secondaryCard: {
    backgroundColor: '#E5E7EB', // 灰色背景  
    borderColor: '#D1D5DB', // 灰色边框
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  secondaryIconContainer: {
    backgroundColor: theme.colors.primary + '15',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing[1],
  },
  secondaryCardTitle: {
    color: theme.colors.text.primary,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing[2],
    opacity: 0.9,
  },
  secondaryCardDescription: {
    color: theme.colors.text.secondary,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  benefitsSection: {
    marginBottom: theme.spacing[6],
  },
  benefitsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  benefitText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
  termsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  terms: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});