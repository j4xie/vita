import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { merchantAPI, Merchant } from '../../services/merchantAPI';
import { ShopInfoCard } from '../../components/merchant/ShopInfoCard';

/**
 * MerchantHomeScreen - 商家首页
 *
 * 功能：
 * - 显示商家店铺信息
 * - 扫码核销入口
 * - 今日统计数据（预留）
 */
export const MerchantHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 今日统计数据（暂时硬编码为0，等后端接口）
  const [todayStats, setTodayStats] = useState({
    verifyCount: 0,
    verifyAmount: 0,
  });

  // 获取商家信息
  const fetchMerchantInfo = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      const response = await merchantAPI.getMerchantDetail(Number(user.userId));

      if (response.code === 200 && response.data) {
        setMerchant(response.data);
        console.log('✅ [MerchantHome] 商家信息获取成功:', response.data.merchantName);
      } else {
        console.warn('⚠️ [MerchantHome] 商家信息获取失败:', response.msg);
      }
    } catch (error) {
      console.error('❌ [MerchantHome] 获取商家信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchMerchantInfo();
  }, [fetchMerchantInfo]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMerchantInfo().finally(() => setRefreshing(false));
  }, [fetchMerchantInfo]);

  // 跳转到扫码核销页面
  const handleScanPress = () => {
    navigation.navigate('MerchantScan' as never);
  };

  // 跳转到核销记录
  const handleRecordsPress = () => {
    navigation.navigate('MerchantRecords' as never);
  };

  // 跳转到统计数据
  const handleStatsPress = () => {
    navigation.navigate('MerchantStats' as never);
  };

  // 跳转到店铺管理
  const handleProfilePress = () => {
    navigation.navigate('MerchantProfile' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>{t('merchant.home', '商家中心')}</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 店铺信息卡片 */}
        <ShopInfoCard merchant={merchant} />

        {/* 扫码核销大按钮 */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanPress}
          activeOpacity={0.9}
        >
          <View style={styles.scanIconContainer}>
            <Ionicons name="qr-code-outline" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.scanButtonText}>
            {t('merchant.scan_verify', '扫码核销')}
          </Text>
          <Text style={styles.scanButtonHint}>
            {t('merchant.scan_hint', '扫描用户优惠券二维码')}
          </Text>
        </TouchableOpacity>

        {/* 今日统计 */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="stats-chart-outline" size={20} color="#666666" />
            <Text style={styles.statsTitle}>
              {t('merchant.today_stats', '今日统计')}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.verifyCount}</Text>
              <Text style={styles.statLabel}>
                {t('merchant.verify_count', '核销次数')}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>¥{todayStats.verifyAmount}</Text>
              <Text style={styles.statLabel}>
                {t('merchant.verify_amount', '核销金额')}
              </Text>
            </View>
          </View>

          <Text style={styles.statsHint}>
            {t('merchant.stats_coming_soon', '统计功能开发中，敬请期待')}
          </Text>
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleRecordsPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="list-outline" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.menuItemText}>
              {t('merchant.records', '核销记录')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleStatsPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="bar-chart-outline" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.menuItemText}>
              {t('merchant.stats', '数据统计')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          </TouchableOpacity>
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

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  profileButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 滚动区域
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // 扫码按钮
  scanButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  scanIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  scanButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  scanButtonHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // 统计卡片
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },

  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 13,
    color: '#666666',
  },

  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },

  statsHint: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // 功能菜单
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
});
