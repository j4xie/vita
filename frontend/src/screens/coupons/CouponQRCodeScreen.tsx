import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { couponAPI, Coupon } from '../../services/couponAPI';
import { useUser } from '../../context/UserContext';

export const CouponQRCodeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { refreshUserPoints } = useUser();

  const { userCouponId, coupon } = route.params as {
    userCouponId: number;
    coupon: Coupon;
  };

  const [isVerified, setIsVerified] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [pollingActive, setPollingActive] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 轮询核销状态
  useEffect(() => {
    if (!pollingActive) return;

    const checkStatus = async () => {
      try {
        const result = await couponAPI.checkCouponStatus(userCouponId);

        if (result.isVerified) {
          console.log('🎉 [优惠券核销成功] 获得积分:', result.earnedPoints);

          setIsVerified(true);
          setEarnedPoints(result.earnedPoints);
          setPollingActive(false);

          // 播放成功动画
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();

          // 刷新用户积分
          await refreshUserPoints();

          // 显示成功提示
          setTimeout(() => {
            Alert.alert(
              t('coupons.verify_success', '核销成功'),
              t('coupons.earned_points', `恭喜！您获得了 ${result.earnedPoints} 积分`),
              [
                {
                  text: t('common.confirm', '确认'),
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }, 500);
        }
      } catch (error) {
        console.error('❌ [查询核销状态失败]:', error);
        // 轮询失败不中断，继续下一次
      }
    };

    // 立即执行一次
    checkStatus();

    // 每1秒轮询一次
    pollingIntervalRef.current = setInterval(checkStatus, 1000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userCouponId, pollingActive, refreshUserPoints, scaleAnim, t, navigation]);

  // 生成二维码数据（使用userCouponId）
  const qrData = JSON.stringify({
    type: 'coupon',
    userCouponId,
    couponName: coupon.couponName,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('coupons.verify_title', '优惠券核销')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 内容区 */}
      <View style={styles.content}>
        {/* 优惠券信息 */}
        <View style={styles.couponInfo}>
          <Text style={styles.couponName}>{coupon.couponName}</Text>
          {coupon.merchantName && (
            <Text style={styles.merchantName}>{coupon.merchantName}</Text>
          )}
        </View>

        {/* 二维码区域 */}
        <Animated.View
          style={[
            styles.qrContainer,
            isVerified && styles.qrContainerVerified,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <QRCode
            value={qrData}
            size={240}
            backgroundColor={isVerified ? '#D4EDDA' : '#FFFFFF'}
          />
        </Animated.View>

        {/* 状态提示 */}
        <View style={styles.statusContainer}>
          {isVerified ? (
            <>
              <Ionicons name="checkmark-circle" size={48} color="#28A745" />
              <Text style={styles.statusTextSuccess}>
                {t('coupons.verified', '核销成功')}
              </Text>
              <Text style={styles.pointsText}>
                {t('coupons.earned', `+${earnedPoints} 积分`)}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="scan-outline" size={48} color="#D4A054" />
              <Text style={styles.statusText}>
                {t('coupons.waiting_verify', '请商家扫描二维码核销')}
              </Text>
              <Text style={styles.statusHint}>
                {t('coupons.checking_status', '正在检测核销状态...')}
              </Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  headerSpacer: {
    width: 36,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  couponInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },

  couponName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },

  merchantName: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },

  qrContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },

  qrContainerVerified: {
    backgroundColor: '#D4EDDA',
    borderWidth: 3,
    borderColor: '#28A745',
  },

  statusContainer: {
    alignItems: 'center',
    gap: 12,
  },

  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },

  statusTextSuccess: {
    fontSize: 20,
    fontWeight: '700',
    color: '#28A745',
    textAlign: 'center',
  },

  statusHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  pointsText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4A054',
    marginTop: 8,
  },
});
