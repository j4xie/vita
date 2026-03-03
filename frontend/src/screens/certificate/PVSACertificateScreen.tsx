import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { usePVSAForm } from '../../hooks/usePVSAForm';
import { StepIndicator } from '../../components/certificate/StepIndicator';
import { PVSAStep1BasicInfo } from './steps/PVSAStep1BasicInfo';
import { PVSAStep2Membership } from './steps/PVSAStep2Membership';
import { PVSAStep3Award } from './steps/PVSAStep3Award';
import { PVSAStep4Review } from './steps/PVSAStep4Review';
import { PVSACertificateRouteParams } from '../../types/certificate';
import { pvsaToOrderItem } from '../../types/order';

const TOTAL_STEPS = 4;

export const PVSACertificateScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;

  const { activityId, activityName } = (route.params as PVSACertificateRouteParams) || {};

  const {
    formState,
    dispatch,
    errors,
    setErrors,
    validateStep,
    getSubmitData,
    currentStep,
    setCurrentStep,
  } = usePVSAForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step labels for the StepIndicator
  const stepLabels = [
    t('profile.certificate.pvsa.steps.basic_info'),
    t('profile.certificate.pvsa.steps.membership'),
    t('profile.certificate.pvsa.steps.award'),
    t('profile.certificate.pvsa.steps.review'),
  ];

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------

  const handleGoBack = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    navigation.goBack();
  }, [navigation]);

  const handlePrevious = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as any);
    }
  }, [currentStep, setCurrentStep]);

  const handleNext = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    // Validate the current step before proceeding
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      // Show first error in an alert
      const firstErrorKey = Object.keys(stepErrors)[0];
      Alert.alert(
        t('common.error'),
        stepErrors[firstErrorKey],
        [{ text: t('common.got_it') }],
      );
      return;
    }

    setErrors({});
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((currentStep + 1) as any);
    }
  }, [currentStep, validateStep, setErrors, setCurrentStep, t]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Validate the final step
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      const firstErrorKey = Object.keys(stepErrors)[0];
      Alert.alert(
        t('common.error'),
        stepErrors[firstErrorKey],
        [{ text: t('common.got_it') }],
      );
      return;
    }

    if (!user?.id || !activityId) {
      Alert.alert(
        t('common.error'),
        t('common.user_info_incomplete'),
        [{ text: t('common.got_it') }],
      );
      return;
    }

    const packageType = formState.packageType as 'basic' | 'standard' | 'premium';
    if (!packageType) {
      Alert.alert(t('common.error'), t('profile.certificate.pvsa.validation.package_required'));
      return;
    }

    const orderItem = pvsaToOrderItem(activityId, packageType, activityName);
    const pvsaFormData = getSubmitData();

    // Map PVSA paymentMethod to OrderConfirm paymentMethod
    const preselectedPayment = formState.paymentMethod === 'alipay' ? 'alipay' : 'stripe';

    navigation.navigate('OrderConfirmGlobal', {
      orderItem,
      pvsaFormData,
      pvsaActivityId: activityId,
      preselectedPayment,
    });
  }, [currentStep, validateStep, setErrors, user, activityId, activityName, formState.packageType, formState.paymentMethod, getSubmitData, navigation, t]);

  // ---------------------------------------------------------------------------
  // Render step content
  // ---------------------------------------------------------------------------

  const renderStepContent = () => {
    const stepProps = { formState, dispatch, errors, setErrors };

    switch (currentStep) {
      case 0:
        return <PVSAStep1BasicInfo {...stepProps} />;
      case 1:
        return <PVSAStep2Membership {...stepProps} />;
      case 2:
        return <PVSAStep3Award {...stepProps} />;
      case 3:
        return (
          <PVSAStep4Review
            {...stepProps}
            onEditStep={(stepIndex) => setCurrentStep(stepIndex as any)}
          />
        );
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          isDarkMode && styles.headerDark,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={isDarkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}
          numberOfLines={1}
        >
          {t('profile.certificate.pvsa.title')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Step Indicator */}
      <View style={[styles.stepIndicatorContainer, isDarkMode && styles.stepIndicatorContainerDark]}>
        <StepIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={stepLabels}
        />
      </View>

      {/* Step Content */}
      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      >
        {renderStepContent()}
      </KeyboardAvoidingView>

      {/* Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomBar,
          isDarkMode && styles.bottomBarDark,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Previous Button */}
        {currentStep > 0 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonSecondary, isDarkMode && styles.navButtonSecondaryDark]}
            onPress={handlePrevious}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={isDarkMode ? '#F9A889' : theme.colors.primary}
            />
            <Text style={[styles.navButtonSecondaryText, isDarkMode && styles.navButtonSecondaryTextDark]}>
              {t('profile.certificate.pvsa.navigation.previous')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        {/* Next / Submit Button */}
        {currentStep < TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary]}
            onPress={handleNext}
            activeOpacity={0.7}
            testID="pvsa-next-btn"
            accessibilityLabel="Next"
          >
            <Text style={styles.navButtonPrimaryText}>
              {t('profile.certificate.pvsa.navigation.next')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              styles.navButtonSubmit,
              isSubmitting && styles.navButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.7}
            disabled={isSubmitting}
            testID="pvsa-submit-btn"
            accessibilityLabel="Submit and Pay"
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.navButtonPrimaryText}>
                  {t('profile.certificate.pvsa.step4.submitting')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.navButtonPrimaryText}>
                  {t('profile.certificate.pvsa.step4.submit')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  containerDark: {
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  headerDark: {
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },

  // Step indicator
  stepIndicatorContainer: {
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
  },
  stepIndicatorContainerDark: {
    backgroundColor: '#000000',
  },

  // Content
  contentContainer: {
    flex: 1,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#F5F5F5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  bottomBarDark: {
    backgroundColor: '#000000',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Navigation buttons
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    minHeight: 48,
  },
  navButtonPlaceholder: {
    minWidth: 120,
  },
  navButtonPrimary: {
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navButtonSubmit: {
    paddingHorizontal: 32,
  },
  navButtonDisabled: {
    opacity: 0.6,
  },
  navButtonSecondary: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  navButtonSecondaryDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  navButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  navButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: 2,
  },
  navButtonSecondaryTextDark: {
    color: '#F9A889',
  },
});

export default PVSACertificateScreen;
