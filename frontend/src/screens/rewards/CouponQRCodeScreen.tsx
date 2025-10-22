import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { Coupon } from '../../services/couponAPI';

/**
 * CouponQRCodeScreen - 优惠券二维码展示页面
 *
 * 功能：
 * - 全屏显示优惠券二维码供商家扫描
 * - 显示优惠券详细信息
 * - 防截图：二维码包含时间戳，每30秒自动刷新
 */
export const CouponQRCodeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // 获取路由参数
  const { coupon } = route.params as { coupon: Coupon };

  // 时间戳状态，用于防截图
  const [timestamp, setTimestamp] = useState(Date.now());

  // 每30秒刷新一次时间戳
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 30000); // 30秒

    return () => clearInterval(interval);
  }, []);

  // 生成二维码内容：couponNo + 时间戳
  const qrCodeData = JSON.stringify({
    couponNo: coupon.couponNo,
    timestamp: timestamp,
  });

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('coupon.qr_code', '优惠券二维码')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 提示文字 */}
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666666" />
          <Text style={styles.hintText}>
            {t('coupon.show_to_merchant', '向商家出示此码进行核销')}
          </Text>
        </View>

        {/* 二维码区域 */}
        <View style={styles.qrCodeContainer}>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={qrCodeData}
              size={240}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>

          {/* 券码显示 */}
          <View style={styles.couponNoContainer}>
            <Text style={styles.couponNoLabel}>
              {t('rewards.coupons.coupon_no', '券码')}
            </Text>
            <Text style={styles.couponNoText}>{coupon.couponNo}</Text>
          </View>
        </View>

        {/* 优惠券信息卡片 */}
        <View style={styles.infoCard}>
          {/* 优惠券名称 */}
          <Text style={styles.couponName}>{coupon.couponName}</Text>

          {/* 优惠券金额 */}
          <View style={styles.priceRow}>
            <Text style={styles.currencySymbol}>¥</Text>
            <Text style={styles.priceValue}>{coupon.couponPrice || 0}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {coupon.couponTypeName || t('rewards.coupons.voucher', '代金券')}
              </Text>
            </View>
          </View>

          {/* 使用条件 */}
          {coupon.couponLimit && coupon.couponLimit > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={16} color="#666666" />
              <Text style={styles.infoText}>
                {t('rewards.coupons.min_amount', { amount: coupon.couponLimit })}
              </Text>
            </View>
          )}

          {/* 有效期 */}
          {coupon.validFrom && coupon.validEnd && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#666666" />
              <Text style={styles.infoText}>
                {t('rewards.coupons.valid_period', {
                  from: coupon.validFrom.split(' ')[0],
                  to: coupon.validEnd.split(' ')[0],
                })}
              </Text>
            </View>
          )}

          {/* 来源 */}
          {coupon.sourceFromName && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color="#666666" />
              <Text style={styles.infoText}>{coupon.sourceFromName}</Text>
            </View>
          )}

          {/* 使用规则 */}
          {coupon.couponRules && (
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>
                {t('coupon.usage_rules', '使用规则')}
              </Text>
              <Text style={styles.rulesText}>{coupon.couponRules}</Text>
            </View>
          )}
        </View>

        {/* 防截图提示 */}
        <View style={styles.securityHint}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#999999" />
          <Text style={styles.securityText}>
            {t('coupon.security_hint', '二维码每30秒自动刷新，截图无效')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // 顶部导航栏
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FF6B6B',
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  headerRight: {
    width: 36,
  },

  // 滚动区域
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
  },

  // 提示区域
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },

  hintText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },

  // 二维码区域
  qrCodeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },

  couponNoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },

  couponNoLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },

  couponNoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 2,
  },

  // 信息卡片
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  couponName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },

  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
    marginRight: 4,
  },

  priceValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B6B',
    marginRight: 12,
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFE5E5',
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  infoText: {
    fontSize: 14,
    color: '#666666',
  },

  rulesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  rulesText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },

  // 安全提示
  securityHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  securityText: {
    fontSize: 12,
    color: '#999999',
  },
});
