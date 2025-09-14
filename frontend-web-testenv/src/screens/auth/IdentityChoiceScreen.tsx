import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';

interface RouteParams {
  registrationType?: 'phone' | 'invitation';
  referralCode?: string;
  hasReferralCode?: boolean;
  detectedRegion?: 'zh' | 'en';
  detectionResult?: any;
}

export const IdentityChoiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();

  const [selectedIdentity, setSelectedIdentity] = useState<'student' | 'parent' | null>(null);

  const {
    registrationType = 'phone',
    referralCode,
    hasReferralCode = false,
    detectedRegion,
    detectionResult
  } = route.params as RouteParams || {};

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (!selectedIdentity) {
      Alert.alert(t('common.error'), t('auth.register.identity.please_select'));
      return;
    }

    if (selectedIdentity === 'student') {
      // 学生注册：根据注册类型进入不同页面
      if (registrationType === 'invitation') {
        // 推荐码学生注册：进入专用推荐码页面
        navigation.navigate('InvitationStudentRegisterStep1', {
          registrationType,
          referralCode,
          hasReferralCode,
          detectedRegion,
          detectionResult,
          identity: 1, // 学生
        });
      } else {
        // 普通学生注册：进入专用普通注册页面
        navigation.navigate('NormalStudentRegister', {
          registrationType,
          referralCode,
          hasReferralCode,
          detectedRegion,
          detectionResult,
          identity: 1, // 学生
        });
      }
    } else {
      // 家长注册：根据注册类型进入不同页面
      if (registrationType === 'invitation') {
        // 推荐码家长注册：进入专用推荐码页面
        navigation.navigate('InvitationParentRegister', {
          referralCode,
          hasReferralCode,
          detectedRegion,
          detectionResult,
        });
      } else {
        // 普通家长注册：进入专用普通注册页面
        navigation.navigate('NormalParentRegister', {
          registrationType,
          referralCode,
          hasReferralCode,
          detectedRegion,
          detectionResult,
          identity: 2, // 家长
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={DAWN_GRADIENTS.skyCool} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.register.identity.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('auth.register.identity.who_are_you')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.identity.choose_description')}</Text>
        </View>

        {/* Identity Options */}
        <View style={styles.optionsSection}>
          {/* Student Option */}
          <TouchableOpacity
            style={[
              styles.identityCard,
              selectedIdentity === 'student' && styles.identityCardSelected
            ]}
            onPress={() => setSelectedIdentity('student')}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <View style={[
                styles.iconContainer,
                selectedIdentity === 'student' && styles.iconContainerSelected
              ]}>
                <Ionicons 
                  name="school" 
                  size={32} 
                  color={selectedIdentity === 'student' ? theme.colors.text.inverse : theme.colors.primary} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.cardTitle,
                  selectedIdentity === 'student' && styles.cardTitleSelected
                ]}>
                  {t('auth.register.identity.student')}
                </Text>
                <Text style={[
                  styles.cardDescription,
                  selectedIdentity === 'student' && styles.cardDescriptionSelected
                ]}>
                  {t('auth.register.identity.student_description')}
                </Text>
              </View>
              {selectedIdentity === 'student' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.text.inverse} />
              )}
            </View>
          </TouchableOpacity>

          {/* Parent Option */}
          <TouchableOpacity
            style={[
              styles.identityCard,
              selectedIdentity === 'parent' && styles.identityCardSelected
            ]}
            onPress={() => setSelectedIdentity('parent')}
            activeOpacity={0.9}
          >
            <View style={styles.cardContent}>
              <View style={[
                styles.iconContainer,
                selectedIdentity === 'parent' && styles.iconContainerSelected
              ]}>
                <Ionicons 
                  name="people" 
                  size={32} 
                  color={selectedIdentity === 'parent' ? theme.colors.text.inverse : theme.colors.primary} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[
                  styles.cardTitle,
                  selectedIdentity === 'parent' && styles.cardTitleSelected
                ]}>
                  {t('auth.register.identity.parent')}
                </Text>
                <Text style={[
                  styles.cardDescription,
                  selectedIdentity === 'parent' && styles.cardDescriptionSelected
                ]}>
                  {t('auth.register.identity.parent_description')}
                </Text>
              </View>
              {selectedIdentity === 'parent' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.text.inverse} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedIdentity && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedIdentity}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedIdentity && styles.continueButtonTextDisabled
            ]}>
              {t('auth.register.identity.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing[6],
  },
  titleSection: {
    alignItems: 'center',
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[8],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.4,
  },
  optionsSection: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing[4],
  },
  identityCard: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: theme.spacing[5],
    ...theme.shadows.sm,
  },
  identityCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  cardTitleSelected: {
    color: theme.colors.text.inverse,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },
  cardDescriptionSelected: {
    color: theme.colors.text.inverse,
    opacity: 0.9,
  },
  bottomSection: {
    paddingVertical: theme.spacing[6],
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.background.secondary,
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  continueButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
});