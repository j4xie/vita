import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getAllLevels, SysUserLevel } from '../../services/membershipAPI';
import { useMembershipLevel } from '../../hooks/useMembershipLevel';
import { useUser } from '../../context/UserContext';
import { getUserPoints } from '../../services/orderAPI';
import MembershipCardCarousel from '../../components/rewards/MembershipCardCarousel';
import MembershipBenefitsSection from '../../components/rewards/MembershipBenefitsSection';
import PrivilegesServicesSection from '../../components/rewards/PrivilegesServicesSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const S = SCREEN_WIDTH / 393;

/**
 * 会员等级购买页面 - 卡片轮播 + 权益网格 + 特权服务
 */
export const MembershipPurchaseScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { membershipLevel } = useMembershipLevel();
  const { isAuthenticated } = useUser();

  const [levels, setLevels] = useState<SysUserLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [activeLevelId, setActiveLevelId] = useState<number>(4);

  const currentLevelId = membershipLevel?.sysUserLevel?.id || 4;

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserPoints().then(setPoints).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    setActiveLevelId(currentLevelId);
  }, [currentLevelId]);

  const handleCardChange = useCallback((levelId: number) => {
    setActiveLevelId(levelId);
  }, []);

  // Figma: dark bg height = 252px (from -15 to 237), but relative to screen top
  // Header row at y=56, card at y=130, dark bg bottom at y=237
  // We need: safeArea + header + overlap behind cards
  const HEADER_ROW_HEIGHT = Math.round(42 * S);
  const HEADER_TOP_PADDING = Math.round(10 * S);
  const DARK_BG_OVERLAP = Math.round(100 * S); // how far dark bg extends below header into card area

  return (
    <View style={styles.container}>
      {/* Dark background with rounded bottom corners */}
      <View
        style={[
          styles.darkBg,
          {
            height: insets.top + HEADER_TOP_PADDING + HEADER_ROW_HEIGHT + HEADER_TOP_PADDING + DARK_BG_OVERLAP,
            borderBottomLeftRadius: Math.round(50 * S),
            borderBottomRightRadius: Math.round(50 * S),
          },
        ]}
      />

      {/* Header row */}
      <View style={[styles.header, { paddingTop: insets.top + HEADER_TOP_PADDING }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <View style={styles.headerBtnCircle}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Membership
        </Text>
        <TouchableOpacity style={styles.headerBtn}>
          <View style={styles.headerBtnCircle}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : levels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>
            {t('membership_purchase.no_levels')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Carousel */}
          <View style={{ marginTop: Math.round(8 * S) }}>
            <MembershipCardCarousel
              levels={levels}
              currentLevelId={currentLevelId}
              points={points}
              onCardChange={handleCardChange}
            />
          </View>

          {/* Benefits Grid */}
          <MembershipBenefitsSection
            currentLevelId={currentLevelId}
            activeLevelId={activeLevelId}
          />

          {/* Privileges & Services */}
          <PrivilegesServicesSection />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3F1',
  },
  darkBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(27 * S),
    zIndex: 1,
  },
  headerBtn: {
    width: Math.round(42 * S),
    height: Math.round(42 * S),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnCircle: {
    width: Math.round(42 * S),
    height: Math.round(42 * S),
    borderRadius: Math.round(21 * S),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Math.round(25 * S),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
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
});
