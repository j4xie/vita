import React, { useState, useEffect, useRef } from 'react';
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
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useUser } from '../../context/UserContext';
import { VolunteerListLiquidScreen } from '../wellbeing/VolunteerListLiquidScreen';
import { getVolunteerRecords, getLastVolunteerRecord, getPersonalVolunteerHours } from '../../services/volunteerAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';

const { width: screenWidth } = Dimensions.get('window');

// 修复的个人志愿者数据组件 - 使用正确的API调用
const PersonalVolunteerDataFixed: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [personalData, setPersonalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // 计算工作时长（分钟）- 修复时区问题
  const calculateWorkDuration = (startTime: string, endTime: string | null): number => {
    if (!startTime || !endTime) return 0;
    try {
      // 处理时区问题，避免双重转换
      let start: Date, end: Date;
      
      // 解析开始时间
      if (startTime.includes(' ')) {
        const isoTime = startTime.replace(' ', 'T') + (startTime.includes('+') ? '' : '+08:00');
        start = new Date(isoTime);
      } else if (startTime.includes('T') && (startTime.includes('Z') || startTime.includes('+'))) {
        start = new Date(startTime);
      } else {
        start = new Date(startTime);
      }
      
      // 解析结束时间
      if (endTime.includes(' ')) {
        const isoTime = endTime.replace(' ', 'T') + (endTime.includes('+') ? '' : '+08:00');
        end = new Date(isoTime);
      } else if (endTime.includes('T') && (endTime.includes('Z') || endTime.includes('+'))) {
        end = new Date(endTime);
      } else {
        end = new Date(endTime);
      }
      
      return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
    } catch {
      return 0;
    }
  };

  // 计算当前工作时长（分钟） - 修复时区问题
  const calculateCurrentWorkDuration = (startTime: string): number => {
    if (!startTime) return 0;
    try {
      // 处理时区问题，避免双重转换
      let start: Date;
      
      if (startTime.includes(' ')) {
        const isoTime = startTime.replace(' ', 'T') + (startTime.includes('+') ? '' : '+08:00');
        start = new Date(isoTime);
      } else if (startTime.includes('T') && (startTime.includes('Z') || startTime.includes('+'))) {
        start = new Date(startTime);
      } else {
        start = new Date(startTime);
      }
      
      const now = currentTime;
      const diffMs = now.getTime() - start.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60)));
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
            有签到时间: !!lastRecord.startTime,
            有签退时间: !!lastRecord.endTime,
            当前状态: lastRecord.startTime && !lastRecord.endTime ? '工作中' : '已签退'
          });
        }

        // 4. 设置个人数据
        setPersonalData({
          totalMinutes: totalWorkMinutes,
          totalHours: Math.floor(totalWorkMinutes / 60),
          totalRecords: recordsCount,
          recentRecord: lastRecord,
          allRecords: personalRecords,
          currentStatus: lastRecord && lastRecord.startTime && !lastRecord.endTime ? 'signed_in' : 'signed_out',
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

      {/* 工作统计 */}
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

// School type定义
interface School {
  id: string;
  name: string;
  nameCN?: string;
  nameEN?: string;
}

export const VolunteerManagementScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { permissions, user } = useUser();
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles } = darkModeSystem;

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
          <VolunteerListLiquidScreen />
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
});