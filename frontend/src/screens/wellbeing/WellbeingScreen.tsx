import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useUser } from '../../context/UserContext';
import { VolunteerListScreen } from './VolunteerListScreen';
import { SchoolSelectionScreen } from './SchoolSelectionScreen';
import { VolunteerListLiquidScreen } from './VolunteerListLiquidScreen';
// School type moved to real data types (if needed)
import { WellbeingPlanContent } from '../../components/wellbeing/WellbeingPlanContent';
import { SegmentedGlass } from '../../ui/glass/SegmentedGlass';
import { Glass } from '../../ui/glass/GlassTheme';
import { getVolunteerHours, getVolunteerRecords } from '../../services/volunteerAPI';

// 临时School类型定义
interface School {
  id: string;
  name: string;
  nameCN?: string;
  nameEN?: string;
}

const { width: screenWidth } = Dimensions.get('window');

// 个人志愿者数据组件
const PersonalVolunteerData: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadPersonalData();
  }, [user]);

  const loadPersonalData = async () => {
    try {
      setLoading(true);
      if (!user?.userId) {
        setPersonalData(null);
        return;
      }

      // 获取个人工时统计
      const hoursResult = await getVolunteerHours({ userId: user.userId });
      // 获取个人签到记录  
      const recordsResult = await getVolunteerRecords({ userId: user.userId });
      
      const myHourRecord = hoursResult?.rows?.find((h: any) => h.userId === user.userId);
      const myRecords = recordsResult?.rows?.filter((r: any) => r.userId === user.userId) || [];
      
      setPersonalData({
        totalHours: myHourRecord ? myHourRecord.totalMinutes / 60 : 0,
        totalRecords: myRecords.length,
        recentRecord: myRecords[0] || null,
        user: {
          name: user.legalName || user.userName,
          department: user.dept?.deptName || '未知部门',
          level: 'Staff',
        }
      });
    } catch (error) {
      console.error('获取个人志愿者数据失败:', error);
      setPersonalData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.selfDataView}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!personalData) {
    return (
      <View style={styles.selfDataView}>
        <Text>暂无志愿者工作记录</Text>
      </View>
    );
  }

  return (
    <View style={styles.personalDataContainer}>
      {/* 个人基本信息 */}
      <View style={styles.personalInfoCard}>
        <Text style={styles.personalName}>{personalData.user.name}</Text>
        <Text style={styles.personalRole}>{personalData.user.level} • {personalData.user.department}</Text>
      </View>

      {/* 工作统计 */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{personalData.totalHours.toFixed(1)}</Text>
          <Text style={styles.statLabel}>总工作时长 (小时)</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{personalData.totalRecords}</Text>
          <Text style={styles.statLabel}>签到记录数</Text>
        </View>
      </View>

      {/* 最近记录 */}
      {personalData.recentRecord && (
        <View style={styles.recentRecordCard}>
          <Text style={styles.recentRecordTitle}>最近工作记录</Text>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>签到时间:</Text>
            <Text style={styles.recordValue}>
              {new Date(personalData.recentRecord.startTime).toLocaleString('zh-CN')}
            </Text>
          </View>
          {personalData.recentRecord.endTime && (
            <View style={styles.recordRow}>
              <Text style={styles.recordLabel}>签退时间:</Text>
              <Text style={styles.recordValue}>
                {new Date(personalData.recentRecord.endTime).toLocaleString('zh-CN')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

interface TabItem {
  id: string;
  title: string;
  icon: string; // 简化为string类型避免复杂的Ionicons类型检查
  enabled: boolean;
}

// 将tabs定义移到组件内部以使用t()函数

export const WellbeingScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { permissions, user } = useUser(); // 获取用户权限和用户信息
  
  const [activeTab, setActiveTab] = useState('wellbeing-plan'); // 默认选中安心计划
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showSchoolSelection, setShowSchoolSelection] = useState(false);
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', false);
  const L2Config = getLayerConfig('L2', false);

  // 处理从其他页面传入的参数
  useEffect(() => {
    const params = route.params as any;
    if (params?.selectedSchool && params?.fromConsulting) {
      // 来自咨询页面的学校选择
      const schoolData = {
        id: params.selectedSchool.id,
        name: params.selectedSchool.name,
        shortName: params.selectedSchool.shortName,
      };
      
      console.log('Setting selected school from consulting:', schoolData);
      setSelectedSchool(schoolData);
      setShowSchoolSelection(false); // 强制不显示学校选择界面
      setActiveTab('volunteer'); // 确保在志愿者tab
      
      // 清除导航参数，避免重复处理
      navigation.setParams({ selectedSchool: undefined, fromConsulting: undefined });
    }
  }, [route.params, navigation]);
  
  // 权限调试日志
  console.log('🔍 [WELLBEING-PERMISSION] 权限检查详情:', {
    userName: user?.userName,
    legalName: user?.legalName,
    permissionLevel: permissions.getPermissionLevel(),
    hasVolunteerAccess: permissions.hasVolunteerManagementAccess(),
    isStaff: permissions.isStaff(),
    isPartManager: permissions.isPartManager(),
    isAdmin: permissions.isAdmin(),
    fallbackCondition: user?.userName === 'admin' || user?.legalName?.includes('管理员')
  });

  // 根据用户权限动态生成tabs
  const tabs: TabItem[] = [
    {
      id: 'wellbeing-plan',
      title: t('wellbeing.tabs.plan'),
      icon: 'shield-outline',
      enabled: true, // 所有用户都能看到安心计划
    },
    // 只有管理员才能看到志愿者管理 - 调试模式强制显示admin用户
    ...(permissions.hasVolunteerManagementAccess() || 
        (user?.userName === 'admin' || user?.legalName?.includes('管理员')) ? [{
      id: 'volunteer',
      title: t('wellbeing.tabs.volunteer'),
      icon: 'people-outline',
      enabled: true,
    }] : []),
  ];

  console.log('🔍 [WELLBEING-TABS] 生成的tabs数量:', tabs.length, tabs.map(t => t.id));

  const handleTabPress = (tabId: string, enabled: boolean) => {
    if (enabled) {
      setActiveTab(tabId);
      if (tabId === 'volunteer' && !selectedSchool) {
        setShowSchoolSelection(true);
      }
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setShowSchoolSelection(false);
  };

  const handleBackToSchoolSelection = () => {
    setShowSchoolSelection(true);
  };

  const renderTabHeader = () => {
    const segmentLabels = tabs.map(tab => tab.title);
    const enabledTabs = tabs.filter(tab => tab.enabled);
    const currentIndex = enabledTabs.findIndex(tab => tab.id === activeTab);
    
    return (
      <View style={styles.tabContainer}>
        <SegmentedGlass
          segments={segmentLabels}
          selectedIndex={Math.max(0, currentIndex)}
          onIndexChange={(index) => {
            const selectedTab = enabledTabs[index];
            if (selectedTab) {
              handleTabPress(selectedTab.id, selectedTab.enabled);
            }
          }}
          disabled={false}
        />
      </View>
    );
  };

  const renderWellbeingPlan = () => (
    <View style={styles.disabledContent}>
      {/* Shadow容器 - 使用solid background优化阴影渲染 */}
      <View style={styles.disabledCardShadowContainer}>
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.5)', 'rgba(240, 240, 240, 0.3)']}
          style={styles.disabledCard}
        >
        <View style={styles.disabledIconContainer}>
          <LinearGradient
            colors={[theme.colors.background.tertiary + '40', theme.colors.border.secondary + '20']}
            style={styles.disabledIconBackground}
          >
            <Ionicons name="shield-outline" size={48} color={theme.colors.text.disabled} />
          </LinearGradient>
        </View>
        
        <Text style={styles.disabledTitle}>{t('wellbeing.plan.title')}</Text>
        <Text style={styles.disabledSubtitle}>
          {t('wellbeing.plan.subtitle')}
        </Text>
        
        <View style={styles.featurePreview}>
          {[
            { icon: 'location-outline', text: t('wellbeing.plan.features.location') },
            { icon: 'call-outline', text: t('wellbeing.plan.features.emergency') },
            { icon: 'heart-outline', text: t('wellbeing.plan.features.mental') },
            { icon: 'medical-outline', text: t('wellbeing.plan.features.medical') },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={feature.icon as any} size={16} color={theme.colors.text.secondary} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.comingSoonBadge}>
          <LinearGradient
            colors={[theme.colors.border.secondary, theme.colors.text.disabled]}
            style={styles.badgeGradient}
          >
            <Ionicons name="construct-outline" size={14} color="white" />
            <Text style={styles.badgeText}>{t('wellbeing.plan.developing')}</Text>
          </LinearGradient>
        </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderContent = () => {
    // 如果是普通用户，直接显示安心计划内容，不显示切换
    if (permissions.isRegularUser()) {
      return <WellbeingPlanContent />;
    }

    // 管理员用户：根据选择的tab显示不同内容
    switch (activeTab) {
      case 'wellbeing-plan':
        return <WellbeingPlanContent />;
      case 'volunteer':
        // 根据权限显示不同的志愿者界面
        if (permissions.getDataScope() === 'self') {
          // Staff：只显示自己的志愿者工作记录
          return (
            <View style={styles.volunteerContent}>
              <Text style={styles.staffTitle}>我的志愿者工作记录</Text>
              <Text style={styles.staffSubtitle}>内部员工只能查看个人工作时长和记录</Text>
              <PersonalVolunteerData />
            </View>
          );
        } else {
          // 总管理员和分管理员：显示学校管理界面
          return (
            <View style={styles.volunteerContent}>
              <VolunteerListLiquidScreen />
            </View>
          );
        }
      default:
        return <WellbeingPlanContent />;
    }
  };

  // 只有管理员才显示tab header，普通用户直接显示内容
  const shouldShowTabHeader = !permissions.isRegularUser() && (showSchoolSelection || !selectedSchool || tabs.length > 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* 修正：上半部分温暖渐变背景 */}
      <LinearGradient 
        colors={[
          '#FFF8E1', // 上部分：极淡奶橘色
          '#FFFEF7', // 渐变到奶白
          '#F8F9FA', // 下部分：回到中性灰
          '#F1F3F4'  // 底部：灰色
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.6, 1]} // 确保上半部分是温暖色
      />
      {shouldShowTabHeader && renderTabHeader()}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },

  // Tab Header
  tabContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  tabBackground: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card,
    padding: 4,
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
  },
  tab: {
    flex: 1,
    position: 'relative',
    borderRadius: LIQUID_GLASS_LAYERS.L2.borderRadius.card, // For ripple effect on Android
    overflow: 'hidden',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
    borderBottomWidth: 2, // 底部横线
    borderBottomColor: '#F9A889', // 柔和奶橘色横线
    paddingBottom: 2, // 轻微底部间距
  },
  tabDisabled: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2], // Adjusted padding
    paddingHorizontal: theme.spacing[2],
    position: 'relative',
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#8E8E93', // 未选中时使用明显的灰色
    marginLeft: theme.spacing[2],
  },
  tabTextActive: {
    color: '#111827', // 选中时使用深黑色
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tabTextDisabled: {
    color: theme.colors.text.disabled,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4, // Position indicator at the bottom of the tab
    left: '40%',
    right: '40%',
    height: 3,
    backgroundColor: theme.colors.text.inverse, // Use white for indicator on L2 glass
    borderRadius: 2,
  },
  disabledBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: theme.colors.text.disabled,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.xs,
  },
  disabledBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Content Areas
  volunteerContent: {
    flex: 1,
    // 移除负边距，因为志愿者列表页面不显示tab header
  },

  // Disabled Content (Wellbeing Plan)
  disabledContent: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Shadow容器 - 解决LinearGradient阴影冲突
  disabledCardShadowContainer: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.primary, // solid background用于阴影优化
    maxWidth: screenWidth - theme.spacing[4] * 2,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    ...theme.shadows.md,
  },
  
  disabledCard: {
    padding: theme.spacing[6],
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    // 移除阴影，由disabledCardShadowContainer处理
  },
  disabledIconContainer: {
    marginBottom: theme.spacing[4],
  },
  disabledIconBackground: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.tertiary,
  },
  disabledTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  disabledSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.4,
    marginBottom: theme.spacing[4],
  },

  // Feature Preview
  featurePreview: {
    width: '100%',
    marginBottom: theme.spacing[4],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: theme.borderRadius.lg,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[2],
  },

  // Coming Soon Badge
  comingSoonBadge: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing[1],
  },

  // Staff用户专用样式
  staffTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  staffSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  selfDataView: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 个人志愿者数据样式
  personalDataContainer: {
    flex: 1,
    padding: 16,
  },
  personalInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  personalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  personalRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentRecordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
  },
  recentRecordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  recordValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
});