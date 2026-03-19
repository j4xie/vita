import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Address, getAddressList, deleteAddress, setDefaultAddress } from '../../services/addressAPI';

/**
 * 地址列表页面
 * 展示用户所有收货地址，支持设为默认、编辑、删除
 */
export const AddressListScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // 加载地址列表
  const loadAddresses = useCallback(async () => {
    try {
      const list = await getAddressList();
      // 默认地址排在前面
      const sorted = list.sort((a, b) => b.isDefault - a.isDefault);
      setAddresses(sorted);
    } catch (error) {
      console.error('[AddressListScreen] 加载地址失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  // 删除地址
  const handleDelete = useCallback(async (address: Address) => {
    Alert.alert(
      t('address.delete'),
      t('address.delete_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(address.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              const result = await deleteAddress(String(address.id));
              if (result.code === 200) {
                setAddresses(prev => prev.filter(a => a.id !== address.id));
              } else {
                Alert.alert(t('common.error'), result.msg || t('common.operation_failed'));
              }
            } catch (error) {
              console.error('[AddressListScreen] 删除失败:', error);
              Alert.alert(t('common.error'), t('common.operation_failed'));
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [t]);

  // 设为默认地址
  const handleSetDefault = useCallback(async (address: Address) => {
    if (address.isDefault === 1) return;

    try {
      setActionLoading(address.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await setDefaultAddress(String(address.id), address);
      if (result.code === 200) {
        // 更新本地状态
        setAddresses(prev => {
          const updated = prev.map(a => ({
            ...a,
            isDefault: a.id === address.id ? 1 : -1,
          }));
          // 重新排序，默认地址在前
          return updated.sort((a, b) => b.isDefault - a.isDefault);
        });
      } else {
        Alert.alert(t('common.error'), result.msg || t('common.operation_failed'));
      }
    } catch (error) {
      console.error('[AddressListScreen] 设置默认失败:', error);
      Alert.alert(t('common.error'), t('common.operation_failed'));
    } finally {
      setActionLoading(null);
    }
  }, [t]);

  // 跳转到编辑页面
  const handleEdit = useCallback((address: Address) => {
    Haptics.selectionAsync();
    navigation.navigate('AddressEdit', { address });
  }, [navigation]);

  // 跳转到新增页面
  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AddressEdit');
  }, [navigation]);

  // 地址卡片组件
  const AddressCard = React.memo(({ item }: { item: Address }) => {
    const isLoading = actionLoading === item.id;
    const isDefault = item.isDefault === 1;

    return (
      <View style={styles.addressCard}>
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

        <View style={styles.actionRow}>
          {!isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(item)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#007AFF" />
                  <Text style={styles.actionText}>{t('address.set_default')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
            disabled={isLoading}
          >
            <Ionicons name="create-outline" size={16} color="#8E8E93" />
            <Text style={[styles.actionText, { color: '#8E8E93' }]}>{t('address.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
            disabled={isLoading}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            <Text style={[styles.actionText, { color: '#FF3B30' }]}>{t('address.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  });

  // 空状态
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>{t('address.no_address')}</Text>
      <Text style={styles.emptySubtitle}>{t('address.add_first')}</Text>
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
        <Text style={styles.headerTitle}>{t('address.title')}</Text>
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
          renderItem={({ item }) => <AddressCard item={item} />}
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
        />
      )}

      {/* 底部添加按钮 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>{t('address.add')}</Text>
        </TouchableOpacity>
      </View>
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
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressContent: {
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 12,
  },
  phone: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  defaultTag: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 4,
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
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});

export default AddressListScreen;
