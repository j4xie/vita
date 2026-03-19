import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Address, getAddressList } from '../../services/addressAPI';

interface RouteParams {
  selectedAddressId?: number;
  onSelect?: (address: Address) => void;
}

/**
 * 地址选择页面
 * 用于订单确认时选择收货地址
 */
export const AddressSelectScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const params = route.params as RouteParams | undefined;
  const initialSelectedId = params?.selectedAddressId;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>(initialSelectedId);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 加载地址列表
  const loadAddresses = useCallback(async () => {
    try {
      const list = await getAddressList();
      // 默认地址排在前面
      const sorted = list.sort((a, b) => b.isDefault - a.isDefault);
      setAddresses(sorted);

      // 如果没有选中的地址，选中默认地址
      if (!selectedId && sorted.length > 0) {
        const defaultAddr = sorted.find(a => a.isDefault === 1) || sorted[0];
        setSelectedId(defaultAddr.id);
      }
    } catch (error) {
      console.error('[AddressSelectScreen] 加载地址失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedId]);

  // 页面获得焦点时刷新
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadAddresses();
  }, [loadAddresses]);

  // 选择地址
  const handleSelect = useCallback((address: Address) => {
    Haptics.selectionAsync();
    setSelectedId(address.id);

    // 返回上一页并传递选中的地址
    navigation.navigate('OrderConfirm', { selectedAddress: address });
  }, [navigation]);

  // 跳转到地址管理
  const handleManage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('AddressList');
  }, [navigation]);

  // 跳转到新增地址
  const handleAddNew = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddressEdit');
  }, [navigation]);

  // 地址选项组件
  const AddressOption = React.memo(({ item }: { item: Address }) => {
    const isSelected = selectedId === item.id;
    const isDefault = item.isDefault === 1;

    return (
      <TouchableOpacity
        style={[styles.addressOption, isSelected && styles.addressOptionSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.radioContainer}>
          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected && <View style={styles.radioDot} />}
          </View>
        </View>

        <View style={styles.addressContent}>
          <View style={styles.addressHeader}>
            <Text style={styles.recipientName}>{item.name}</Text>
            <Text style={styles.phone}>
              +{item.intAreaCode} {item.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
            </Text>
            {isDefault && (
              <View style={styles.defaultTag}>
                <Text style={styles.defaultTagText}>{t('address.default_tag')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressText} numberOfLines={2}>
            {item.address}
            {item.detailAddr ? ` ${item.detailAddr}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  });

  // 空状态
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>{t('address.no_address')}</Text>
      <Text style={styles.emptySubtitle}>{t('address.add_first')}</Text>
      <TouchableOpacity style={styles.addNewButton} onPress={handleAddNew}>
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.addNewButtonText}>{t('address.add')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('address.select')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 地址列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <AddressOption item={item} />}
          contentContainerStyle={[
            styles.listContent,
            addresses.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#000"
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* 底部管理按钮 */}
      {addresses.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.manageButton} onPress={handleManage}>
            <Ionicons name="settings-outline" size={18} color="#007AFF" />
            <Text style={styles.manageButtonText}>{t('address.manage')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 0,
  },
  addressOption: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  addressOptionSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  radioContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#007AFF',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 10,
  },
  phone: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  defaultTag: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 24,
  },
  addNewButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  addNewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  manageButton: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
});

export default AddressSelectScreen;
