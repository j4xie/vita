import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useUser } from '../../context/UserContext';
import { VolunteerSchoolListScreen } from './VolunteerSchoolListScreen';
import { getVolunteerRecords, getLastVolunteerRecord, getPersonalVolunteerHours, volunteerSignRecord, performVolunteerCheckOut } from '../../services/volunteerAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { timeService } from '../../utils/UnifiedTimeService';
import { VolunteerTimeEntryModal } from '../../components/modals/VolunteerTimeEntryModal';
import { SafeAlert } from '../../utils/SafeAlert';
import { apiCache } from '../../services/apiCache';

const { width: screenWidth } = Dimensions.get('window');

// 修复的个人志愿者数据组件 - 使用正确的API调用
const PersonalVolunteerDataFixed: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 补录工时模态框状态
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [isOperating, setIsOperating] = useState(false);

  // 实时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    loadPersonalData();
  }, [user]);

  // 页面获得焦点时强制刷新数据
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 [VolunteerHome] 页面获得焦点，刷新数据');
      loadPersonalData();
    }, [user])
  );

  // 定时刷新数据，确保签退后状态更新（缩短到3秒）
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log('⏰ [VolunteerHome] 定时刷新数据');
      loadPersonalData();
    }, 3000); // 每3秒刷新一次数据

    return () => clearInterval(refreshInterval);
  }, [user]);

  // 计算工作时长（分钟）- 使用统一时间服务
  const calculateWorkDuration = (startTime: string, endTime: string | null): number => {
    if (!startTime || !endTime) return 0;
    try {
      // 使用统一时间服务解析时间（startTime和endTime是本地时间）
      const start = timeService.parseServerTime(startTime, true);
      const end = timeService.parseServerTime(endTime, true);

      if (!start || !end) return 0;
      
      return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
    } catch {
      return 0;
    }
  };

  // 计算当前工作时长（分钟） - 使用统一时间服务
  const calculateCurrentWorkDuration = (startTime: string): number => {
    if (!startTime) return 0;
    try {
      // 使用统一时间服务解析开始时间（startTime是本地时间）
      const start = timeService.parseServerTime(startTime, true);
      if (!start) return 0;

      const now = currentTime;
      const diffMs = now.getTime() - start.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
    } catch {
      return 0;
    }
  };

  const loadPersonalData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
        // 1. 使用API 19获取个人总工时
        const personalHoursResult = await getPersonalVolunteerHours(parseInt(user.userId));
        
        if (personalHoursResult.code === 200 && personalHoursResult.data) {
          totalWorkMinutes = personalHoursResult.data.totalMinutes || 0;
          console.log('✅ 使用个人工时API获取成功:', { totalMinutes: totalWorkMinutes });
        }

        // 2. 获取个人签到记录 (使用API 10)
        const recordsResult = await getVolunteerRecords({ userId: parseInt(user.userId) });
        
        if (recordsResult.code === 200 && recordsResult.rows && Array.isArray(recordsResult.rows)) {
          personalRecords = recordsResult.rows;
          recordsCount = personalRecords.length;
          console.log('✅ 个人记录获取成功:', { recordsCount });
        }

        // 3. 获取最新记录状态 (使用API 13)
        const lastRecordResult = await getLastVolunteerRecord(parseInt(user.userId));
        if (lastRecordResult.code === 200 && lastRecordResult.data) {
          lastRecord = lastRecordResult.data;
          console.log('✅ 最新记录获取成功:', {
            记录ID: lastRecord.id,
            签到时间: lastRecord.startTime,
            签退时间: lastRecord.endTime,
            有签到时间: !!lastRecord.startTime,
            有签退时间: !!lastRecord.endTime,
            当前状态: lastRecord.startTime && !lastRecord.endTime ? '工作中' : '已签退'
          });
        } else {
          console.log('⚠️ 未获取到最新记录，用户可能还未签到过');
        }

        // 4. 判断当前状态（更严格的逻辑）
        let currentStatus: 'signed_in' | 'signed_out' | 'no_records';
        if (!lastRecord) {
          currentStatus = 'no_records';
          console.log('📊 状态判断: 无记录 -> no_records');
        } else if (lastRecord.startTime && !lastRecord.endTime) {
          currentStatus = 'signed_in';
          console.log('📊 状态判断: 已签到未签退 -> signed_in');
        } else {
          currentStatus = 'signed_out';
          console.log('📊 状态判断: 已签退或无活动会话 -> signed_out');
        }

        // 5. 设置个人数据
        setPersonalData({
          totalMinutes: totalWorkMinutes,
          totalHours: Math.floor(totalWorkMinutes / 60),
          totalRecords: recordsCount,
          recentRecord: lastRecord,
          allRecords: personalRecords,
          currentStatus: currentStatus,
          user: {
            name: user.legalName || user.userName,
            department: user.dept?.deptName || '未知部门',
            level: 'Staff',
          }
        });

        console.log('📱 [VolunteerHome] 数据更新完成，当前状态:', currentStatus);
        
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
      setRefreshing(false);
    }
  };

  // 处理下拉刷新
  const onRefresh = () => {
    loadPersonalData(true);
  };

  // 处理签到
  const handleCheckIn = async () => {
    if (!user?.id || !user?.legalName || isOperating) return;

    setIsOperating(true);
    try {
      const startTime = timeService.formatLocalTime(new Date());
      const result = await volunteerSignRecord(
        user.id, // userId
        1, // 签到
        user.id, // operateUserId
        user.legalName, // operateLegalName
        startTime
      );

      if (result.code === 200) {
        SafeAlert.alert(t('volunteer.signin_success'), t('volunteer.signin_success_msg', { name: user.legalName }));
        // 刷新数据
        setTimeout(() => loadPersonalData(true), 1000);
      } else {
        SafeAlert.alert(t('common.error'), result.msg || t('volunteer.signin_operation_failed'));
      }
    } catch (error) {
      console.error('签到失败:', error);
      SafeAlert.alert(t('common.error'), t('volunteer.signin_operation_failed'));
    } finally {
      setIsOperating(false);
    }
  };

  // 处理签退（跳转到签退页面）
  const handleCheckOut = () => {
    if (!personalData?.recentRecord) return;

    // 构造志愿者记录对象
    const volunteerRecord = {
      userId: user?.id,
      name: user?.legalName || user?.userName,
      school: user?.dept?.deptName || '',
      checkInTime: personalData.recentRecord.startTime,
      status: 'checked_in' as const,
    };

    // 跳转到签退页面
    navigation.navigate('VolunteerCheckOut', {
      volunteer: volunteerRecord,
    });
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

  // 格式化当前工作时长显示
  const formatCurrentWorkTime = () => {
    if (personalData.currentStatus !== 'signed_in' || !personalData.recentRecord?.startTime) {
      return null;
    }
    
    const minutes = calculateCurrentWorkDuration(personalData.recentRecord.startTime);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${remainingMinutes}m`;
    }
  };

  return (
    <ScrollView
      style={styles.personalDataScrollContainer}
      contentContainerStyle={styles.personalDataContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
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

      {/* 工作统计 */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {(personalData.totalMinutes / 60).toFixed(1)}小时
          </Text>
          <Text style={styles.statLabel}>{t('wellbeing.personal.stats.total_work_hours')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{personalData.totalRecords}</Text>
          <Text style={styles.statLabel}>{t('wellbeing.personal.stats.total_records')}</Text>
        </View>
      </View>

      {/* 当前工作时间显示 - 修复实时更新 */}
      {personalData.currentStatus === 'signed_in' && (
        <View style={styles.currentWorkCard}>
          <Text style={styles.currentWorkTitle}>当前工作时间</Text>
          <Text style={styles.currentWorkTime}>
            {formatCurrentWorkTime()}
          </Text>
        </View>
      )}

      {/* 最近记录 */}
      {personalData.recentRecord ? (
        <View style={styles.recentRecordCard}>
          <Text style={styles.recentRecordTitle}>{t('wellbeing.personal.recent_record.title')}</Text>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.checkin_time')}</Text>
            <Text style={styles.recordValue}>
              {timeService.formatForDisplay(timeService.parseServerTime(personalData.recentRecord.startTime, true), { showDate: true, showTime: true })}
            </Text>
          </View>
          {personalData.recentRecord.endTime ? (
            <>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.checkout_time')}</Text>
                <Text style={styles.recordValue}>
                  {timeService.formatForDisplay(timeService.parseServerTime(personalData.recentRecord.endTime, true), { showDate: true, showTime: true })}
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

      {/* 快捷操作按钮区域 */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>{t('volunteerHome.quickActions', '快捷操作')}</Text>
        <View style={styles.quickActionsRow}>
          {/* 签到按钮 */}
          {personalData.currentStatus !== 'signed_in' && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.checkInButton]}
              onPress={handleCheckIn}
              disabled={isOperating}
            >
              <Ionicons name="log-in-outline" size={18} color="white" />
              <Text style={styles.quickActionText}>
                {t('volunteerCheckIn.checkIn')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 签退按钮 */}
          {personalData.currentStatus === 'signed_in' && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.checkOutButton]}
              onPress={handleCheckOut}
              disabled={isOperating}
            >
              <Ionicons name="log-out-outline" size={18} color="white" />
              <Text style={styles.quickActionText}>
                {t('volunteerCheckIn.checkOut')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 补录工时按钮 */}
          <TouchableOpacity
            style={[styles.quickActionButton, styles.timeEntryButton]}
            onPress={() => setShowTimeEntryModal(true)}
            disabled={isOperating}
          >
            <Ionicons name="time-outline" size={18} color="white" />
            <Text style={styles.quickActionText}>
              {t('volunteerCheckIn.timeEntry')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
                  {timeService.formatForDisplay(timeService.parseServerTime(record.startTime, true), { showTime: true })}
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
                      {t('wellbeing.personal.history.end_time_until')} {timeService.formatForDisplay(timeService.parseServerTime(record.endTime, true), { showTime: true })}
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

      {/* 补录工时模态框 */}
      <VolunteerTimeEntryModal
        visible={showTimeEntryModal}
        onClose={() => setShowTimeEntryModal(false)}
        onSuccess={() => {
          setShowTimeEntryModal(false);
          // 补录成功后刷新数据
          setTimeout(() => loadPersonalData(true), 1000);
        }}
      />
    </ScrollView>
  );
};

// School type定义
interface School {
  id: string;
  name: string;
  nameCN?: string;
  nameEN?: string;
}

export const VolunteerHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { permissions, user } = useUser();

  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles } = darkModeSystem;

  // 管理员快捷操作状态管理
  const [adminVolunteerStatus, setAdminVolunteerStatus] = useState<'checked_in' | 'checked_out' | 'loading'>('loading');
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  // 加载管理员的志愿者状态
  const loadAdminVolunteerStatus = async () => {
    if (!user?.userId || !permissions.isAdmin()) return;

    try {
      const response = await getLastVolunteerRecord(parseInt(user.userId));
      if (response.code === 200 && response.data) {
        const record = response.data;
        setCurrentRecord(record);

        // 判断状态：有签到时间但没有签退时间 = 已签到
        if (record.startTime && !record.endTime) {
          setAdminVolunteerStatus('checked_in');
        } else {
          setAdminVolunteerStatus('checked_out');
        }
      } else {
        // 没有记录，状态为未签到
        setAdminVolunteerStatus('checked_out');
        setCurrentRecord(null);
      }
    } catch (error) {
      console.error('加载管理员志愿者状态失败:', error);
      setAdminVolunteerStatus('checked_out');
    }
  };

  // 页面加载时获取状态
  useEffect(() => {
    if (permissions.isAdmin()) {
      loadAdminVolunteerStatus();
    }
  }, [user?.userId, permissions]);

  // 页面聚焦时刷新状态
  useFocusEffect(
    React.useCallback(() => {
      if (permissions.isAdmin()) {
        // 检查是否从签退页面返回
        const navigationState = navigation.getState();
        const previousRoute = navigationState.routes[navigationState.index - 1];

        if (previousRoute?.name === 'VolunteerCheckOut') {
          // 从签退页面返回，立即设置为签退状态并清理缓存
          console.log('🔄 从签退页面返回，立即更新状态为 checked_out');
          setAdminVolunteerStatus('checked_out');

          // 清理所有相关缓存，确保数据一致性
          try {
            apiCache.clearByPattern(`volunteerRecord:${user?.id}`);
            apiCache.clearKey('volunteerRecords');
            apiCache.clearKey('volunteerHours');
            console.log('✅ [CHECKOUT-RETURN] 已清理缓存，确保状态同步');
          } catch (error) {
            console.warn('签退返回时缓存清理失败:', error);
          }

          // 延迟验证服务器状态
          setTimeout(() => loadAdminVolunteerStatus(), 500);
        } else {
          // 正常情况，加载状态
          loadAdminVolunteerStatus();
        }
      }
    }, [user?.userId, permissions, navigation])
  );

  // 管理员快捷签到
  const handleAdminCheckIn = async () => {
    if (!user?.id || !user?.legalName || isOperating) return;

    setIsOperating(true);
    try {
      const now = new Date();
      // 直接使用最简单的时间格式化，避免任何复杂逻辑
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const startTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // 详细的时间调试信息
      console.log('🕐 [SIGNIN-DEBUG] ========== 签到时间调试 ==========');
      console.log('🕐 [SIGNIN-DEBUG] 本地时间对象:', now);
      console.log('🕐 [SIGNIN-DEBUG] 本地时间ISO:', now.toISOString());
      console.log('🕐 [SIGNIN-DEBUG] 本地时间字符串:', now.toString());
      console.log('🕐 [SIGNIN-DEBUG] 格式化后时间:', startTime);
      console.log('🕐 [SIGNIN-DEBUG] 用户时区:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log('🕐 [SIGNIN-DEBUG] 时区偏移(分钟):', now.getTimezoneOffset());
      console.log('🕐 [SIGNIN-DEBUG] ================================');

      const result = await volunteerSignRecord(
        user.id, // userId
        1, // 签到
        user.id, // operateUserId
        user.legalName, // operateLegalName
        startTime
      );

      if (result.code === 200) {
        // 乐观更新：立即更新本地状态
        setAdminVolunteerStatus('checked_in');

        // 彻底清理所有相关缓存，确保其他页面能获取到最新数据
        try {
          // 清理个人相关的所有缓存
          apiCache.clearByPattern(`volunteerRecord:${user.id}`);
          apiCache.clearByPattern(`userInfo:${user.id}`);
          apiCache.clearKey('volunteerRecords');
          apiCache.clearKey('volunteerHours');

          // 强制清理所有志愿者相关缓存
          apiCache.clearByPattern('volunteer');
          apiCache.clearByPattern('user');

          // 额外清理特定缓存键
          apiCache.clearAll(); // 最彻底的清理

          console.log('✅ [CHECKIN-SUCCESS] 已彻底清理缓存，强制刷新所有数据');
        } catch (error) {
          console.warn('缓存清理失败:', error);
        }

        SafeAlert.alert(
          t('volunteer.signin_success'),
          t('volunteer.signin_success_msg', { name: user.legalName }),
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                // 后台验证状态
                setTimeout(() => loadAdminVolunteerStatus(), 1000);
              }
            }
          ]
        );
      } else {
        SafeAlert.alert(t('common.error'), result.msg || t('volunteer.signin_operation_failed'));
      }
    } catch (error) {
      console.error('管理员签到失败:', error);
      SafeAlert.alert(t('common.error'), t('volunteer.signin_operation_failed'));
    } finally {
      setIsOperating(false);
    }
  };

  // 管理员快捷签退（跳转到签退页面）
  const handleAdminCheckOut = () => {
    if (adminVolunteerStatus !== 'checked_in') return;

    // 直接使用简单的当前时间，避免API获取的复杂性
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const volunteerRecord = {
      userId: user?.id,
      name: user?.legalName || user?.userName,
      school: user?.dept?.deptName || '',
      checkInTime: currentTime, // 使用当前时间作为签到时间
      status: 'checked_in' as const,
    };

    console.log('🔄 [CHECKOUT-NAV] 跳转到签退页面，使用当前时间作为签到时间:', currentTime);

    // 跳转到签退页面
    navigation.navigate('VolunteerCheckOut', {
      volunteer: volunteerRecord,
    });
  };

  // 如果是普通用户，显示无权限提示
  if (permissions.isRegularUser()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Text style={styles.noPermissionText}>
            {t('wellbeing.volunteer.no_permission', '您没有权限访问志愿者功能')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    return (
      <View style={styles.volunteerContent}>
        {permissions.getDataScope() === 'self' ? (
          // Staff：只显示自己的志愿者工作记录，header已经有标题了
          <PersonalVolunteerDataFixed />
        ) : (
          // 总管理员和分管理员：显示学校管理界面
          <View style={styles.adminContentContainer}>
            {/* 快捷操作区域 - 只有总管理员显示 */}
            {permissions.isAdmin() && (
              <View style={styles.personalQuickSection}>
                <Text style={styles.quickActionsTitle}>{t('volunteerHome.quickActions')}</Text>
                <View style={styles.quickActionsRow}>
                  {/* 动态显示签到或签退按钮 */}
                  {adminVolunteerStatus === 'checked_out' && (
                    <TouchableOpacity
                      style={[styles.quickActionButton, styles.checkInButtonBorder]}
                      onPress={handleAdminCheckIn}
                      disabled={isOperating}
                    >
                      <Ionicons name="log-in-outline" size={16} color={theme.colors.primary} />
                      <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>
                        {isOperating ? t('common.loading', '加载中...') : t('volunteerCheckIn.checkIn')}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {adminVolunteerStatus === 'checked_in' && (
                    <TouchableOpacity
                      style={[styles.quickActionButton, styles.checkOutButtonBorder]}
                      onPress={handleAdminCheckOut}
                      disabled={isOperating}
                    >
                      <Ionicons name="log-out-outline" size={16} color={theme.colors.success} />
                      <Text style={[styles.quickActionText, { color: theme.colors.success }]}>
                        {t('volunteerCheckIn.checkOut')}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Time Entry 按钮 - 始终显示，直接打开模态框 */}
                  <TouchableOpacity
                    style={[styles.quickActionButton, styles.timeEntryButtonBorder]}
                    onPress={() => setShowTimeEntryModal(true)}
                    disabled={isOperating}
                  >
                    <Ionicons name="time-outline" size={16} color="#8B5CF6" />
                    <Text style={[styles.quickActionText, { color: '#8B5CF6' }]}>
                      {t('volunteerCheckIn.timeEntry')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 学校管理界面 */}
            <View style={styles.schoolManagementSection}>
              <VolunteerSchoolListScreen />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
      <LinearGradient 
        colors={isDarkMode ? [
          '#000000',
          '#1C1C1E',
          '#2C2C2E',
          '#1C1C1E'
        ] : [
          '#FFFFFF',
          '#F8F9FA',
          '#F8F9FA',
          '#F1F3F4'
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.6, 1]}
      />
      
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {permissions.getDataScope() === 'self' ? t('wellbeing.personal.title') : t('profile.volunteer.management', '志愿者管理')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Time Entry 模态框 - 只有总管理员可用 */}
      {permissions.isAdmin() && (
        <VolunteerTimeEntryModal
          visible={showTimeEntryModal}
          onClose={() => setShowTimeEntryModal(false)}
          onSuccess={() => {
            setShowTimeEntryModal(false);
            // 补录成功后刷新状态
            setTimeout(() => loadAdminVolunteerStatus(), 1000);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32, // 与back button相同宽度，保持标题居中
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  volunteerContent: {
    flex: 1,
  },
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
  staffTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  staffSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // 个人志愿者数据样式
  personalDataScrollContainer: {
    flex: 1,
  },
  personalDataContainer: {
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
    fontSize: 16,
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
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  currentWorkCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentWorkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  currentWorkTime: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  recentRecordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    fontSize: 16,
    color: '#6B7280',
  },
  recordValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
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
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  historyTime: {
    fontSize: 13,
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
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  moreRecordsHint: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
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
  // 管理员布局样式
  adminContentContainer: {
    flex: 1,
  },
  personalQuickSection: {
    backgroundColor: 'rgba(248, 250, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  personalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  personalName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  personalRole: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
  },
  schoolManagementSection: {
    flex: 1,
  },
  // 快捷操作样式
  quickActionsContainer: {
    marginTop: 0,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
    minWidth: 100,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1.5,
    gap: 6,
  },
  checkInButtonBorder: {
    borderColor: theme.colors.primary,
  },
  checkOutButtonBorder: {
    borderColor: theme.colors.success,
  },
  timeEntryButtonBorder: {
    borderColor: '#8B5CF6',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});