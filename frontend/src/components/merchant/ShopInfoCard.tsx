import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Merchant } from '../../services/merchantAPI';

interface ShopInfoCardProps {
  merchant: Merchant | null;
  onEdit?: () => void;
  showEditButton?: boolean;
}

/**
 * ShopInfoCard - 店铺信息卡片组件
 *
 * 功能：
 * - 显示商家基本信息（名称、Logo、地址等）
 * - 支持编辑功能（可选）
 */
export const ShopInfoCard: React.FC<ShopInfoCardProps> = ({
  merchant,
  onEdit,
  showEditButton = false,
}) => {
  const { t } = useTranslation();

  if (!merchant) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyText}>
            {t('merchant.no_shop_info', '暂无店铺信息')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo和基本信息 */}
      <View style={styles.headerRow}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {merchant.logo ? (
            <Image source={{ uri: merchant.logo }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Ionicons name="business" size={32} color="#999999" />
            </View>
          )}
        </View>

        {/* 基本信息 */}
        <View style={styles.infoSection}>
          <Text style={styles.merchantName} numberOfLines={2}>
            {merchant.merchantName}
          </Text>
          {merchant.merchantType && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {t('merchant.type.default', '商家')}
              </Text>
            </View>
          )}
        </View>

        {/* 编辑按钮 */}
        {showEditButton && onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={20} color="#666666" />
          </TouchableOpacity>
        )}
      </View>

      {/* 详细信息 */}
      <View style={styles.detailsSection}>
        {/* 地址 */}
        {merchant.merchantAddress && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color="#666666" />
            <Text style={styles.detailText}>{merchant.merchantAddress}</Text>
          </View>
        )}

        {/* 联系电话 */}
        {merchant.phonenumber && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={18} color="#666666" />
            <Text style={styles.detailText}>{merchant.phonenumber}</Text>
          </View>
        )}

        {/* 邮箱 */}
        {merchant.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={18} color="#666666" />
            <Text style={styles.detailText}>{merchant.email}</Text>
          </View>
        )}

        {/* 营业执照号 */}
        {merchant.ein && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={18} color="#666666" />
            <Text style={styles.detailText}>
              {t('merchant.ein', 'EIN')}: {merchant.ein}
            </Text>
          </View>
        )}
      </View>

      {/* 商家描述 */}
      {merchant.merchantDesc && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>
            {t('merchant.description', '店铺简介')}
          </Text>
          <Text style={styles.descriptionText}>{merchant.merchantDesc}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // 空状态
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
  },

  // 头部区域
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  logoContainer: {
    marginRight: 12,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },

  logoPlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },

  merchantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },

  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFE5E5',
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
  },

  // 详细信息区域
  detailsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },

  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

  // 描述区域
  descriptionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },

  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  descriptionText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
});
