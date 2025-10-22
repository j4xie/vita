import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Address } from '../../types/address';
import { addressAPI } from '../../services/addressAPI';

/**
 * AddressListScreen - 收货地址列表
 *
 * 功能：
 * - 显示所有收货地址
 * - 添加新地址
 * - 编辑/删除地址
 * - 设置默认地址
 */
export const AddressListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // 状态管理
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 加载地址列表
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const addressList = await addressAPI.getAddressList();
      setAddresses(addressList);
    } catch (error) {
      console.error('获取地址列表失败:', error);
      Alert.alert(
        t('common.error'),
        t('address.load_failed', '加载地址列表失败')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 页面聚焦时刷新数据（从表单页返回时）
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAddresses().finally(() => setRefreshing(false));
  }, [fetchAddresses]);

  // 设置默认地址
  const handleSetDefault = useCallback(
    async (addressId: number) => {
      try {
        await addressAPI.setDefaultAddress(addressId);
        fetchAddresses(); // 刷新列表
      } catch (error) {
        console.error('设置默认地址失败:', error);
        Alert.alert(t('common.error'), t('address.set_default_failed', '设置默认地址失败'));
      }
    },
    [t, fetchAddresses]
  );

  // 删除地址
  const handleDelete = useCallback(
    async (addressId: number) => {
      Alert.alert(
        t('common.confirm'),
        t('address.delete_confirm', '确定要删除这个地址吗？'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await addressAPI.deleteAddress(addressId);
                fetchAddresses(); // 刷新列表
              } catch (error) {
                console.error('删除地址失败:', error);
                Alert.alert(t('common.error'), t('address.delete_failed', '删除地址失败'));
              }
            },
          },
        ]
      );
    },
    [t, fetchAddresses]
  );

  // 渲染地址卡片
  const renderAddressCard = (address: Address) => (
    <View key={address.id} style={styles.addressCard}>
      {/* 顶部：姓名、手机号、默认标签 */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.recipientName}>{address.name}</Text>
          <Text style={styles.recipientPhone}>
            +{address.intAreaCode} {address.mobile}
          </Text>
        </View>
        {address.isDefault === 1 && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>{t('address.default')}</Text>
          </View>
        )}
      </View>

      {/* 地址 */}
      <Text style={styles.addressText}>
        {address.address}
        {address.detailAddr && `, ${address.detailAddr}`}
      </Text>

      {/* 底部操作按钮 */}
      <View style={styles.cardActions}>
        {address.isDefault !== 1 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(address.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#FF6B6B" />
            <Text style={styles.actionButtonText}>{t('address.set_default')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddressForm', { address })}
        >
          <Ionicons name="create-outline" size={16} color="#666666" />
          <Text style={styles.actionButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(address.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
            {t('common.delete')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>{t('address.no_address', '暂无收货地址')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('address.no_address_desc', '点击下方按钮添加新地址')}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('profile.delivery_addresses')}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 地址列表 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : addresses.length > 0 ? (
          addresses.map(renderAddressCard)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* 底部添加按钮 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddressForm')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{t('address.add_new')}</Text>
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

  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 地址卡片
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  headerLeft: {
    flex: 1,
  },

  recipientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },

  recipientPhone: {
    fontSize: 14,
    color: '#666666',
  },

  defaultBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  addressText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 12,
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  actionButtonText: {
    fontSize: 14,
    color: '#666666',
  },

  // 空状态
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },

  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },

  // 底部添加按钮
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
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    height: 50,
    borderRadius: 12,
    gap: 8,
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
