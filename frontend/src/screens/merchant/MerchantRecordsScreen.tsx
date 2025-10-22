import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

/**
 * MerchantRecordsScreen - 核销记录页面（预留）
 *
 * 功能（待后端接口）：
 * - 显示商家的核销历史记录
 * - 按日期筛选
 * - 查看核销详情
 */
export const MerchantRecordsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('merchant.records', '核销记录')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 占位符内容 */}
      <View style={styles.content}>
        <Ionicons name="list-outline" size={80} color="#CCCCCC" />
        <Text style={styles.comingSoonTitle}>
          {t('merchant.coming_soon', '功能开发中')}
        </Text>
        <Text style={styles.comingSoonText}>
          {t('merchant.records_desc', '核销记录功能即将上线，敬请期待')}
        </Text>

        {/* 功能预览 */}
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>
              {t('merchant.feature.history', '查看核销历史')}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>
              {t('merchant.feature.filter', '按日期筛选')}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>
              {t('merchant.feature.export', '导出数据')}
            </Text>
          </View>
        </View>
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

  // 内容区域
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  comingSoonTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  comingSoonText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },

  // 功能预览
  featureList: {
    marginTop: 32,
    width: '100%',
    maxWidth: 300,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },

  featureText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
});
