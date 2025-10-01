import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoaderOne } from '../ui/LoaderOne';
import { useUser } from '../../context/UserContext';
import couponAPI, { Coupon } from '../../services/couponAPI';

interface MerchantDetailModalProps {
  visible: boolean;
  onClose: () => void;
  merchant: {
    id: string;
    name: string;
    location: string;
    price?: string;
    image?: string;
    earnPoints?: number;
  } | null;
}

export const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  visible,
  onClose,
  merchant,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [writingOff, setWritingOff] = useState(false);

  // 加载商家优惠券
  useEffect(() => {
    if (visible && merchant && user?.userId) {
      loadCoupons();
    }
  }, [visible, merchant, user]);

  const loadCoupons = async () => {
    if (!merchant || !user?.userId) return;

    setLoading(true);
    try {
      const merchantCoupons = await couponAPI.getMerchantCoupons(
        parseInt(merchant.id),
        parseInt(user.userId)
      );
      setCoupons(merchantCoupons);
      console.log('🎫 [MerchantDetail] 加载到优惠券:', merchantCoupons.length);
    } catch (error) {
      console.error('❌ [MerchantDetail] 加载优惠券失败:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  // 核销优惠券
  const handleWriteOff = async (couponId: number) => {
    if (!merchant || !user?.userId) return;

    Alert.alert(
      t('community.coupon.writeOffTitle', 'Use Coupon'),
      t('community.coupon.writeOffConfirm', 'Confirm to use this coupon?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            setWritingOff(true);
            try {
              const result = await couponAPI.writeOffCoupon({
                couponId,
                merchantId: parseInt(merchant.id),
                userId: parseInt(user.userId),
              });

              if (result.code === 200) {
                Alert.alert(
                  t('common.success'),
                  t('community.coupon.writeOffSuccess', 'Coupon used successfully!')
                );
                loadCoupons(); // 重新加载优惠券列表
              } else {
                Alert.alert(t('common.error'), result.msg);
              }
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            } finally {
              setWritingOff(false);
            }
          },
        },
      ]
    );
  };

  if (!merchant) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 顶部栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{merchant.name}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 商家信息卡片 */}
          <View style={styles.merchantCard}>
            {merchant.image && (
              <Image source={{ uri: merchant.image }} style={styles.merchantImage} />
            )}
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{merchant.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.locationText}>{merchant.location}</Text>
              </View>
              {merchant.earnPoints && (
                <View style={styles.pointsRow}>
                  <View style={styles.qBadge}>
                    <Text style={styles.qText}>Q</Text>
                  </View>
                  <Text style={styles.pointsText}>Earn {merchant.earnPoints} points</Text>
                </View>
              )}
            </View>
          </View>

          {/* 优惠券列表 */}
          <View style={styles.couponsSection}>
            <Text style={styles.sectionTitle}>
              {t('community.coupon.availableCoupons', 'Available Coupons')}
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <LoaderOne size="large" color="#D4A054" />
              </View>
            ) : coupons.length > 0 ? (
              coupons.map((coupon) => (
                <View key={coupon.id} style={styles.couponCard}>
                  <View style={styles.couponLeft}>
                    <Text style={styles.couponName}>{coupon.couponName}</Text>
                    {coupon.merchantName && (
                      <Text style={styles.couponMerchant}>{coupon.merchantName}</Text>
                    )}
                    {coupon.validTo && (
                      <Text style={styles.couponExpiry}>
                        Valid until: {coupon.validTo}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.useButton}
                    onPress={() => handleWriteOff(coupon.id)}
                    disabled={writingOff}
                  >
                    {writingOff ? (
                      <LoaderOne size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.useButtonText}>
                        {t('community.coupon.use', 'Use')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="ticket-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>
                  {t('community.coupon.noCoupons', 'No available coupons')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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

  closeButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },

  headerSpacer: {
    width: 36,
  },

  scrollView: {
    flex: 1,
  },

  // 商家信息卡片
  merchantCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
  },

  merchantImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
  },

  merchantInfo: {
    gap: 8,
  },

  merchantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  locationText: {
    fontSize: 14,
    color: '#666',
  },

  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },

  qBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A054',
  },

  // 优惠券区域
  couponsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },

  // 优惠券卡片
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE4A0',
    borderStyle: 'dashed',
  },

  couponLeft: {
    flex: 1,
    marginRight: 12,
  },

  couponName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  couponMerchant: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },

  couponExpiry: {
    fontSize: 12,
    color: '#999',
  },

  useButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },

  useButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 加载和空状态
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});
