import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { paymentAPI } from '../../services/paymentAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';

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

  const { user } = useUser();

  const orderId = route.params?.orderId;
  const productName = route.params?.productName;
  const paymentMethod: 'stripe' | 'alipay' | 'points' = route.params?.paymentMethod ?? 'alipay';
  const pvsaFormData = route.params?.pvsaFormData as Record<string, string> | undefined;
  const pvsaActivityId = route.params?.pvsaActivityId as number | undefined;

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
        console.log('[Payment] Querying status for order:', orderId);

        const response = await paymentAPI.queryPaymentStatus({
          orderId,
        });

        if (response.code === 200 && response.data) {
          const status = response.data.status;
          console.log('[Payment] Status:', status);

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

    // Query once immediately
    checkPaymentStatus();

    // Poll every 3 seconds, up to 20 times (60 seconds)
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

  // Submit PVSA form data after payment success
  useEffect(() => {
    if (paymentStatus !== 'paid') return;
    if (!pvsaFormData || !pvsaActivityId || !user?.id) return;
    if (pvsaSubmittedRef.current) return;
    pvsaSubmittedRef.current = true;

    (async () => {
      try {
        console.log('[PaymentResult] Submitting PVSA form after payment success');
        await pomeloXAPI.submitActivityRegistration(pvsaActivityId, Number(user.id), pvsaFormData);
        DeviceEventEmitter.emit('activityRegistrationChanged', { activityId: pvsaActivityId });
        console.log('[PaymentResult] PVSA form submitted successfully');
      } catch (e) {
        console.warn('[PaymentResult] PVSA form submission failed:', e);
        // Don't block success state — form data is backed up in order remark
      }
    })();
  }, [paymentStatus, pvsaFormData, pvsaActivityId, user?.id]);

  // Render content based on payment status
  const renderContent = () => {
    if (loading && paymentStatus === 'pending') {
      const waitingDesc = paymentMethod === 'stripe'
        ? t('rewards.payment.waiting_stripe')
        : t('rewards.payment.waiting_alipay');

      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.statusTitle}>{t('rewards.payment.waiting')}</Text>
          <Text style={styles.statusDesc}>
            {waitingDesc}
          </Text>
        </View>
      );
    }

    if (paymentStatus === 'paid') {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.statusTitle}>{t('rewards.payment.success')}</Text>
          <Text style={styles.statusDesc}>
            {productName
              ? t('rewards.payment.success_exchange', { product: productName })
              : t('rewards.payment.success_default')}
          </Text>
        </View>
      );
    }

    if (paymentStatus === 'cancelled') {
      return (
        <View style={styles.statusContainer}>
          <View style={[styles.iconCircle, styles.iconCircleCancelled]}>
            <Ionicons name="close" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.statusTitle}>{t('rewards.payment.cancelled')}</Text>
          <Text style={styles.statusDesc}>
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
        <Text style={styles.statusTitle}>{t('rewards.payment.processing')}</Text>
        <Text style={styles.statusDesc}>
          {t('rewards.payment.processing_desc')}
        </Text>
      </View>
    );
  };

  const handleButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (paymentStatus === 'paid') {
      if (pvsaActivityId) {
        // PVSA flow: go back to certificate list
        navigation.navigate('Main', { screen: 'ProfileTab', params: { screen: 'CertificateList' } });
      } else {
        // Use 'Main' for RootStack-level navigation compatibility
        navigation.navigate('Main');
      }
    } else if (paymentStatus === 'cancelled') {
      navigation.goBack();
    } else {
      navigation.navigate('MyOrders');
    }
  };

  const getButtonText = () => {
    if (paymentStatus === 'paid') return t('rewards.payment.return_home');
    if (paymentStatus === 'cancelled') return t('rewards.payment.retry_payment');
    return t('rewards.payment.view_orders');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('rewards.payment.result_title')}</Text>
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
              style={styles.primaryButton}
              onPress={handleButtonPress}
            >
              <Text style={styles.primaryButtonText}>
                {getButtonText()}
              </Text>
            </TouchableOpacity>

            {paymentStatus === 'paid' && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('MyOrders')}
              >
                <Text style={styles.secondaryButtonText}>
                  {t('rewards.payment.view_orders')}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {loading && (
          <TouchableOpacity
            style={styles.secondaryButton}
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
            <Text style={styles.secondaryButtonText}>
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
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  statusContainer: {
    alignItems: 'center',
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
  statusDesc: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
});
