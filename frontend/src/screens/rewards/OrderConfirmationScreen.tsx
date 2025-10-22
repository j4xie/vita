import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types/pointsMall';
import { Address } from '../../types/address';
import { PaymentMethod, OrderType } from '../../types/order';
import { addressAPI } from '../../services/addressAPI';
import { orderAPI } from '../../services/orderAPI';
import { OptimizedImage } from '../../components/common/OptimizedImage';

/**
 * OrderConfirmationScreen - 订单确认页
 *
 * 功能：
 * - 显示商品信息
 * - 选择收货地址
 * - 创建订单
 */
export const OrderConfirmationScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const product: Product = route.params?.product;

  // 状态管理
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 加载地址列表
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const addressList = await addressAPI.getAddressList();
        setAddresses(addressList);

        // 自动选中默认地址
        const defaultAddress = addressList.find(addr => addr.isDefault === 1);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else if (addressList.length > 0) {
          setSelectedAddress(addressList[0]);
        }
      } catch (error) {
        console.error('获取地址列表失败:', error);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, []);

  // 处理地址选择
  const handleSelectAddress = useCallback(() => {
    if (addresses.length === 0) {
      // 没有地址，跳转到添加地址页
      Alert.alert(
        t('address.no_address'),
        t('address.please_add_address'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('address.add_new'),
            onPress: () => navigation.navigate('AddressList'),
          },
        ]
      );
      return;
    }

    // 显示地址选择对话框
    Alert.alert(
      t('order.select_address'),
      undefined,
      [
        ...addresses.map(addr => ({
          text: `${addr.name} ${addr.mobile}\n${addr.address}`,
          onPress: () => setSelectedAddress(addr),
        })),
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  }, [addresses, t, navigation]);

  // 创建订单
  const handleCreateOrder = useCallback(async () => {
    if (!selectedAddress) {
      Alert.alert(t('common.error'), t('order.please_select_address'));
      return;
    }

    try {
      setSubmitting(true);

      const order = await orderAPI.createOrder({
        goodsId: Number(product.id),
        quantity: 1, // 默认数量为1
        price: product.pointsPrice,
        addressId: selectedAddress.id,
        orderType: OrderType.POINTS_MALL,    // 积分商城订单
        payMode: PaymentMethod.POINTS,       // 积分支付
      });

      Alert.alert(
        t('common.success'),
        t('order.create_success'),
        [
          {
            text: t('common.confirm'),
            onPress: () => {
              // 跳转到订单详情页
              navigation.navigate('OrderDetail', { orderId: order.id });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('创建订单失败:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('order.create_failed')
      );
    } finally {
      setSubmitting(false);
    }
  }, [selectedAddress, product, t, navigation]);

  if (!product) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('order.confirm_order')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 收货地址 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order.delivery_address')}</Text>
          {loadingAddresses ? (
            <View style={styles.addressLoading}>
              <ActivityIndicator size="small" color="#FF6B6B" />
            </View>
          ) : selectedAddress ? (
            <TouchableOpacity
              style={styles.addressCard}
              onPress={handleSelectAddress}
            >
              <View style={styles.addressInfo}>
                <View style={styles.addressHeader}>
                  <Text style={styles.recipientName}>{selectedAddress.name}</Text>
                  <Text style={styles.recipientPhone}>
                    +{selectedAddress.intAreaCode} {selectedAddress.mobile}
                  </Text>
                </View>
                <Text style={styles.addressText}>
                  {selectedAddress.address}
                  {selectedAddress.detailAddr && `, ${selectedAddress.detailAddr}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('AddressList')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FF6B6B" />
              <Text style={styles.addAddressText}>{t('address.add_new')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 商品信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order.product_info')}</Text>
          <View style={styles.productCard}>
            <OptimizedImage
              source={{ uri: product.primaryImage }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <View style={styles.productPriceRow}>
                <Text style={styles.productPoints}>{product.pointsPrice}</Text>
                <Text style={styles.pointsLabel}> {t('rewards.menu.points')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 订单汇总 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('order.order_summary')}</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('order.product_points')}</Text>
              <Text style={styles.summaryValue}>{product.pointsPrice}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>{t('order.total_points')}</Text>
              <Text style={styles.summaryTotalValue}>{product.pointsPrice}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部确认按钮 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomLeft}>
          <Text style={styles.totalLabel}>{t('order.total')}:</Text>
          <Text style={styles.totalPoints}>{product.pointsPrice}</Text>
          <Text style={styles.totalUnit}> {t('rewards.menu.points')}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (submitting || !selectedAddress) && styles.confirmButtonDisabled,
          ]}
          onPress={handleCreateOrder}
          disabled={submitting || !selectedAddress}
        >
          <Text style={styles.confirmButtonText}>
            {submitting ? t('common.submitting') : t('order.confirm_exchange')}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    color: '#1A1A1A',
  },

  headerRight: {
    width: 36,
  },

  // 滚动区域
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
  },

  // 分区
  section: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },

  // 地址卡片
  addressLoading: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },

  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  addressInfo: {
    flex: 1,
  },

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },

  recipientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  recipientPhone: {
    fontSize: 14,
    color: '#666666',
  },

  addressText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },

  addAddressButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },

  addAddressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  // 商品卡片
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },

  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },

  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },

  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 20,
  },

  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  productPoints: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  pointsLabel: {
    fontSize: 14,
    color: '#666666',
  },

  // 订单汇总
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },

  summaryValue: {
    fontSize: 14,
    color: '#333333',
  },

  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },

  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  // 底部确认栏
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  totalLabel: {
    fontSize: 14,
    color: '#666666',
  },

  totalPoints: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  totalUnit: {
    fontSize: 14,
    color: '#666666',
  },

  confirmButton: {
    backgroundColor: '#FF6B6B',
    height: 50,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
