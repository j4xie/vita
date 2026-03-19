import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { DynamicFormRenderer } from '../../components/activity/DynamicFormRenderer';
import { pvsaToOrderItem } from '../../types/order';
import { useMembershipLevel } from '../../hooks/useMembershipLevel';
import { getDefaultAddress, Address } from '../../services/addressAPI';

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

// Info banner component
const CertificateInfoBanner = memo(({
  activity,
  isDarkMode,
  t,
}: {
  activity: any;
  isDarkMode: boolean;
  t: (key: string, fallback?: string) => string;
}) => {
  const signEndDate = activity.signEndTime ? formatDate(activity.signEndTime) : '';

  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <LinearGradient
        colors={isDarkMode
          ? ['#2C2C2E', '#1C1C1E'] as any
          : ['#FFF7ED', '#FFF1E6'] as any
        }
        style={styles.infoBanner}
      >
        <View style={styles.infoBannerRow}>
          <View style={[
            styles.infoBannerIcon,
            isDarkMode && { backgroundColor: 'rgba(255,138,101,0.15)' },
          ]}>
            <Ionicons
              name="ribbon"
              size={20}
              color={isDarkMode ? '#FF8A65' : theme.colors.primary}
            />
          </View>
          <View style={styles.infoBannerText}>
            <Text style={[styles.infoBannerTitle, isDarkMode && { color: '#FF8A65' }]}>
              {t('pvsa.info_banner_title', 'Certificate Application')}
            </Text>
            <Text style={[styles.infoBannerDesc, isDarkMode && { color: '#9CA3AF' }]}>
              {t('pvsa.info_banner_desc', 'Please fill in all required fields accurately. Your information will be used for certificate processing.')}
            </Text>
          </View>
        </View>

        {/* Deadline notice */}
        {signEndDate ? (
          <View style={[
            styles.deadlineChip,
            isDarkMode && { backgroundColor: 'rgba(255,138,101,0.1)' },
          ]}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isDarkMode ? '#FF8A65' : '#E85A2F'}
            />
            <Text style={[
              styles.deadlineText,
              isDarkMode && { color: '#FF8A65' },
            ]}>
              {t('pvsa.deadline_notice', 'Deadline')}: {signEndDate}
            </Text>
          </View>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
});

export const PVSADynamicFormScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const { user } = useUser();

  const activity = route.params?.activity;
  const [submitting, setSubmitting] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [asyncDataReady, setAsyncDataReady] = useState(false);

  const { membershipLevel, loading: membershipLoading } = useMembershipLevel();

  useEffect(() => {
    getDefaultAddress()
      .then(addr => setDefaultAddress(addr))
      .catch(() => {})
      .finally(() => setAsyncDataReady(true));
  }, []);

  const initialData = useMemo(() => {
    if (!user) return {};
    const data: Record<string, string> = {};

    if (user.legalName) data.legalName = user.legalName;
    if (user.email) data.email = user.email;
    if (user.phonenumber) data.phone = user.phonenumber;
    if (user.dept?.deptName) data.school = user.dept.deptName;

    if (membershipLevel && membershipLevel.levelId) {
      data.hasVitaMemberId = 'yes';
    }

    const area = (user as any).area;
    if (area === 'en') {
      data.country = 'United States';
    } else if (area === 'zh') {
      data.country = 'China';
    }

    if (defaultAddress) {
      if (defaultAddress.address) data.addressLine1 = defaultAddress.address;
      if (defaultAddress.detailAddr) data.addressLine2 = defaultAddress.detailAddr;
      if (defaultAddress.city) data.city = defaultAddress.city;
      if (defaultAddress.state) data.state = defaultAddress.state;
      if (defaultAddress.zipCode) data.zipCode = defaultAddress.zipCode;
    }

    return data;
  }, [user, membershipLevel, defaultAddress]);

  const handleGoBack = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    navigation.goBack();
  }, [navigation]);

  const handleFormSubmit = useCallback((formData: Record<string, any>) => {
    const paymentMethod = formData.paymentMethod as 'stripe' | 'alipay' | undefined;

    if (!paymentMethod) {
      Alert.alert(
        t('pvsa.error.no_payment_title', { defaultValue: 'Missing Payment Method' }),
        t('pvsa.error.no_payment_desc', { defaultValue: 'Please select a payment method before submitting.' })
      );
      return;
    }

    // Package removed from form — default to 'basic'
    const packageType = (formData.packageType as 'basic' | 'standard' | 'premium') || 'basic';
    const orderItem = pvsaToOrderItem(activity.id, packageType, activity.name);
    const preselectedPayment = paymentMethod === 'alipay' ? 'alipay' : 'stripe';

    navigation.navigate('OrderConfirmGlobal', {
      orderItem,
      pvsaFormData: formData,
      pvsaActivityId: activity.id,
      preselectedPayment,
    });
  }, [activity, navigation, t]);

  if (!activity?.modelContent) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={28} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            {activity?.name || t('pvsa.title', 'PVSA Certificate')}
          </Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, isDarkMode && { backgroundColor: '#1C1C1E' }]}>
            <Ionicons name="document-outline" size={48} color={isDarkMode ? '#555' : '#D1D5DB'} />
          </View>
          <Text style={[styles.emptyTitle, isDarkMode && { color: '#fff' }]}>
            {t('pvsa.no_form_title', 'Form Not Available')}
          </Text>
          <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
            {t('pvsa.no_form_template', 'Form template is not configured yet. Please contact the administrator.')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]} numberOfLines={1}>
          {activity.name || t('pvsa.title', 'PVSA Certificate')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Dynamic Form */}
      {(!asyncDataReady || membershipLoading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, isDarkMode && { color: '#9CA3AF' }]}>
            {t('pvsa.loading_form', 'Preparing your form...')}
          </Text>
        </View>
      ) : (
        <DynamicFormRenderer
          modelContent={activity.modelContent}
          onSubmit={handleFormSubmit}
          submitLabel={t('pvsa.submit_and_pay', { defaultValue: 'Submit & Pay' })}
          loading={submitting}
          initialData={initialData}
          wizardMode={true}
          headerComponent={
            <CertificateInfoBanner
              activity={activity}
              isDarkMode={isDarkMode}
              t={t}
            />
          }
        />
      )}
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

  // Info banner
  infoBanner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoBannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E85A2F',
    marginBottom: 4,
  },
  infoBannerDesc: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  deadlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,107,53,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 12,
    gap: 5,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E85A2F',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyTextDark: {
    color: '#999',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
