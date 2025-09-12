import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useUser } from '../../context/UserContext';
import { VolunteerListScreen } from './VolunteerListScreen';
import { SchoolSelectionScreen } from './SchoolSelectionScreen';
import { VolunteerListLiquidScreen } from './VolunteerListLiquidScreen';
// School type moved to real data types (if needed)
import { WellbeingPlanContent } from '../../components/wellbeing/WellbeingPlanContent';
import { SegmentedGlass } from '../../ui/glass/SegmentedGlass';
import { Glass } from '../../ui/glass/GlassTheme';
import { getVolunteerHours, getVolunteerRecords, getLastVolunteerRecord } from '../../services/volunteerAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';

// 临时School类型定义
interface School {
  id: string;
  name: string;
  nameCN?: string;
  nameEN?: string;
}

const { width: screenWidth } = Dimensions.get('window');

// 个人志愿者数据组件
export const PersonalVolunteerData: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  React.useEffect(() => {
    loadPersonalData();
  }, [user]);

  // 计算工作时长（分钟）
  const calculateWorkDuration = (startTime: string, endTime: string | null): number => {
    if (!startTime || !endTime) return 0;
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
    } catch {
      return 0;
    }
  };

  const loadPersonalData = async () => {
    try {
      setLoading(true);
      if (!user?.userId) {
        setPersonalData(null);
        return;
      }

      console.log('🔍 Staff用户获取个人志愿者数据:', { userId: user.userId, userName: user.userName });

      let totalWorkMinutes = 0;
      let recordsCount = 0;
      let lastRecord = null;
      let personalRecords: any[] = [];

      try {
        // 1. 获取个人签到记录 (使用真实API)
        const recordsResult = await getVolunteerRecords({ userId: parseInt(user.userId) });
        
        if (recordsResult.code === 200 && recordsResult.rows && Array.isArray(recordsResult.rows)) {
          personalRecords = recordsResult.rows;
          recordsCount = personalRecords.length;
          
          // 计算总工时 (只统计已完成的记录，即有endTime的记录)
          totalWorkMinutes = personalRecords
            .filter(record => record.endTime)
            .reduce((sum, record) => {
              const duration = calculateWorkDuration(record.startTime, record.endTime);
              return sum + duration;
            }, 0);
          
          console.log('✅ 个人记录统计:', { 
            recordsCount, 
            totalWorkMinutes, 
            totalHours: Math.floor(totalWorkMinutes / 60)
          });
        }

        // 2. 获取最新记录状态
        const lastRecordResult = await getLastVolunteerRecord(parseInt(user.userId));
        if (lastRecordResult.code === 200 && lastRecordResult.data) {
          lastRecord = lastRecordResult.data;
        }

        // 3. 设置个人数据
        setPersonalData({
          totalMinutes: totalWorkMinutes,
          totalHours: Math.floor(totalWorkMinutes / 60),
          totalRecords: recordsCount,
          recentRecord: lastRecord,
          allRecords: personalRecords,
          currentStatus: lastRecord && !lastRecord.endTime ? 'signed_in' : 'signed_out',
          user: {
            name: user.legalName || user.userName,
            department: user.dept?.deptName || '未知部门',
            level: 'Staff',
          }
        });
        
        setHistoryRecords(personalRecords);
        
      } catch (apiError) {
        console.log('📝 Staff用户获取志愿者API数据失败，显示空状态:', apiError);
        setPersonalData({
          totalMinutes: 0,
          totalHours: 0,
          totalRecords: 0,
          recentRecord: null,
          allRecords: [],
          currentStatus: 'no_records',
          user: {
            name: user.legalName || user.userName,
            department: user.dept?.deptName || '未知部门',
            level: 'Staff',
          },
          message: '暂无志愿者工作记录'
        });
        setHistoryRecords([]);
      }
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
        <Text>{t('wellbeing.personal.loading')}</Text>
      </View>
    );
  }

  if (!personalData) {
    return (
      <View style={styles.selfDataView}>
        <Text>{t('wellbeing.personal.no_data')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.personalDataContainer}>
      {/* 个人基本信息 */}
      <View style={styles.personalInfoCard}>
        <Text style={styles.personalName}>{personalData.user.name}</Text>
        <Text style={styles.personalRole}>{personalData.user.level} • {personalData.user.department}</Text>
        
        {/* 当前状态指示器 */}
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot, 
            personalData.currentStatus === 'signed_in' ? styles.statusActive : styles.statusInactive
          ]} />
          <Text style={styles.statusText}>
            {personalData.currentStatus === 'signed_in' ? t('wellbeing.personal.current_status.signed_in') : 
             personalData.currentStatus === 'signed_out' ? t('wellbeing.personal.current_status.signed_out') : t('wellbeing.personal.current_status.no_records')}
          </Text>
        </View>
      </View>

      {/* 增强的工作统计 */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {personalData.totalHours}h {personalData.totalMinutes % 60}m
          </Text>
          <Text style={styles.statLabel}>{t('wellbeing.personal.stats.total_work_hours')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{personalData.totalRecords}</Text>
          <Text style={styles.statLabel}>{t('wellbeing.personal.stats.total_records')}</Text>
        </View>
      </View>

      {/* 最近记录 */}
      {personalData.recentRecord ? (
        <View style={styles.recentRecordCard}>
          <Text style={styles.recentRecordTitle}>{t('wellbeing.personal.recent_record.title')}</Text>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.checkin_time')}</Text>
            <Text style={styles.recordValue}>
              {new Date(personalData.recentRecord.startTime).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          {personalData.recentRecord.endTime ? (
            <>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.checkout_time')}</Text>
                <Text style={styles.recordValue}>
                  {new Date(personalData.recentRecord.endTime).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit', 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.work_duration')}</Text>
                <Text style={styles.recordValue}>
                  {(() => {
                    const duration = calculateWorkDuration(personalData.recentRecord.startTime, personalData.recentRecord.endTime);
                    const hours = Math.floor(duration / 60);
                    const minutes = duration % 60;
                    return hours > 0 ? `${hours} ${t('wellbeing.personal.recent_record.hours')} ${minutes} ${t('wellbeing.personal.recent_record.minutes')}` : `${minutes} ${t('wellbeing.personal.recent_record.minutes')}`;
                  })()} 
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.recordRow}>
              <Text style={[styles.recordLabel, { color: theme.colors.primary }]}>{t('wellbeing.personal.recent_record.status')}</Text>
              <Text style={[styles.recordValue, { color: theme.colors.primary, fontWeight: '600' }]}>
                {t('wellbeing.personal.recent_record.working')}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyRecordCard}>
          <Ionicons name="time-outline" size={32} color={theme.colors.textSecondary} />
          <Text style={styles.emptyRecordText}>{t('wellbeing.personal.no_data')}</Text>
        </View>
      )}

      {/* 历史记录按钮 */}
      {personalData.totalRecords > 1 && (
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={showHistory ? "chevron-up-outline" : "list-outline"} 
            size={20} 
            color={theme.colors.primary} 
          />
          <Text style={styles.historyButtonText}>
            {showHistory ? t('wellbeing.personal.history.hide') : t('wellbeing.personal.history.show_more', { count: personalData.totalRecords - 1 })}
          </Text>
        </TouchableOpacity>
      )}

      {/* 历史记录列表 */}
      {showHistory && historyRecords.length > 1 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>{t('wellbeing.personal.history.title')}</Text>
          {historyRecords.slice(1, 6).map((record, index) => (
            <View key={record.id} style={styles.historyItem}>
              <View style={styles.historyDateColumn}>
                <Text style={styles.historyDate}>
                  {new Date(record.startTime).toLocaleDateString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit'
                  })}
                </Text>
                <Text style={styles.historyTime}>
                  {new Date(record.startTime).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.historyDetailsColumn}>
                {record.endTime ? (
                  <>
                    <Text style={styles.historyDuration}>
                      {t('wellbeing.personal.history.work_duration_label')} {(() => {
                        const duration = calculateWorkDuration(record.startTime, record.endTime);
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;
                        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                      })()}
                    </Text>
                    <Text style={styles.historyEndTime}>
                      {t('wellbeing.personal.history.end_time_until')} {new Date(record.endTime).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.historyStatus, { color: theme.colors.warning }]}>
                    {t('wellbeing.personal.history.not_checked_out')}
                  </Text>
                )}
              </View>
            </View>
          ))}
          {historyRecords.length > 6 && (
            <Text style={styles.moreRecordsHint}>
              {t('wellbeing.personal.history.more_records_hint', { count: historyRecords.length - 6 })}
            </Text>
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
  const { permissions, user, forceRefreshPermissions } = useUser(); // 获取用户权限和用户信息
  
  // 权限核对状态
  const [isVerifyingPermissions, setIsVerifyingPermissions] = useState(false);
  const [lastPermissionCheck, setLastPermissionCheck] = useState<Date | null>(null);
  
  // 🌙 Dark Mode Support
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients } = darkModeSystem;
  
  const [activeTab, setActiveTab] = useState('wellbeing-plan'); // 默认选中安心计划
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showSchoolSelection, setShowSchoolSelection] = useState(false);
  
  // 🚀 Animation values for smooth tab transitions
  const wellbeingOpacity = useRef(new Animated.Value(1)).current;
  const volunteerOpacity = useRef(new Animated.Value(0)).current;
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', false);
  const L2Config = getLayerConfig('L2', false);

  // 🔐 权限核对功能
  const performPermissionCheck = async () => {
    if (isVerifyingPermissions) return;
    
    try {
      setIsVerifyingPermissions(true);
      const previousLevel = permissions.getPermissionLevel();
      console.log('🔐 [WELLBEING] 开始权限核对...', { previousLevel });
      
      // 强制刷新权限信息
      await forceRefreshPermissions();
      
      // 记录权限核对时间
      setLastPermissionCheck(new Date());
      
      const newLevel = permissions.getPermissionLevel();
      const hasVolunteerAccess = permissions.hasVolunteerManagementAccess();
      
      console.log('✅ [WELLBEING] 权限核对完成:', {
        previousLevel,
        newLevel,
        hasVolunteerAccess,
        checkTime: new Date().toLocaleTimeString()
      });
      
      // 🎯 权限变化反应逻辑 - 只在权限显著提升时提醒
      if (previousLevel !== newLevel && hasVolunteerAccess && !permissions.isRegularUser()) {
        // 只有从普通用户提升到管理权限时才显示提醒
        if (previousLevel === 'common' && ['manage', 'part_manage', 'staff'].includes(newLevel)) {
          Alert.alert(
            '权限已更新',
            getPermissionDescription(newLevel),
            [
              {
                text: '了解',
                style: 'default',
                onPress: () => {
                  // 如果获得了志愿者权限，自动切换到志愿者tab
                  if (tabs.length > 1 && hasVolunteerAccess) {
                    setActiveTab('volunteer');
                  }
                }
              }
            ]
          );
        }
      }
      
    } catch (error) {
      console.error('❌ [WELLBEING] 权限核对失败:', error);
      Alert.alert(
        t('wellbeing.permission_check.toast.failed'),
        '权限信息获取失败，请检查网络连接后重试',
        [{ text: '确定', style: 'default' }]
      );
    } finally {
      setIsVerifyingPermissions(false);
    }
  };

  // 🎯 获取权限描述
  const getPermissionDescription = (level: string): string => {
    switch (level) {
      case 'manage':
        return '您现在拥有系统最高权限，可以管理所有学校的志愿者活动和用户信息。';
      case 'part_manage':
        return '您现在是分管理员，可以管理本校的志愿者活动和学生信息。';
      case 'staff':
        return '您现在是内部员工，可以查看和管理个人的志愿者工作记录。';
      case 'common':
        return '您当前是普通用户，可以使用安心计划功能。';
      default:
        return '您的账户权限已更新。';
    }
  };

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
      
      // 清除导航参数，避免重复处理
      navigation.setParams({ selectedSchool: undefined, fromConsulting: undefined });
    }
  }, [route.params, navigation]);

  // 🔐 页面进入时自动权限核对
  useEffect(() => {
    const checkPermissionsOnFocus = () => {
      // 如果距离上次检查超过5分钟，或者从未检查过，则进行权限核对
      const shouldCheck = !lastPermissionCheck || 
                         (Date.now() - lastPermissionCheck.getTime()) > 5 * 60 * 1000;
      
      if (shouldCheck && user) {
        console.log('🔄 [WELLBEING] 页面焦点时自动核对权限');
        performPermissionCheck();
      }
    };

    // 监听页面焦点
    const unsubscribe = navigation.addListener('focus', checkPermissionsOnFocus);
    
    // 初次进入时也检查
    if (user) {
      checkPermissionsOnFocus();
    }

    return unsubscribe;
  }, [navigation, user, lastPermissionCheck]);
  
  // 权限调试日志和状态检查
  const permissionDebugInfo = {
    userName: user?.userName,
    legalName: user?.legalName,
    permissionLevel: permissions.getPermissionLevel(),
    hasVolunteerAccess: permissions.hasVolunteerManagementAccess(),
    isStaff: permissions.isStaff(),
    isPartManager: permissions.isPartManager(),
    isAdmin: permissions.isAdmin(),
    roles: user?.roles?.map((r: any) => ({ key: r.key, roleKey: r.roleKey, name: r.name })),
    rawUser: user ? { id: user.id, deptId: user.deptId } : null
  };
  
  console.log('🔍 [WELLBEING-PERMISSION] 权限检查详情:', permissionDebugInfo);
  

  // 根据用户权限动态生成tabs
  const tabs: TabItem[] = [
    {
      id: 'wellbeing-plan',
      title: t('wellbeing.tabs.plan'),
      icon: 'shield-outline',
      enabled: true, // 所有用户都能看到安心计划
    },
    // 只有管理员和内部员工才能看到志愿者管理（严格基于权限判断）
    ...(permissions.hasVolunteerManagementAccess() ? [{
      id: 'volunteer',
      title: t('wellbeing.tabs.volunteer'),
      icon: 'people-outline',
      enabled: true,
    }] : []),
  ];

  console.log('🔍 [WELLBEING-TABS] 生成的tabs数量:', tabs.length, tabs.map(t => t.id));

  // 🚀 Enhanced tab press with smooth animations
  const handleTabPress = (tabId: string, enabled: boolean) => {
    if (enabled && tabId !== activeTab) {
      // Immediate state update for instant feedback
      setActiveTab(tabId);
      
      // Smooth fade transition between tabs
      if (tabId === 'volunteer') {
        Animated.parallel([
          Animated.timing(wellbeingOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(volunteerOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
        
        if (!selectedSchool) {
          setShowSchoolSelection(true);
        }
      } else {
        Animated.parallel([
          Animated.timing(volunteerOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(wellbeingOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
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
        
        {/* 开发中徽章已隐藏以通过App Store审核 */}
        {/* <View style={styles.comingSoonBadge}>
          <LinearGradient
            colors={[theme.colors.border.secondary, theme.colors.text.disabled]}
            style={styles.badgeGradient}
          >
            <Ionicons name="construct-outline" size={14} color="white" />
            <Text style={styles.badgeText}>{t('wellbeing.plan.developing')}</Text>
          </LinearGradient>
        </View> */}
        </LinearGradient>
      </View>
    </View>
  );

  // 安心页面只显示安心计划内容
  const renderContent = () => {
    return <WellbeingPlanContent />;
  };

  // 安心页面不显示tab header，只显示安心计划
  const shouldShowTabHeader = false;

  return (
    <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
      {/* 修正：上半部分温暖渐变背景 - 🌙 Dark Mode适配 */}
      <LinearGradient 
        colors={isDarkMode ? [
          '#000000',  // 上部分：纯黑
          '#1C1C1E',  // Apple系统深灰
          '#2C2C2E',  // 下部分：更浅的深灰
          '#1C1C1E'   // 底部：回到系统深灰
        ] : [
          '#FFFFFF', // 上部分：纯白色
          '#F8F9FA', // 渐变到浅灰
          '#F8F9FA', // 下部分：回到中性灰
          '#F1F3F4'  // 底部：灰色
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.6, 1]} // 确保上半部分是温暖色
      />
      
      
      {shouldShowTabHeader && renderTabHeader()}
      
      {/* 🚀 Content container for proper positioning */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  // 🚀 Content positioning container
  contentContainer: {
    flex: 1,
    position: 'relative',
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Nearly invisible but solid for shadow calculation
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Nearly invisible but solid for shadow calculation
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
    fontSize: 12, // 提升至最小徽标字号12pt
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // 🚀 Tab Content Persistence
  tabContent: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // 无权限状态样式
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPermissionText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
    fontSize: 16, // 提升至交互文字最小16pt
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
    fontSize: 16, // 提升至交互文字最小16pt (职位信息)
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
    fontSize: 14, // 提升至辅助信息最小14pt
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
    fontSize: 16, // 提升至最小交互文字16pt
    color: '#6B7280',
  },
  recordValue: {
    fontSize: 16, // 提升至最小交互文字16pt
    color: '#1F2937',
    fontWeight: '500',
  },

  // 新增的个人数据增强样式
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#9CA3AF',
  },
  statusText: {
    fontSize: 14, // 提升至辅助信息最小14pt
    fontWeight: '500',
    color: '#374151',
  },
  emptyRecordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecordText: {
    fontSize: 16, // 提升至最小交互文字16pt
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  historyButtonText: {
    fontSize: 16, // 按钮文字最小16pt
    color: theme.colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  historyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  historyDateColumn: {
    width: 80,
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 14, // 提升至辅助信息最小14pt
    fontWeight: '600',
    color: '#6B7280',
  },
  historyTime: {
    fontSize: 13, // 提升至辅助信息最小13pt
    color: '#9CA3AF',
    marginTop: 2,
  },
  historyDetailsColumn: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  historyDuration: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
  },
  historyEndTime: {
    fontSize: 13, // 提升至辅助信息最小13pt
    color: '#6B7280',
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 14, // 提升至辅助信息最小14pt
    fontWeight: '500',
  },
  moreRecordsHint: {
    fontSize: 14, // 提升至辅助信息最小14pt
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  
});