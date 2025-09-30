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
import { useVolunteerContext } from '../../context/VolunteerContext';
import { VolunteerSchoolListScreen } from './VolunteerSchoolListScreen';
import volunteerAutoCheckoutService from '../../services/volunteerAutoCheckoutService';
import { getVolunteerRecords, getLastVolunteerRecord, getPersonalVolunteerHours, volunteerSignRecord, performVolunteerCheckOut } from '../../services/volunteerAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { timeService } from '../../utils/UnifiedTimeService';
import { VolunteerTimeEntryModal } from '../../components/modals/VolunteerTimeEntryModal';
import { SafeAlert } from '../../utils/SafeAlert';
import { apiCache } from '../../services/apiCache';

const { width: screenWidth } = Dimensions.get('window');

// 修复的个人志愿者数据组件 - 使用正确的API调用
const PersonalVolunteerDataFixed: React.FC = () => {
  const { user, refreshUserInfo } = useUser();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const volunteerContext = useVolunteerContext();
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

  // 首次加载数据
  React.useEffect(() => {
    loadPersonalData();
  }, []); // 只在首次挂载时加载

  // 页面获得焦点时刷新数据（切换界面返回时触发）
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 [VolunteerHome] 页面获得焦点，刷新数据');

      // 先刷新用户信息（包括最新的岗位信息）
      if (refreshUserInfo) {
        refreshUserInfo().then(() => {
          // 用户信息更新后再加载志愿者数据
          loadPersonalData();
        }).catch(error => {
          console.warn('⚠️ [VolunteerHome] 用户信息刷新失败:', error);
          // 即使失败也加载数据
          loadPersonalData();
        });
      } else {
        loadPersonalData();
      }

      // 检查超时签到状态
      if (user?.userId) {
        volunteerAutoCheckoutService.triggerOvertimeCheck().catch(error => {
          console.warn('⚠️ [VolunteerHome] 超时检查失败:', error);
        });
      }
    }, []) // 空依赖，避免无限循环
  );

  // 计算工作时长（分钟）- 使用统一时间服务
  const calculateWorkDuration = (startTime: string, endTime: string | null): number => {
    if (!startTime || !endTime) return 0;
    try {
      // 使用统一时间服务解析
      const start = timeService.parseServerTime(startTime);
      const end = timeService.parseServerTime(endTime);

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
      // 使用统一时间服务解析
      const start = timeService.parseServerTime(startTime);
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
            position: user.post?.postName || (user as any).postCode || 'Staff',
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
            position: user.post?.postName || (user as any).postCode || 'Staff',
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
    if (!user?.userId || !user?.legalName || isOperating) return;

    setIsOperating(true);
    try {
      const startTime = timeService.formatLocalTime(new Date());
      const userId = typeof user.userId === 'string' ? parseInt(user.userId) : user.userId;
      const result = await volunteerSignRecord(
        userId, // userId
        1, // 签到
        userId, // operateUserId
        user.legalName, // operateLegalName
        startTime
      );

      if (result.code === 200) {
        SafeAlert.alert(t('volunteer.signin_success'), t('volunteer.signin_success_msg', { name: user.legalName }));

        // 🆕 记录自动签退状态
        try {
          // 获取刚创建的记录ID，通常可以从API响应中获取，或从最后记录中获取
          const lastRecordResult = await getLastVolunteerRecord(parseInt(user.userId));
          if (lastRecordResult.code === 200 && lastRecordResult.data) {
            await volunteerContext.recordAutoCheckout(
              user.userId.toString(),
              user.legalName,
              lastRecordResult.data.id
            );
            console.log('✅ [VOLUNTEER-HOME] 已记录自动签退状态');
          }
        } catch (autoCheckoutError) {
          console.error('❌ [VOLUNTEER-HOME] 记录自动签退状态失败:', autoCheckoutError);
        }

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
        <Text style={styles.personalName}>{user?.legalName || user?.userName}</Text>
        <Text style={styles.personalRole}>
          {user?.post?.postName || (user as any)?.postCode || 'Staff'} • {user?.dept?.deptName || '未知部门'}
        </Text>
        
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
      {(() => {
        // 根据当前状态决定显示内容
        if (personalData.currentStatus === 'signed_in' && personalData.recentRecord?.startTime) {
          // 情况1：正在工作中，显示当前签到信息
          return (
            <View style={styles.recentRecordCard}>
              <Text style={styles.recentRecordTitle}>{t('wellbeing.personal.recent_record.title')}</Text>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.checkin_time')}</Text>
                <Text style={styles.recordValue}>
                  {timeService.formatForDisplay(timeService.parseServerTime(personalData.recentRecord.startTime), { showDate: true, showTime: true })}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={[styles.recordLabel, { color: theme.colors.primary }]}>{t('wellbeing.personal.recent_record.status')}</Text>
                <Text style={[styles.recordValue, { color: theme.colors.primary, fontWeight: '600' }]}>
                  {t('wellbeing.personal.recent_record.working')}
                </Text>
              </View>
            </View>
          );
        } else {
          // 情况2：未工作或已签退，查找最近的完整记录
          const completedRecords = (personalData.allRecords || []).filter(record =>
            record.startTime && record.endTime && record.status !== 2
          );

          if (completedRecords.length > 0) {
            // 按签退时间排序，获取最新的
            completedRecords.sort((a, b) =>
              new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
            );
            const latestRecord = completedRecords[0];

            return (
              <View style={styles.recentRecordCard}>
                <Text style={styles.recentRecordTitle}>{t('wellbeing.personal.recent_record.title')}</Text>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.checkin_time')}</Text>
                  <Text style={styles.recordValue}>
                    {timeService.formatForDisplay(timeService.parseServerTime(latestRecord.startTime), { showDate: true, showTime: true })}
                  </Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.checkout_time')}</Text>
                  <Text style={styles.recordValue}>
                    {timeService.formatForDisplay(timeService.parseServerTime(latestRecord.endTime), { showDate: true, showTime: true })}
                  </Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>{t('wellbeing.personal.recent_record.work_duration')}</Text>
                  <Text style={styles.recordValue}>
                    {(() => {
                      const duration = calculateWorkDuration(latestRecord.startTime, latestRecord.endTime);
                      const hours = Math.floor(duration / 60);
                      const minutes = duration % 60;
                      return hours > 0 ? `${hours} ${t('wellbeing.personal.recent_record.hours')} ${minutes} ${t('wellbeing.personal.recent_record.minutes')}` : `${minutes} ${t('wellbeing.personal.recent_record.minutes')}`;
                    })()}
                  </Text>
                </View>
              </View>
            );
          } else {
            // 情况3：没有任何完整记录
            return (
              <View style={styles.emptyRecordCard}>
                <Ionicons name="time-outline" size={32} color={theme.colors.text.secondary} />
                <Text style={styles.emptyRecordText}>{t('wellbeing.personal.no_data')}</Text>
              </View>
            );
          }
        }
      })()}

      {/* 快捷操作按钮区域 */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsRow}>
          {/* 签到按钮 */}
          {personalData.currentStatus !== 'signed_in' && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.checkInButtonBorder]}
              onPress={handleCheckIn}
              disabled={isOperating}
            >
              <Ionicons name="log-in-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.quickActionText, { color: theme.colors.primary }]}>
                {t('volunteerCheckIn.checkIn')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 签退按钮 */}
          {personalData.currentStatus === 'signed_in' && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.checkOutButtonBorder]}
              onPress={handleCheckOut}
              disabled={isOperating}
            >
              <Ionicons name="log-out-outline" size={18} color={theme.colors.success} />
              <Text style={[styles.quickActionText, { color: theme.colors.success }]}>
                {t('volunteerCheckIn.checkOut')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 补录工时按钮 */}
          <TouchableOpacity
            style={[styles.quickActionButton, styles.timeEntryButtonBorder]}
            onPress={() => setShowTimeEntryModal(true)}
            disabled={isOperating}
          >
            <Ionicons name="time-outline" size={18} color="#8B5CF6" />
            <Text style={[styles.quickActionText, { color: '#8B5CF6' }]}>
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
                  {timeService.formatForDisplay(timeService.parseServerTime(record.startTime), { showTime: true })}
                </Text>
              </View>
              <View style={styles.historyDetailsColumn}>
                {record.endTime ? (
                  <>
                    <View style={styles.historyDurationRow}>
                      <Text style={styles.historyDuration}>
                        {t('wellbeing.personal.history.work_duration_label')} {(() => {
                          const duration = calculateWorkDuration(record.startTime, record.endTime);
                          const hours = Math.floor(duration / 60);
                          const minutes = duration % 60;
                          return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                        })()}
                      </Text>
                      {/* 状态标签 */}
                      <View style={[
                        styles.historyStatusBadge,
                        record.status === 1 ? styles.historyStatusApproved :
                        record.status === 2 ? styles.historyStatusRejected :
                        styles.historyStatusPending
                      ]}>
                        <Text style={[
                          styles.historyStatusText,
                          record.status === 1 ? styles.historyStatusApprovedText :
                          record.status === 2 ? styles.historyStatusRejectedText :
                          styles.historyStatusPendingText
                        ]}>
                          {record.status === 1 ? t('wellbeing.volunteer.history.status.approved') :
                           record.status === 2 ? t('wellbeing.volunteer.history.status.rejected') :
                           t('wellbeing.volunteer.history.status.pending')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.historyEndTime}>
                      {t('wellbeing.personal.history.end_time_until')} {timeService.formatForDisplay(timeService.parseServerTime(record.endTime), { showTime: true })}
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

// 计算工作时长（分钟）- 通用函数
const calculateWorkDuration = (startTime: string, endTime: string | null): number => {
  if (!startTime || !endTime) return 0;
  try {
    const start = timeService.parseServerTime(startTime);
    const end = timeService.parseServerTime(endTime);
    if (!start || !end) return 0;
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  } catch (error) {
    console.error('时长计算失败:', error);
    return 0;
  }
};

export const VolunteerHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { permissions, user, refreshUserInfo } = useUser();

  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles } = darkModeSystem;

  // 用户信息刷新状态
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  // 管理员快捷操作状态管理
  const [adminVolunteerStatus, setAdminVolunteerStatus] = useState<'checked_in' | 'checked_out' | 'loading'>('loading');
  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [adminHistoryRecord, setAdminHistoryRecord] = useState<any>(null);


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

        // 额外获取历史记录用于显示
        console.log('🔍 [ADMIN-HISTORY-LOAD] 获取管理员历史记录...');
        try {
          const historyResponse = await getVolunteerRecords({ userId: parseInt(user.userId) });
          if (historyResponse.code === 200 && historyResponse.rows) {
            // 找到最近的完整记录
            const completedRecords = historyResponse.rows.filter(r =>
              r.startTime && r.endTime && r.status !== 2
            );
            if (completedRecords.length > 0) {
              completedRecords.sort((a, b) =>
                new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
              );
              setAdminHistoryRecord(completedRecords[0]);
              console.log('✅ [ADMIN-HISTORY-LOAD] 找到历史记录:', completedRecords[0]);
            }
          }
        } catch (historyError) {
          console.log('❌ [ADMIN-HISTORY-LOAD] 获取历史记录失败:', historyError);
        }
      } else {
        // 没有记录，状态为未签到
        setAdminVolunteerStatus('checked_out');
        setCurrentRecord(null);
        setAdminHistoryRecord(null);
      }
    } catch (error) {
      console.error('加载管理员志愿者状态失败:', error);
      setAdminVolunteerStatus('checked_out');
    }
  };

  // 页面聚焦时刷新用户信息（确保角色/权限是最新的）
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 [VolunteerHome-Main] 页面获得焦点，刷新用户信息');

      // 设置刷新状态
      setIsRefreshingUser(true);

      // 刷新用户信息
      if (refreshUserInfo) {
        refreshUserInfo()
          .then(() => {
            console.log('✅ [VolunteerHome-Main] 用户信息刷新成功，最新权限:', permissions.getPermissionLevel());
            setIsRefreshingUser(false);
          })
          .catch(error => {
            console.warn('⚠️ [VolunteerHome-Main] 用户信息刷新失败:', error);
            setIsRefreshingUser(false);
          });
      } else {
        setIsRefreshingUser(false);
      }
    }, [])
  );

  // 页面加载时获取状态
  useEffect(() => {
    if (permissions.isAdmin()) {
      loadAdminVolunteerStatus();
    }
  }, [user?.userId, permissions]);

  // 分管理员自动跳转
  useEffect(() => {
    if (permissions.getDataScope() === 'school' && user?.deptId && user?.dept) {
      const userSchool = {
        id: user.deptId,
        deptId: user.deptId,
        deptName: user.dept.deptName || '我的学校',
        engName: (user.dept as any).engName,
        aprName: (user.dept as any).aprName
      };

      setTimeout(() => {
        (navigation as any).replace('VolunteerSchoolDetail', { school: userSchool });
      }, 500);
    }
  }, [permissions, user?.deptId, user?.dept, navigation]);

  // 页面聚焦时刷新管理员状态
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
    if (!user?.userId || !user?.legalName || isOperating) return;

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
      console.log('🕐 [SIGNIN-DEBUG] 本地时间:', now.toLocaleString());
      console.log('🕐 [SIGNIN-DEBUG] ================================');

      const userId = typeof user.userId === 'string' ? parseInt(user.userId) : user.userId;
      const result = await volunteerSignRecord(
        userId, // userId
        1, // 签到
        userId, // operateUserId
        user.legalName, // operateLegalName
        startTime
      );

      if (result.code === 200) {
        // 乐观更新：立即更新本地状态
        setAdminVolunteerStatus('checked_in');

        // 🆕 立即创建临时签到记录，避免用户立即点击Check Out时出现"无法获取签到时间"错误
        const tempRecord = {
          id: Date.now(), // 临时ID
          userId: user.userId,
          startTime: startTime,
          endTime: null,
          type: 1,
          legalName: user.legalName
        };
        setCurrentRecord(tempRecord);
        console.log('✅ [CHECKIN-SUCCESS] 立即设置临时签到记录:', tempRecord);

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
                // 后台验证状态，确保数据一致性
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

    // 🔧 修复：使用真实的签到时间，而不是当前时间
    if (!currentRecord?.startTime) {
      SafeAlert.alert(t('common.error'), '无法获取签到时间，请重新签到');
      return;
    }

    const volunteerRecord = {
      userId: user?.id,
      name: user?.legalName || user?.userName,
      school: user?.dept?.deptName || '',
      checkInTime: currentRecord.startTime, // 使用真实的签到时间
      status: 'checked_in' as const,
    };

    console.log('🔄 [CHECKOUT-NAV] 跳转到签退页面，使用真实签到时间:', currentRecord.startTime);

    // 跳转到签退页面
    (navigation as any).navigate('VolunteerCheckOut', {
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
        ) : permissions.getDataScope() === 'school' ? (
          // 分管理员：直接跳转到自己学校详情（跳转逻辑已移至useEffect）
          <View style={styles.partManagerRedirect}>
            <Text style={styles.redirectMessage}>
              {t('volunteerHome.redirectToSchool', '正在跳转到您的学校...')}
            </Text>
          </View>
        ) : (
          // 总管理员：显示学校管理界面 + 快捷操作
          <View style={styles.adminContentContainer}>
            {/* 快捷操作区域 - 只有总管理员显示 */}
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
              {/* 管理员最近签退状态显示 */}
              {(() => {
                // 格式化管理员状态信息（根据当前工作状态显示不同内容）
                const formatAdminStatusInfo = () => {
                  console.log('🎯 [ADMIN-STATUS] 管理员状态格式化开始:', {
                    adminVolunteerStatus,
                    currentRecord,
                    hasRecord: !!currentRecord
                  });

                  // 情况1: 管理员当前正在工作中（显示签退按钮）
                  if (adminVolunteerStatus === 'checked_in') {
                    console.log('✅ [ADMIN-WORKING] 管理员正在工作，显示当前会话信息');
                    // 显示本次签到时间和已工作时长
                    if (currentRecord && currentRecord.startTime && !currentRecord.endTime) {
                      const startTime = timeService.parseServerTime(currentRecord.startTime);
                      if (startTime) {
                        const timeStr = startTime.toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });

                        // 计算已工作时长（实时）
                        const now = new Date();
                        const workingMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
                        const hours = Math.floor(workingMinutes / 60);
                        const minutes = workingMinutes % 60;

                        let durationStr;
                        if (hours > 0) {
                          durationStr = `${hours}${t('volunteerHome.hours')}${minutes > 0 ? ` ${minutes}${t('volunteerHome.minutes')}` : ''}`;
                        } else {
                          durationStr = `${minutes}${t('volunteerHome.minutes')}`;
                        }

                        return `${t('volunteerHome.currentCheckin', '本次签到')}: **${timeStr}** • ${t('volunteerHome.working', '已工作')} **${durationStr}**`;
                      }
                    }
                    return `${t('volunteerHome.currentCheckin', '本次签到')}: ${t('volunteerHome.working', '已工作')}`;
                  }

                  // 情况2: 管理员当前未工作（显示签到按钮）
                  console.log('⏱️ [ADMIN-NOT-WORKING] 管理员未工作，检查历史记录');
                  console.log('📊 [CURRENT-RECORD-CHECK]:', {
                    hasCurrentRecord: !!currentRecord,
                    currentRecordType: typeof currentRecord,
                    isArray: Array.isArray(currentRecord),
                    currentRecord
                  });

                  // 修复：确保currentRecord是有效对象且有完整时间
                  if (adminVolunteerStatus === 'checked_out' &&
                      currentRecord &&
                      typeof currentRecord === 'object' &&
                      !Array.isArray(currentRecord) &&
                      currentRecord.endTime &&
                      currentRecord.startTime) {
                    console.log('✅ [ADMIN-HISTORY] 找到有效的历史记录');

                    const endTime = timeService.parseServerTime(currentRecord.endTime);
                    if (endTime && currentRecord.startTime) {
                      const timeStr = endTime.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      });

                      const duration = calculateWorkDuration(
                        currentRecord.startTime,
                        currentRecord.endTime
                      );
                      const hours = Math.floor(duration / 60);
                      const minutes = duration % 60;

                      let durationStr;
                      if (hours > 0) {
                        durationStr = `**${hours}**${t('volunteerHome.hours', '小时')}${minutes > 0 ? ` **${minutes}** ${t('volunteerHome.minutes', '分钟')}` : ''}`;
                      } else {
                        durationStr = `**${minutes}** ${t('volunteerHome.minutes', '分钟')}`;
                      }

                      return `${t('volunteerHome.recentCheckout', '最近签退')}: ${timeStr} • ${t('volunteerHome.worked', '工作')} ${durationStr}`;
                    }
                  }

                  // 如果currentRecord是空数组，尝试使用专门的历史记录
                  if (Array.isArray(currentRecord)) {
                    console.log('🔧 [DATA-FIX] 使用专门的历史记录数据');

                    if (adminHistoryRecord && adminHistoryRecord.endTime && adminHistoryRecord.startTime) {
                      console.log('✅ [ADMIN-HISTORY-USE] 使用历史记录显示');

                      const endTime = timeService.parseServerTime(adminHistoryRecord.endTime);
                      if (endTime) {
                        const timeStr = endTime.toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });

                        const duration = calculateWorkDuration(
                          adminHistoryRecord.startTime,
                          adminHistoryRecord.endTime
                        );
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;

                        let durationStr;
                        if (hours > 0) {
                          durationStr = `**${hours}** ${t('volunteerHome.hours', '小时')} ${minutes > 0 ? `**${minutes}** ${t('volunteerHome.minutes', '分钟')}` : ''}`;
                        } else {
                          durationStr = `**${minutes}** ${t('volunteerHome.minutes', '分钟')}`;
                        }

                        return `${t('volunteerHome.recentCheckout', '最近签退')}: **${timeStr}** • ${t('volunteerHome.worked', '工作')} ${durationStr}`;
                      }
                    }

                    return '历史记录加载中...';
                  }

                  // 如果没有任何工作记录
                  console.log('❌ [ADMIN-NO-RECORD] 确实没有工作记录');
                  return t('volunteerHome.noWorkRecord', '暂无工作记录');
                };

                const recentInfo = formatAdminStatusInfo();
                console.log('🎯 [ADMIN-FINAL-DISPLAY] 管理员最终显示内容:', recentInfo);
                console.log('📊 [ADMIN-DATA] 管理员数据状态:', {
                  adminVolunteerStatus,
                  currentRecord,
                  hasCurrentRecord: !!currentRecord
                });
                // 处理加粗显示
                const renderFormattedText = (text: string) => {
                  // 将 **text** 格式转换为加粗Text组件
                  const parts = text.split(/(\*\*.*?\*\*)/g);

                  return (
                    <Text style={styles.recentActivityText}>
                      {parts.map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          // 移除**标记并加粗
                          const boldText = part.slice(2, -2);
                          return (
                            <Text key={index} style={[styles.recentActivityText, { fontWeight: '700' }]}>
                              {boldText}
                            </Text>
                          );
                        }
                        return <Text key={index} style={styles.recentActivityText}>{part}</Text>;
                      })}
                    </Text>
                  );
                };

                return (
                  <View style={styles.recentActivityContainer}>
                    {renderFormattedText(recentInfo)}
                  </View>
                );
              })()}
            </View>

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
        {isRefreshingUser ? (
          // 正在刷新用户信息，显示loading
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
          </View>
        ) : (
          // 用户信息已加载，根据最新权限渲染内容
          renderContent()
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
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
  historyDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historyDuration: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
    flex: 1,
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
  // 历史记录状态标签样式
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  historyStatusApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  historyStatusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  historyStatusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyStatusApprovedText: {
    color: '#059669',
  },
  historyStatusRejectedText: {
    color: '#DC2626',
  },
  historyStatusPendingText: {
    color: '#D97706',
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
  adminPersonalRole: {
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
  queryButtonBorder: {
    borderColor: '#FF6B35',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // 最近活动状态样式
  recentActivityContainer: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  recentActivityText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    opacity: 0.8,
    fontWeight: '400',
  },
  // 分管理员跳转样式
  partManagerRedirect: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  redirectMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  // Query按钮样式
  queryButton: {
    backgroundColor: '#FF6B35',
  },
});