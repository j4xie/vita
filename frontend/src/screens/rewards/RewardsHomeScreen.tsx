import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';
import { BlurView } from 'expo-blur';

/**
 * RewardsHomeScreen - 会员中心首页
 *
 * 功能模块：
 * 1. 会员卡显示 (Membership Card Display)
 * 2. 积分余额 (Points Balance)
 * 3. 快速操作 (Quick Actions)
 * 4. 我的优惠券 (My Coupons)
 * 5. 积分商城入口 (Points Mall)
 *
 * 计划在下一个大版本实现 (Planned for next major version)
 */
export const RewardsHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      {/* 背景渐变 */}
      <LinearGradient
        colors={[
          '#FF6B6B',  // 红色顶部
          '#FF8E53',  // 橙色
          '#F8F9FA',  // 浅灰
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
        locations={[0, 0.4, 1]}
      />

      {/* 返回按钮 - 返回到Explore tab */}
      <View style={[styles.backButtonContainer, { top: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            // 返回到Explore tab
            const parent = navigation.getParent();
            if (parent) {
              parent.navigate('Explore');
            }
          }}
          activeOpacity={0.7}
        >
          <BlurView intensity={20} style={styles.backButtonBlur}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </BlurView>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('rewards.header.title', '会员中心')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('rewards.header.subtitle', '积分商城·优惠券·会员权益')}
          </Text>
        </View>

        {/* 会员卡占位符 */}
        <View style={styles.section}>
          <View style={styles.placeholderCard}>
            <BlurView intensity={20} style={styles.cardBlur}>
              <View style={styles.cardContent}>
                <Ionicons name="card" size={48} color="#FFFFFF" />
                <Text style={styles.placeholderTitle}>
                  {t('rewards.membership_card.title', '会员卡')}
                </Text>
                <Text style={styles.placeholderSubtitle}>
                  {t('rewards.membership_card.coming_soon', '下一版本上线')}
                </Text>
              </View>
            </BlurView>
          </View>
        </View>

        {/* 积分余额占位符 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('rewards.points.title', '我的积分')}
            </Text>
          </View>
          <View style={styles.placeholderBox}>
            <BlurView intensity={10} style={styles.boxBlur}>
              <View style={styles.boxContent}>
                <Ionicons name="star" size={32} color="#FF6B6B" />
                <Text style={styles.boxTitle}>
                  {t('rewards.points.balance', '积分余额')}
                </Text>
                <Text style={styles.boxSubtitle}>
                  {t('rewards.points.coming_soon', '即将上线')}
                </Text>
              </View>
            </BlurView>
          </View>
        </View>

        {/* 优惠券占位符 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('rewards.coupons.title', '我的优惠券')}
            </Text>
          </View>
          <View style={styles.placeholderBox}>
            <BlurView intensity={10} style={styles.boxBlur}>
              <View style={styles.boxContent}>
                <Ionicons name="ticket" size={32} color="#FF8E53" />
                <Text style={styles.boxTitle}>
                  {t('rewards.coupons.my_coupons', '优惠券中心')}
                </Text>
                <Text style={styles.boxSubtitle}>
                  {t('rewards.coupons.coming_soon', '即将上线')}
                </Text>
              </View>
            </BlurView>
          </View>
        </View>

        {/* 积分商城占位符 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('rewards.mall.title', '积分商城')}
            </Text>
          </View>
          <View style={styles.placeholderBox}>
            <BlurView intensity={10} style={styles.boxBlur}>
              <View style={styles.boxContent}>
                <Ionicons name="gift" size={32} color="#6AD0FF" />
                <Text style={styles.boxTitle}>
                  {t('rewards.mall.points_mall', '积分兑换')}
                </Text>
                <Text style={styles.boxSubtitle}>
                  {t('rewards.mall.coming_soon', '即将上线')}
                </Text>
              </View>
            </BlurView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  // 返回按钮容器
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  backButtonBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Glass.textMain,
  },

  placeholderCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  cardBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: {
    alignItems: 'center',
    padding: 24,
  },

  placeholderBox: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },

  boxBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  boxContent: {
    alignItems: 'center',
    padding: 20,
  },

  placeholderTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  placeholderSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  boxTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Glass.textMain,
  },

  boxSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Glass.textWeak,
  },
});
