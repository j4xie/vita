import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

export const RegisterChoiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleQRRegister = () => {
    navigation.navigate('QRScanner', { purpose: 'register' });
  };

  const handleNormalRegister = () => {
    navigation.navigate('RegisterForm', { hasReferralCode: false });
  };

  const handleSkip = () => {
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
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
              source={require('../../../assets/logos/vitaglobal-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>加入 VitaGlobal</Text>
          <Text style={styles.subtitle}>选择您的注册方式</Text>
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
                <Text style={styles.cardTitle}>推荐码注册</Text>
                <Text style={styles.cardDescription}>
                  扫描推荐码快速注册
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>推荐使用</Text>
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
                  普通注册
                </Text>
                <Text style={[styles.cardDescription, styles.secondaryCardDescription]}>
                  直接填写信息注册
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.disabled} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>注册后您可以：</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>报名参加各类精彩活动</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>获取活动核销二维码</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>管理您的报名记录</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.benefitText}>接收活动更新通知</Text>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          注册即表示您同意我们的
          <Text style={styles.termsLink}> 服务条款 </Text>
          和
          <Text style={styles.termsLink}> 隐私政策</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
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
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  skipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
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
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primary,
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
    width: 48,
    height: 48,
    tintColor: theme.colors.text.inverse,
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
    ...theme.shadows.md,
  },
  primaryCard: {
    backgroundColor: theme.colors.primary,
  },
  secondaryCard: {
    backgroundColor: theme.colors.text.inverse,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing[2],
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