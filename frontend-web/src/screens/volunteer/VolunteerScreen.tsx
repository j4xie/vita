import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, BRAND_GLASS, BRAND_GRADIENT } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useUser } from '../../context/UserContext';

const { width: screenWidth } = Dimensions.get('window');

// 志愿者功能配置 - 不显示假数字
const volunteerFeatures = [
  {
    id: 'activities',
    title: '活动管理',
    description: '创建、编辑和管理活动',
    icon: 'calendar-outline',
    color: theme.colors.primary,
    count: 0, // 显示真实的0而非假数字
  },
  {
    id: 'attendees',
    title: '参与者管理',
    description: '查看和管理活动报名',
    icon: 'people-outline',
    color: theme.colors.secondary,
    count: 0, // 显示真实的0而非假数字
  },
  {
    id: 'analytics',
    title: '数据分析',
    description: '活动数据和统计报告',
    icon: 'analytics-outline',
    color: theme.colors.success,
    count: 0, // 显示真实的0而非假数字
  },
  {
    id: 'notifications',
    title: '通知管理',
    description: '发送活动通知和提醒',
    icon: 'notifications-outline',
    color: theme.colors.warning,
    count: 0, // 显示真实的0而非假数字
  },
];

// recentActivities removed - showing empty state until real data available
const recentActivities: any[] = [];

export const VolunteerScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', false);
  const L2Config = getLayerConfig('L2', false);

  const handleFeaturePress = (feature: any) => {
    // Navigate to specific feature screen
    console.log('Feature pressed:', feature.id);
  };

  const handleActivityPress = (activity: any) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  const handleCreateActivity = () => {
    // Navigate to create activity screen
    console.log('Create new activity');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.95)', 'rgba(240, 247, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user?.name?.substring(0, 1) || 'V'}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>{user?.name || t('volunteer.default_name')}</Text>
                <Text style={styles.userRole}>
                  {user?.permissions.isOrganizer ? t('userInfo.roles.organizer') : t('userInfo.roles.volunteer')}
                </Text>
              </View>
            </View>
            
            {/* Create Button - Shadow优化 */}
            <View style={styles.createButtonShadowContainer}>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateActivity}
              >
                <LinearGradient
                  colors={BRAND_GRADIENT} // 使用V2.0品牌渐变
                  style={styles.createButtonGradient}
                >
                  <Ionicons name="add" size={24} color="white" />
                  <Text style={styles.createButtonText}>{t('volunteer.create_activity_button')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('volunteer.weekly_stats_title')}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>{t('volunteer.active_activities_label')}</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#8E24AA20' }]}>
                <Ionicons name="people" size={24} color="#8E24AA" />
              </View>
              <Text style={styles.statValue}>156</Text>
              <Text style={styles.statLabel}>{t('volunteer.total_participants_label')}</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#26A69A20' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#26A69A" />
              </View>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>{t('volunteer.new_registrations_label')}</Text>
            </View>
          </View>
        </View>

        {/* Volunteer Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('volunteer.management_features_title')}</Text>
          <View style={styles.featuresGrid}>
            {volunteerFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(feature)}
              >
                <View style={styles.featureCardContent}>
                  <View style={[
                    styles.featureIcon,
                    { backgroundColor: feature.color + '20' }
                  ]}>
                    <Ionicons 
                      name={feature.icon as any} 
                      size={28} 
                      color={feature.color} 
                    />
                  </View>
                  
                  <View style={styles.featureInfo}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                    <View style={styles.featureCount}>
                      <Text style={[styles.featureCountText, { color: feature.color }]}>
                        {feature.count}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('volunteer.recent_activities_title')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.seeMoreText}>{t('volunteer.view_all_button')}</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => handleActivityPress(activity)}
            >
              <View style={styles.activityCardContent}>
                <Image
                  source={{ uri: activity.image }}
                  style={styles.activityImage}
                  resizeMode="cover"
                />
                
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString('zh-CN')}
                  </Text>
                  <View style={styles.activityStats}>
                    <Text style={styles.activityAttendees}>
                      {activity.attendees}/{activity.maxAttendees} {t('activityCard.people')}
                    </Text>
                    <View style={[
                      styles.activityStatus,
                      { 
                        backgroundColor: activity.status === 'available' 
                          ? theme.colors.success + '20'
                          : activity.status === 'registered'
                          ? theme.colors.primary + '20'
                          : theme.colors.text.secondary + '20'
                      }
                    ]}>
                      <Text style={[
                        styles.activityStatusText,
                        {
                          color: activity.status === 'available'
                            ? theme.colors.success
                            : activity.status === 'registered'
                            ? theme.colors.primary
                            : theme.colors.text.secondary
                        }
                      ]}>
                        {activity.status === 'available' ? t('activityCard.status.available') : 
                         activity.status === 'registered' ? t('activityCard.status.registered') : 
                         activity.status === 'checked_in' ? t('activityCard.status.checked_in') : 
                         t('activityCard.status.ended')}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 250, 255, 0.5)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  userAvatarText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
  },
  userName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  userRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  // Create Button Shadow容器 - 解决LinearGradient阴影冲突
  createButtonShadowContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary, // solid background用于阴影优化
    ...theme.shadows.button,
  },
  
  createButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    // 移除阴影，由createButtonShadowContainer处理
  },
  
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  createButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing[2],
  },

  // Sections
  section: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  seeMoreText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    alignItems: 'center',
    marginHorizontal: theme.spacing[1],
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
    ...theme.shadows.xs,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Features
  featuresGrid: {
    gap: theme.spacing[3],
  },
  featureCard: {
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
    ...theme.shadows.xs,
  },
  featureCardContent: {
    flexDirection: 'row',
    padding: theme.spacing[4],
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  featureCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureCountText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Activities
  activityCard: {
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
    ...theme.shadows.xs,
  },
  activityCardContent: {
    flexDirection: 'row',
    padding: theme.spacing[4],
    alignItems: 'center',
  },
  activityImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing[3],
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  activityDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  activityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityAttendees: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  activityStatus: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1] / 2,
    borderRadius: theme.borderRadius.badge,
  },
  activityStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});