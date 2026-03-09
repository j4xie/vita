/**
 * useStripePayment Hook
 * Stripe 支付 Hook
 *
 * 封装 Stripe SDK 的 initPaymentSheet + presentPaymentSheet
 * 在 Expo Go 等没有原生模块的环境中安全降级
 */

import { useState, useCallback } from 'react';

// 懒加载 Stripe SDK，原生模块不可用时不崩溃
let useStripe: any = null;
try {
  useStripe = require('@stripe/stripe-react-native').useStripe;
} catch (e) {
  console.log('[useStripePayment] Stripe SDK 原生模块不可用');
}

interface StripePaymentResult {
  success: boolean;
  error?: string;
}

interface UseStripePaymentReturn {
  processStripePayment: (clientSecret: string, merchantDisplayName?: string) => Promise<StripePaymentResult>;
  loading: boolean;
  isAvailable: boolean;
}

export const useStripePayment = (): UseStripePaymentReturn => {
  const stripe = useStripe ? useStripe() : null;
  const [loading, setLoading] = useState(false);

  const processStripePayment = useCallback(async (
    clientSecret: string,
    merchantDisplayName: string = 'PomeloX',
  ): Promise<StripePaymentResult> => {
    if (!stripe) {
      return {
        success: false,
        error: 'Stripe SDK not available. Please rebuild the app with native modules.',
      };
    }

    try {
      setLoading(true);

      console.log('[StripePayment] Initializing payment sheet...');

      // 1. Initialize payment sheet
      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName,
        defaultBillingDetails: {
          name: 'PomeloX User',
        },
        returnURL: 'pomelox://stripe-redirect',
      });

      if (initError) {
        console.error('[StripePayment] Init error:', initError);
        return {
          success: false,
          error: initError.message,
        };
      }

      console.log('[StripePayment] Payment sheet initialized, presenting...');

      // 2. Present payment sheet
      const { error: presentError } = await stripe.presentPaymentSheet();

      if (presentError) {
        console.log('[StripePayment] Present error:', presentError);

        if (presentError.code === 'Canceled') {
          return {
            success: false,
            error: 'cancelled',
          };
        }

        return {
          success: false,
          error: presentError.message,
        };
      }

      console.log('[StripePayment] Payment successful!');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      console.error('[StripePayment] Unexpected error:', message);
      return {
        success: false,
        error: message,
      };
    } finally {
      setLoading(false);
    }
  }, [stripe]);

  return {
    processStripePayment,
    loading,
    isAvailable: !!stripe,
  };
};

export default useStripePayment;
