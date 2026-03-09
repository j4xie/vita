import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { getAllLevels, SysUserLevel } from '../../services/membershipAPI';
import { useMembershipLevel } from '../../hooks/useMembershipLevel';
import { membershipToOrderItem } from '../../types/order';

/**
 * 会员等级购买页面
 * 动态从 API 获取所有等级并展示
 */
export const MembershipPurchaseScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { membershipLevel } = useMembershipLevel();

  const [levels, setLevels] = useState<SysUserLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const currentLevelId = membershipLevel?.sysUserLevel?.id;

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const data = await getAllLevels();
        setLevels(data);
      } catch (error) {
        console.error('[MembershipPurchase] Failed to load levels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLevels();
  }, []);

  const getAcquisitionLabel = (type?: string) => {
    switch (type) {
      case 'register_get': return t('membership_purchase.register_get');
      case 'buy_get': return t('membership_purchase.buy_get');
      case 'grant_get': return t('membership_purchase.grant_get');
      default: return type || '';
    }
  };

  const handlePurchase = (level: SysUserLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const orderItem = membershipToOrderItem(level);

    if (orderItem.price <= 0) {
      Alert.alert(t('membership_purchase.price_tbd'), t('membership_purchase.price_tbd'));
      return;
    }

    navigation.navigate('OrderConfirmGlobal', { orderItem });
  };

  // Translate level name using i18n (fallback to API data)
  const getLevelName = (level: SysUserLevel) =>
    t(`membership_purchase.levels.${level.id}`, level.levelName);

  // Translate equity name using i18n (fallback to raw name)
  const getEquityName = (equName: string) =>
    t(`membership_purchase.equities.${equName}`, equName);

  // Translate benefits description using i18n (fallback to API data)
  const getBenefitsDesc = (level: SysUserLevel) =>
    t(`membership_purchase.benefits_desc.${level.id}`, level.memberBenefits || '');

  const renderLevelCard = (level: SysUserLevel) => {
    const isCurrent = currentLevelId === level.id;
    const isBuyable = level.acquisitionMethodType === 'buy_get';

    return (
      <View key={level.id} style={[styles.levelCard, isCurrent && styles.levelCardCurrent]}>
        {/* Header */}
        <View style={styles.levelHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.levelName}>{getLevelName(level)}</Text>
            <Text style={styles.levelType}>{getAcquisitionLabel(level.acquisitionMethodType)}</Text>
          </View>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>{t('membership_purchase.current_level')}</Text>
            </View>
          )}
        </View>

        {/* Member benefits description */}
        {(level.memberBenefits || t(`membership_purchase.benefits_desc.${level.id}`, '')) ? (
          <Text style={styles.benefitsDesc}>{getBenefitsDesc(level)}</Text>
        ) : null}

        {/* Equity list */}
        {level.userLevelExEquityList && level.userLevelExEquityList.length > 0 && (
          <View style={styles.equitySection}>
            <Text style={styles.equitySectionTitle}>{t('membership_purchase.benefits')}</Text>
            {level.userLevelExEquityList.map((eq, idx) => (
              <View key={idx} style={styles.equityRow}>
                <Ionicons name="checkmark-circle" size={16} color="#FF6B35" style={{ marginRight: 8 }} />
                <Text style={styles.equityText}>
                  {getEquityName(eq.equName)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {level.userLevelExEquityList?.length === 0 && !level.memberBenefits && (
          <Text style={styles.noBenefitsText}>{t('membership_purchase.no_benefits')}</Text>
        )}

        {/* Purchase button - only for buy_get types */}
        {isBuyable && !isCurrent && (
          <TouchableOpacity
            style={styles.purchaseButton}
            onPress={() => handlePurchase(level)}
          >
            <Text style={styles.purchaseButtonText}>
              {level.limitValue && level.limitValue > 0
                ? `${t('membership_purchase.purchase')} - $${level.limitValue}`
                : t('membership_purchase.contact_purchase')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('membership_purchase.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : levels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>{t('membership_purchase.no_levels')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {levels.map(renderLevelCard)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 16,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  levelCardCurrent: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  levelType: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  benefitsDesc: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
    marginBottom: 12,
  },
  equitySection: {
    marginTop: 4,
    marginBottom: 12,
  },
  equitySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  equityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  equityText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  noBenefitsText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  purchaseButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 4,
  },
  purchaseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
