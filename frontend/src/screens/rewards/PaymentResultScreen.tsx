import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { paymentAPI } from '../../services/paymentAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../theme';

/**
 * Payment Result Screen
 * Queries payment status and displays the result.
 * Supports stripe (immediate confirmation), alipay (polling), and points (immediate).
 */
export const PaymentResultScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const { user, refreshUserInfo } = useUser();

  const orderId = route.params?.orderId;
  const productName = route.params?.productName;
  const paymentMethod: 'stripe' | 'alipay' | 'points' = route.params?.paymentMethod ?? 'alipay';
  const pvsaFormData = route.params?.pvsaFormData as Record<string, string> | undefined;
  const pvsaActivityId = route.params?.pvsaActivityId as number | undefined;
  const isPVSAFlow = !!pvsaActivityId;

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'cancelled' | 'refunded'>('pending');
  const [pollCount, setPollCount] = useState(0);
  const pvsaSubmittedRef = useRef(false);

  // Stripe / Points: SDK completion means confirmed success, no polling needed
  useEffect(() => {
    if (paymentMethod === 'stripe' || paymentMethod === 'points') {
      setPaymentStatus('paid');
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [paymentMethod]);

  // Alipay: poll the backend for payment status
  useEffect(() => {
    if (paymentMethod !== 'alipay') return;
    if (!orderId) {
      setLoading(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await paymentAPI.queryPaymentStatus({ orderId });
        if (response.code === 200 && response.data) {
          const status = response.data.status;
          setPaymentStatus(status);
          if (status === 'paid') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setLoading(false);
          } else if (status === 'cancelled') {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('[Payment] Failed to query status:', error);
      }
    };

    checkPaymentStatus();

    const interval = setInterval(() => {
      setPollCount(prev => {
        const newCount = prev + 1;
        if (newCount >= 20) {
          setLoading(false);
          clearInterval(interval);
          return prev;
        }
        checkPaymentStatus();
        return newCount;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, paymentMethod]);

  // Refresh user info after payment success
  useEffect(() => {
    if (paymentStatus === 'paid') {
      refreshUserInfo().catch((e) =>
        console.warn('[PaymentResult] Failed to refresh user info:', e)
      );
    }
  }, [paymentStatus]);

  // Submit PVSA form data after payment success
  useEffect(() => {
    if (paymentStatus !== 'paid') return;
    if (!pvsaFormData || !pvsaActivityId || !user?.id) return;
    if (pvsaSubmittedRef.current) return;
    pvsaSubmittedRef.current = true;

    (async () => {
      try {
        await pomeloXAPI.submitActivityRegistration(pvsaActivityId, Number(user.id), pvsaFormData);
        DeviceEventEmitter.emit('activityRegistrationChanged', { activityId: pvsaActivityId });
      } catch (e) {
        console.warn('[PaymentResult] PVSA form submission failed:', e);
      }
    })();
  }, [paymentStatus, pvsaFormData, pvsaActivityId, user?.id]);

  const renderContent = () => {
    if (loading && paymentStatus === 'pending') {
      const waitingDesc = paymentMethod === 'stripe'
        ? t('rewards.payment.waiting_stripe')
        : t('rewards.payment.waiting_alipay');

      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? '#FF8A65' : theme.colors.primary} />
          <Text style={[styles.statusTitle, isDarkMode && styles.statusTitleDark]}>
            {t('rewards.payment.waiting')}
          </Text>
          <Text style={[styles.statusDesc, isDarkMode && styles.statusDescDark]}>
            {waitingDesc}
          </Text>
          {/* Polling progress for Alipay */}
          {paymentMethod === 'alipay' && pollCount > 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.pollProgress}>
              <View style={[styles.pollBarBg, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                <View style={[styles.pollBarFill, { width: `${Math.min((pollCount / 20) * 100, 100)}%` }]} />
              </View>
              <Text style={[styles.pollText, isDarkMode && { color: '#9CA3AF' }]}>
                {t('rewards.payment.checking_status', { current: pollCount, total: 20, defaultValue: `Checking... ${pollCount}/20` })}
              </Text>
            </Animated.View>
          )}
        </View>
      );
    }

    if (paymentStatus === 'paid') {
      // PVSA-specific enriched success state
      if (isPVSAFlow) {
        return (
          <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.statusContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500'] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name="ribbon" size={44} color="#fff" />
            </LinearGradient>
            <Text style={[styles.statusTitle, isDarkMode && styles.statusTitleDark]}>
              {t('rewards.payment.pvsa_success_title', 'Application Submitted!')}
            </Text>
            <Text style={[styles.statusDesc, isDarkMode && styles.statusDescDark]}>
              {t('rewards.payment.pvsa_success_desc', 'Your certificate application has been submitted and payment confirmed.')}
            </Text>

            {/* Product badge */}
            {productName && (
              <View style={[styles.productBadge, isDarkMode && { backgroundColor: '#2C2C2E' }]}>
                <Ionicons name="document-text" size={16} color={isDarkMode ? '#FF8A65' : theme.colors.primary} />
                <Text style={[styles.productBadgeText, isDarkMode && { color: '#FF8A65' }]}>{productName}</Text>
              </View>
            )}

            {/* What happens next */}
            <View style={[styles.nextStepsCard, isDarkMode && { backgroundColor: '#1C1C1E' }]}>
              <Text style={[styles.nextStepsTitle, isDarkMode && { color: '#fff' }]}>
                {t('rewards.payment.pvsa_next_steps_title', 'What happens next?')}
              </Text>
              <View style={styles.nextStepItem}>
                <View style={[styles.stepDot, { backgroundColor: '#34C759' }]} />
                <Text style={[styles.nextStepText, isDarkMode && { color: '#9CA3AF' }]}>
                  {t('rewards.payment.pvsa_step1', 'Your application will be reviewed by administrators')}
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <View style={[styles.stepDot, { backgroundColor: '#FF9500' }]} />
                <Text style={[styles.nextStepText, isDarkMode && { color: '#9CA3AF' }]}>
                  {t('rewards.payment.pvsa_step2', 'Certificate will be processed and shipped to your address')}
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <View style={[styles.stepDot, { backgroundColor: '#007AFF' }]} />
                <Text style={[styles.nextStepText, isDarkMode && { color: '#9CA3AF' }]}>
                  {t('rewards.payment.pvsa_step3', 'You will be notified when your certificate is ready')}
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      }

      // Generic success state
      return (
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.statusContainer}>
          <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.statusTitle, isDarkMode && styles.statusTitleDark]}>
            {t('rewards.payment.success')}
          </Text>
          <Text style={[styles.statusDesc, isDarkMode && styles.statusDescDark]}>
            {productName
              ? t('rewards.payment.success_exchange', { product: productName })
              : t('rewards.payment.success_default')}
          </Text>
        </Animated.View>
      );
    }

    if (paymentStatus === 'cancelled') {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.iconCircle, styles.iconCircleCancelled]}>
            <Ionicons name="close" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.statusTitle, isDarkMode && styles.statusTitleDark]}>
            {t('rewards.payment.cancelled')}
          </Text>
          <Text style={[styles.statusDesc, isDarkMode && styles.statusDescDark]}>
            {t('rewards.payment.cancelled_desc')}
          </Text>
        </View>
      );
    }

    // Timeout / processing
    return (
      <View style={styles.statusContainer}>
        <View style={[styles.iconCircle, styles.iconCircleWarning]}>
          <Ionicons name="time" size={48} color="#FFFFFF" />
        </View>
        <Text style={[styles.statusTitle, isDarkMode && styles.statusTitleDark]}>
          {t('rewards.payment.processing')}
        </Text>
        <Text style={[styles.statusDesc, isDarkMode && styles.statusDescDark]}>
          {t('rewards.payment.processing_desc')}
        </Text>
      </View>
    );
  };

  const handleButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (paymentStatus === 'paid') {
      if (pvsaActivityId) {
        // Navigate to Profile tab — CertificateList is inside Profile stack
        navigation.navigate('Main', { screen: 'Profile', params: { screen: 'CertificateList' } });
      } else {
        navigation.navigate('Main');
      }
    } else if (paymentStatus === 'cancelled') {
      navigation.goBack();
    } else {
      navigation.navigate('MyOrders');
    }
  };

  const getButtonText = () => {
    if (paymentStatus === 'paid') {
      if (isPVSAFlow) return t('rewards.payment.view_application', 'View My Applications');
      return t('rewards.payment.return_home');
    }
    if (paymentStatus === 'cancelled') return t('rewards.payment.retry_payment');
    return t('rewards.payment.view_orders');
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          {t('rewards.payment.result_title')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!loading && (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, isDarkMode && styles.primaryButtonDark]}
              onPress={handleButtonPress}
            >
              <Text style={[styles.primaryButtonText, isDarkMode && styles.primaryButtonTextDark]}>
                {getButtonText()}
              </Text>
            </TouchableOpacity>

            {paymentStatus === 'paid' && (
              <TouchableOpacity
                style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]}
                onPress={() => navigation.navigate('MyOrders')}
              >
                <Text style={[styles.secondaryButtonText, isDarkMode && styles.secondaryButtonTextDark]}>
                  {t('rewards.payment.view_orders')}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {loading && (
          <TouchableOpacity
            style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                t('rewards.payment.leave_temporarily'),
                t('rewards.payment.leave_hint'),
                [
                  { text: t('rewards.payment.continue_waiting'), style: 'cancel' },
                  {
                    text: t('rewards.payment.view_orders'),
                    onPress: () => navigation.navigate('MyOrders'),
                  },
                ]
              );
            }}
          >
            <Text style={[styles.secondaryButtonText, isDarkMode && styles.secondaryButtonTextDark]}>
              {t('rewards.payment.leave_temporarily')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerDark: {
    borderBottomColor: '#38383A',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statusContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircleSuccess: {
    backgroundColor: '#34C759',
  },
  iconCircleCancelled: {
    backgroundColor: '#FF3B30',
  },
  iconCircleWarning: {
    backgroundColor: '#FF9500',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusTitleDark: {
    color: '#FFFFFF',
  },
  statusDesc: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  statusDescDark: {
    color: '#9CA3AF',
  },

  // PVSA-specific styles
  productBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  productBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  nextStepsCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  nextStepsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 14,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  nextStepText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },

  // Alipay polling progress
  pollProgress: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  pollBarBg: {
    width: '60%',
    height: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  pollBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  pollText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDark: {
    backgroundColor: '#FFFFFF',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  primaryButtonTextDark: {
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonDark: {
    backgroundColor: '#1C1C1E',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  secondaryButtonTextDark: {
    color: '#FFFFFF',
  },
});
