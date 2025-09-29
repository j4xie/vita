import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { i18n } from '../../utils/i18n';
import { useTheme } from '../../context/ThemeContext';
import { useVolunteerContext } from '../../context/VolunteerContext';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { getVolunteerHistoryRecords, VolunteerRecord } from '../../services/volunteerAPI';
import { timeService } from '../../utils/UnifiedTimeService';
import { getUserPermissionLevel } from '../../types/userPermissions';
import { SafeText } from '../common/SafeText';

const { height: screenHeight } = Dimensions.get('window');

// 时间范围选项
interface TimeRangeOption {
  days: 1 | 3 | 7 | 30;
  label: string;
  key: string;
}

// 历史记录项组件 - 使用React.memo优化
const HistoryRecordItem = React.memo<{
  record: VolunteerRecord;
  isDarkMode: boolean;
}>(({ record, isDarkMode }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // 计算工作时长和超时检测 - 使用统一的计算函数
  const durationInfo = useMemo(() => {
    if (!record.startTime || !record.endTime) return null;

    // 使用统一时间服务计算时长（直接解析本地时间）
    const startDate = timeService.parseServerTime(record.startTime);
    const endDate = timeService.parseServerTime(record.endTime);
    const durationResult = startDate && endDate ? timeService.calculateDuration(startDate, endDate) : null;

    const result = durationResult ? {
      duration: durationResult.display,
      isInvalid: !durationResult.isValid,
      isOvertime: durationResult.isOvertime,
      hours: Math.floor(durationResult.minutes / 60)
    } : {
      duration: '--:--',
      isInvalid: true,
      isOvertime: false,
      hours: 0
    };
    return {
      duration: result.duration,
      isOvertime: result.isOvertime,
      isInvalid: result.isInvalid,
      hours: result.hours
    };
  }, [record.startTime, record.endTime]);

  // 根据状态确定显示信息
  const statusInfo = useMemo(() => {
    // 如果有status字段，优先使用status
    if (record.status !== undefined) {
      switch (record.status) {
        case -1:
          return {
            label: t('wellbeing.volunteer.history.status.pending'),
            color: '#FF9500', // 橙色 - 待审核
            backgroundColor: '#FF950020',
            icon: 'time-outline'
          };
        case 1:
          return {
            label: t('wellbeing.volunteer.history.status.approved'),
            color: theme.colors.success,
            backgroundColor: theme.colors.success + '20',
            icon: 'checkmark-circle-outline'
          };
        case 2:
          return {
            label: t('wellbeing.volunteer.history.status.rejected'),
            color: '#FF3B30', // 红色 - 已拒绝
            backgroundColor: '#FF3B3020',
            icon: 'close-circle-outline'
          };
        default:
          return {
            label: t('wellbeing.volunteer.history.status.unknown'),
            color: '#8E8E93',
            backgroundColor: '#8E8E9320',
            icon: 'help-circle-outline'
          };
      }
    }

    // 兼容旧数据：根据是否有endTime判断
    const isCompleted = record.endTime !== null;
    if (isCompleted) {
      // 有endTime但没有status，默认为待审核状态
      return {
        label: t('wellbeing.volunteer.history.status.pending'),
        color: '#FF9500',
        backgroundColor: '#FF950020',
        icon: 'time-outline'
      };
    } else {
      return {
        label: t('wellbeing.volunteer.history.inProgress'),
        color: theme.colors.warning,
        backgroundColor: theme.colors.warning + '20',
        icon: 'play-circle-outline'
      };
    }
  }, [record.status, record.endTime, theme.colors, t]);

  return (
    <View style={[
      styles.recordItem,
      { backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff' }
    ]}>
      {/* 日期头部 */}
      <View style={styles.recordHeader}>
        <View style={styles.dateInfo}>
          <Ionicons 
            name="calendar-outline" 
            size={16} 
            color={theme.colors.text.secondary} 
          />
          <SafeText style={[styles.recordDate, { color: theme.colors.text.primary }]} fallback="日期未知">
            {new Date(record.startTime).toLocaleDateString(
              i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
              month: '2-digit',
              day: '2-digit',
              weekday: 'short'
            })}
          </SafeText>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          
          {/* 超时警告标注 */}
          {durationInfo?.isOvertime && (
            <View style={[styles.warningBadge, { backgroundColor: '#FBA6A6' }]}>
              <Ionicons name="warning-outline" size={12} color="#DC2626" />
              <Text style={[styles.warningText, { color: '#DC2626' }]}>
                {t('wellbeing.volunteer.history.overtime.abnormal')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 时间信息 */}
      <View style={styles.timeInfo}>
        <View style={styles.timeRow}>
          <Ionicons name="log-in-outline" size={14} color={theme.colors.success} />
          <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
            {t('wellbeing.volunteer.history.checkInTime')}
          </Text>
          <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="--:--">
            {timeService.formatForDisplay(timeService.parseServerTime(record.startTime), { showDate: true, showTime: true }) || '--:--'}
          </SafeText>
        </View>

        {record.endTime && (
          <View style={styles.timeRow}>
            <Ionicons name="log-out-outline" size={14} color={theme.colors.primary} />
            <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
              {t('wellbeing.volunteer.history.checkOutTime')}
            </Text>
            <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="--:--">
              {timeService.formatForDisplay(timeService.parseServerTime(record.endTime), { showDate: true, showTime: true }) || '--:--'}
            </SafeText>
          </View>
        )}

        {record.endTime && durationInfo && !durationInfo?.isInvalid && (
          <View style={styles.durationRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={durationInfo.isInvalid ? '#DC2626' : (durationInfo.isOvertime ? '#DC2626' : theme.colors.warning)}
            />
            <Text style={[styles.durationLabel, { color: theme.colors.text.secondary }]}>
              {t('wellbeing.volunteer.history.workDuration')}
            </Text>
            <View style={styles.durationValueContainer}>
              <Text style={[
                styles.durationValue,
                {
                  color: durationInfo.isInvalid ? '#DC2626' : (durationInfo.isOvertime ? '#DC2626' : theme.colors.primary),
                  fontWeight: '600'
                }
              ]}>
                {durationInfo.duration}
              </Text>
              {durationInfo.isOvertime && (
                <View style={styles.overtimeWarning}>
                  <Ionicons name="warning" size={12} color="#DC2626" />
                  <Text style={[styles.overtimeText, { color: '#DC2626' }]}>
                    {t('wellbeing.volunteer.history.overtime.warning')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 详情展开按钮 - 只有当有remark内容时才显示 */}
      {record.remark && (
        <View style={styles.detailSection}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-forward"}
              size={16}
              color={theme.colors.text.secondary}
            />
            <Text style={[styles.detailButtonText, { color: theme.colors.text.secondary }]}>
              {t('wellbeing.volunteer.history.detail', '详情')}
            </Text>
          </TouchableOpacity>

          {/* 工作描述展开内容 */}
          {isExpanded && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionLabel, { color: theme.colors.text.secondary }]}>
                {t('wellbeing.volunteer.history.workDescription', '工作描述')}:
              </Text>
              <Text style={[styles.descriptionText, { color: theme.colors.text.primary }]}>
                {record.remark || t('wellbeing.volunteer.history.noDescription', '暂无描述')}
              </Text>
            </View>
          )}
        </View>
      )}

    </View>
  );
}, (prevProps, nextProps) => {
  // memo比较函数 - 性能优化
  return prevProps.record.id === nextProps.record.id && 
         prevProps.isDarkMode === nextProps.isDarkMode;
});

interface VolunteerHistoryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  userPermission: 'manage' | 'part_manage' | 'staff';
  currentUser?: any; // 当前操作用户信息，用于权限验证
  isPersonalView?: boolean; // 新增：是否为个人查看模式（从Profile进入）
}

export const VolunteerHistoryBottomSheet: React.FC<VolunteerHistoryBottomSheetProps> = ({
  visible,
  onClose,
  userId,
  userName,
  userPermission,
  currentUser,
  isPersonalView = false, // 默认为管理员查看模式
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const volunteerContext = useVolunteerContext();
  
  // 性能优化 - 使用分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);

  // 状态管理
  const [selectedDays, setSelectedDays] = useState<1 | 3 | 7 | 30>(7);
  const [records, setRecords] = useState<VolunteerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Refs - 内存管理
  const loadingRef = useRef(false);

  // 加载历史记录 - 使用useCallback优化
  const loadHistoryRecords = useCallback(async (days: 1 | 3 | 7 | 30) => {
    if (loadingRef.current) return; // 防止重复调用

    try {
      loadingRef.current = true;
      setLoading(true);
      setError('');
      console.log(`🔍 [HISTORY-LOAD] 开始加载${userName}的${days}天历史记录`);
      const result = await getVolunteerHistoryRecords(userId, days, userPermission);

      if (result.code === 200 && result.rows) {
        setRecords(result.rows || []);
        console.log(`✅ [HISTORY-LOAD] 成功加载${result.rows?.length || 0}条记录`);
      } else {
        console.error('❌ [HISTORY-LOAD] 加载失败:', result.msg);
        setError(result.msg || t('wellbeing.volunteer.history.loadError'));
      }
    } catch (error) {
      console.error('❌ [HISTORY-LOAD] 网络错误:', error);
      setError(t('common.network_error'));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId, userName, userPermission, t]);

  // 监听VolunteerContext状态变化，自动刷新历史记录
  useEffect(() => {
    if (visible && volunteerContext.currentStatus === 'signed_out') {
      console.log('🔄 [HISTORY-CONTEXT] 检测到签退状态，刷新历史记录');
      // 延迟刷新确保后端数据已更新
      setTimeout(() => {
        if (visible && !loadingRef.current) {
          loadHistoryRecords(selectedDays);
        }
      }, 1000);
    }
  }, [volunteerContext.currentStatus, visible, selectedDays, loadHistoryRecords]);

  // 根据权限确定可用的时间范围选项 - 使用useMemo缓存
  const timeRangeOptions = useMemo((): TimeRangeOption[] => {
    const baseOptions: TimeRangeOption[] = [
      { days: 1, label: t('wellbeing.volunteer.history.timeRange.1day'), key: '1d' },
      { days: 3, label: t('wellbeing.volunteer.history.timeRange.3days'), key: '3d' },
      { days: 7, label: t('wellbeing.volunteer.history.timeRange.7days'), key: '7d' },
    ];

    // 总管理员可以查询30天
    if (userPermission === 'manage') {
      baseOptions.push({ 
        days: 30, 
        label: t('wellbeing.volunteer.history.timeRange.30days'), 
        key: '30d' 
      });
    }

    return baseOptions;
  }, [userPermission, t]);

  // Modal动画值
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;


  // 时间范围选择处理 - 使用useCallback优化
  const handleTimeRangeSelect = useCallback((days: 1 | 3 | 7 | 30) => {
    setSelectedDays(days);
    loadHistoryRecords(days);
  }, [loadHistoryRecords]);

  // Modal动画处理
  const showModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hideModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalTranslateY, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  // Modal显示/隐藏动画 - 只依赖visible
  useEffect(() => {
    if (visible) {
      // 重置动画值
      modalOpacity.setValue(0);
      modalTranslateY.setValue(screenHeight);
      // 延迟显示动画，确保Modal已渲染
      setTimeout(() => {
        showModal();
      }, 50);
    }
  }, [visible, showModal]);

  // 首次显示时加载初始数据 - 分离逻辑
  useEffect(() => {
    if (visible) {
      // 延迟加载，确保动画完成后再加载数据
      setTimeout(() => {
        loadHistoryRecords(selectedDays);
      }, 100);
    }
  }, [visible]); // 只在首次显示时加载

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      loadingRef.current = false;
      setRecords([]);
      setError('');
    };
  }, []);

  // 渲染记录列表项 - 使用useCallback优化
  const renderRecord = useCallback(({ item }: { item: VolunteerRecord }) => (
    <HistoryRecordItem record={item} isDarkMode={isDarkMode} />
  ), [isDarkMode]);

  // 列表项分隔符 - 使用useCallback缓存
  const ItemSeparator = useCallback(() => <View style={{ height: 8 }} />, []);

  // 渲染空状态
  const renderEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="document-outline" 
        size={48} 
        color={isDarkMode ? '#8e8e93' : '#8e8e93'} 
      />
      <Text style={[styles.emptyText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
        {error || t('wellbeing.volunteer.history.noRecords')}
      </Text>
    </View>
  ), [error, isDarkMode, t]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={hideModal}
    >
      {/* 背景遮罩 */}
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: modalOpacity }
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={hideModal}
        />
      </Animated.View>

      {/* Modal内容 */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: isDarkMode ? '#000000' : '#f2f2f7',
            transform: [{ translateY: modalTranslateY }]
          }
        ]}
      >
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {t('wellbeing.volunteer.history.title')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {isPersonalView 
              ? t('wellbeing.volunteer.history.subtitle_personal') 
              : t('wellbeing.volunteer.history.subtitle', { userName })
            }
          </Text>
        </View>

        {/* 时间范围选择器 */}
        <View style={styles.timeRangeContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            {t('wellbeing.volunteer.history.selectTimeRange')}
          </Text>
          
          <View style={styles.timeRangeSelector}>
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.timeRangeButton,
                  selectedDays === option.days && styles.timeRangeButtonSelected,
                  {
                    backgroundColor: selectedDays === option.days 
                      ? theme.colors.primary 
                      : (isDarkMode ? '#1c1c1e' : '#ffffff')
                  }
                ]}
                onPress={() => handleTimeRangeSelect(option.days)}
                disabled={loading}
              >
                <Text style={[
                  styles.timeRangeText,
                  {
                    color: selectedDays === option.days 
                      ? '#ffffff'
                      : (isDarkMode ? '#ffffff' : '#000000')
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 记录列表 */}
        <View style={styles.recordsContainer}>
          <View style={styles.recordsHeader}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {t('wellbeing.volunteer.history.recordsList')}
            </Text>
            {!loading && records.length > 0 && (
              <Text style={[styles.recordsCount, { color: theme.colors.text.secondary }]}>
                {t('wellbeing.volunteer.history.recordsFound', { count: records.length })}
              </Text>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                {t('wellbeing.volunteer.history.loading')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={records}
              renderItem={renderRecord}
              keyExtractor={(item) => `${item.id}-${item.startTime}`}
              ItemSeparatorComponent={ItemSeparator}
              ListEmptyComponent={renderEmptyComponent}
              style={styles.recordsList}
              contentContainerStyle={styles.recordsListContent}
              // 性能优化配置
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              initialNumToRender={8}
              windowSize={10}
              getItemLayout={(_, index) => ({
                length: 120, // 估算的记录项高度
                offset: 128 * index, // 包含间隔的总高度
                index,
              })}
            />
          )}
        </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal样式
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.75, // 75%屏幕高度
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Header样式
  header: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16, // 提升至交互文字16pt
    marginLeft: 32,
  },
  
  // 时间范围选择器
  timeRangeContainer: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
  },
  timeRangeButtonSelected: {
    borderColor: theme.colors.primary,
  },
  timeRangeText: {
    fontSize: 16, // 提升至交互文字16pt
    fontWeight: '500',
  },
  
  // 记录列表
  recordsContainer: {
    flex: 1,
    paddingTop: 16,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordsCount: {
    fontSize: 14, // 提升至辅助信息最小14pt
  },
  recordsList: {
    flex: 1,
  },
  recordsListContent: {
    paddingBottom: 20,
  },
  
  // 记录项样式
  recordItem: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 16, // 提升至交互文字16pt
    fontWeight: '600',
    marginLeft: 6,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 13, // 提升至辅助信息最小13pt
    fontWeight: '600',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12, // 提升至徽标最小12pt
    fontWeight: '600',
    marginLeft: 2,
  },
  
  // 时间信息
  timeInfo: {
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  timeLabel: {
    fontSize: 14, // 辅助信息最小14pt
    marginLeft: 6,
    flex: 1,
  },
  timeValue: {
    fontSize: 14, // 辅助信息最小14pt
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  durationLabel: {
    fontSize: 16, // 提升至交互文字16pt（重要标签）
    marginLeft: 6,
    flex: 1,
  },
  durationValueContainer: {
    alignItems: 'flex-end',
  },
  durationValue: {
    fontSize: 16, // 提升至交互文字16pt（重要数值）
  },
  overtimeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  overtimeText: {
    fontSize: 12, // 提升至徽标最小12pt
    fontWeight: '500',
    marginLeft: 2,
  },
  
  // 详情展开区域
  detailSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailButtonText: {
    fontSize: 16, // 交互文字16pt
    marginLeft: 4,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14, // 辅助信息14pt
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14, // 辅助信息14pt
    lineHeight: 20,
  },
  
  // 状态样式
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16, // 提升至交互文字16pt
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16, // 提升至交互文字16pt
    textAlign: 'center',
    marginTop: 8,
  },
});

export default VolunteerHistoryBottomSheet;