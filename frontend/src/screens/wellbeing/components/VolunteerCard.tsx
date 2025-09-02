import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { theme } from '../../../theme';
import { useTheme } from '../../../context/ThemeContext';
// 🎉 JSC引擎下恢复完整的主题和性能系统
import { LIQUID_GLASS_LAYERS, BRAND_GLASS, BRAND_INTERACTIONS } from '../../../theme/core';
import { usePerformanceDegradation } from '../../../hooks/usePerformanceDegradation';
import { formatTime, formatDuration, formatHours } from '../utils/timeFormatter';
import { i18n } from '../../../utils/i18n';
import { SafeText } from '../../../components/common/SafeText';
// mockSchools removed - using real school data

// 扩展API的VolunteerRecord以包含UI需要的字段
export interface VolunteerRecord {
  id: string;
  phone: string;
  name: string;
  school: string;
  userId?: number; // API字段
  legalName?: string; // API字段
  checkInTime?: string;
  checkOutTime?: string;
  startTime?: string; // API字段
  endTime?: string | null; // API字段
  status: 'not_checked_in' | 'checked_in';
  duration?: number; // 分钟
  totalHours?: number; // 总志愿时长（小时）
  lastCheckInTime?: string; // 上次签到时间
  lastCheckOutTime?: string; // 上次签出时间
}

interface VolunteerCardProps {
  volunteer: VolunteerRecord;
  isExpanded: boolean;
  onPress: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  currentTime: Date;
  loading?: boolean;
}

const COLLAPSED_HEIGHT = 88; // 收起状态高度
const EXPANDED_HEIGHT = 400; // 展开状态高度 - 从410px再减少到400px，再缩短10px
const ANIMATION_DURATION = 200; // 动画时长

export const VolunteerCard: React.FC<VolunteerCardProps> = ({
  volunteer,
  isExpanded,
  onPress,
  onCheckIn,
  onCheckOut,
  currentTime,
  loading = false,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  
  // 🎉 JSC引擎下恢复性能监控和分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  // 🕒 实时计时器状态
  const [currentWorkDuration, setCurrentWorkDuration] = useState<string>('');
  
  // 🕒 实时计时器 - 为已签到用户显示工作时长
  useEffect(() => {
    if ((volunteer as any).checkInStatus === 'checked_in' && volunteer.checkInTime) {
      const updateDuration = () => {
        try {
          const checkInTime = new Date(volunteer.checkInTime!);
          const now = new Date();
          const diffMs = now.getTime() - checkInTime.getTime();
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
            setCurrentWorkDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          } else {
            setCurrentWorkDuration('00:00:00');
          }
        } catch (error) {
          console.warn('实时计时器计算错误:', error);
          setCurrentWorkDuration('--:--:--');
        }
      };
      
      // 立即更新一次
      updateDuration();
      
      // 每秒更新
      const timer = setInterval(updateDuration, 1000);
      
      return () => clearInterval(timer);
    } else {
      setCurrentWorkDuration('');
    }
  }, [(volunteer as any).checkInStatus, volunteer.checkInTime]);
  
  // 获取本地化学校名称
  const getLocalizedSchoolName = (schoolName: string) => {
    // mockSchools removed - return schoolName as-is
    return schoolName;
  };
  
  // 🎉 JSC引擎下恢复完整动画
  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Reduce Motion检测
  const [reduceMotionEnabled, setReduceMotionEnabled] = React.useState(false);
  
  React.useEffect(() => {
    const checkReduceMotion = async () => {
      const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotionEnabled(isEnabled);
    };
    checkReduceMotion();
  }, []);

  // 🎉 JSC引擎下恢复展开/收起动画
  useEffect(() => {
    const duration = reduceMotionEnabled ? 120 : ANIMATION_DURATION;
    
    if (isExpanded) {
      // 展开动画
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: EXPANDED_HEIGHT,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration + 50, // 延迟一点显示内容
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 收起动画
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: duration - 50, // 提前隐藏内容
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue: COLLAPSED_HEIGHT,
          duration,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isExpanded, reduceMotionEnabled]);

  // 处理卡片点击
  const handleCardPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  // 处理操作按钮点击
  const handleActionPress = (action: 'checkIn' | 'checkOut') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (action === 'checkIn') {
      onCheckIn();
    } else {
      onCheckOut();
    }
  };

  // 获取状态相关样式
  const getStatusInfo = () => {
    switch (volunteer.status) {
      case 'checked_in':
        return {
          color: theme.colors.success,
          text: t('volunteerCheckIn.status.working'),
          bgColor: theme.colors.success,
        };
      default: // 'not_checked_in'
        return {
          color: theme.colors.text.tertiary,
          text: t('volunteerCheckIn.status.waiting'),
          bgColor: theme.colors.background.secondary,
        };
    }
  };

  // 计算工作时长
  const getCurrentDuration = () => {
    if (!volunteer.checkInTime) return '';
    
    const start = new Date(volunteer.checkInTime);
    const now = currentTime;
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    
    return formatDuration(diff);
  };

  const statusInfo = getStatusInfo();

  // 渲染主按钮
  const renderActionButton = () => {
    const isCheckIn = volunteer.status === 'not_checked_in';
    const buttonColor = isCheckIn ? theme.colors.primary : theme.colors.warning;
    const buttonText = isCheckIn ? t('volunteerCheckIn.checkIn') : t('volunteerCheckIn.checkOut');
    const iconName = isCheckIn ? 'log-in-outline' : 'log-out-outline';

    return (
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: buttonColor }]}
        onPress={() => handleActionPress(isCheckIn ? 'checkIn' : 'checkOut')}
        disabled={loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={buttonText}
      >
        <Ionicons name={iconName as any} size={20} color="white" />
        <Text style={styles.actionButtonText}>
          {loading ? t('common.loading') : buttonText}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <TouchableOpacity
        style={[
          styles.card,
          styles.cardGlass, // 🎉 恢复玻璃效果（JSC引擎下安全）
          isExpanded && styles.cardExpanded,
        ]}
        onPress={handleCardPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${volunteer.name}, ${statusInfo.text}`}
        accessibilityHint={isExpanded ? t('accessibility.collapseDetails') : t('accessibility.expandDetails')}
        accessibilityState={{ expanded: isExpanded }}
      >
        {/* 基础信息行 - 始终显示 */}
        <View style={styles.baseRow}>
          <View style={styles.leftColumn}>
            <SafeText style={[styles.name, { color: isDarkMode ? theme.colors.text.primary : theme.colors.text.primary }]} fallback="志愿者">
              {volunteer.name}
            </SafeText>
            <SafeText style={[styles.phone, { color: theme.colors.text.secondary }]} fallback="无手机号">
              {volunteer.phone}
            </SafeText>
            <SafeText style={[styles.school, { color: theme.colors.text.secondary }]} fallback="学校信息">
              {getLocalizedSchoolName(volunteer.school)}
            </SafeText>
          </View>
          
          <View style={styles.rightColumn}>
            {/* 状态胶囊 */}
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <SafeText style={[
                styles.statusText,
                { color: volunteer.status === 'checked_in' ? 'white' : statusInfo.color }
              ]} fallback="状态未知">
                {statusInfo.text}
              </SafeText>
            </View>
            
            {/* 时间信息预览 */}
            {volunteer.checkInTime && (
              <SafeText style={[styles.timePreview, { color: theme.colors.text.secondary }]} fallback="--:--">
                {formatTime(volunteer.checkInTime)}
              </SafeText>
            )}
          </View>
        </View>

        {/* 展开内容 - 仅在展开时显示 */}
        <Animated.View style={[styles.expandedContent, { opacity: opacityAnim }]}>
          {/* 时间详情 */}
          <View style={styles.timeDetails}>
            {volunteer.checkInTime && (
              <View style={styles.timeRow}>
                <Ionicons name="log-in-outline" size={16} color={theme.colors.success} />
                <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                  {t('wellbeing.volunteer.checkInTime')}
                </Text>
                <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="--:--">
                  {formatTime(volunteer.checkInTime)}
                </SafeText>
              </View>
            )}
            
            {(volunteer as any).checkInStatus === 'checked_in' && volunteer.checkInTime && (
              <View style={styles.timeRow}>
                <Ionicons name="timer-outline" size={16} color={theme.colors.warning} />
                <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                  {t('wellbeing.volunteer.currentWorkDuration')}
                </Text>
                <SafeText style={[styles.timeValue, { color: theme.colors.primary, fontWeight: 'bold' }]} fallback="00:00:00">
                  {currentWorkDuration || '00:00:00'}
                </SafeText>
              </View>
            )}
            
            {/* 上次签到时间 */}
            {volunteer.lastCheckInTime && (
              <View style={styles.timeRow}>
                <Ionicons name="log-in" size={16} color={theme.colors.primary} />
                <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                  {t('wellbeing.volunteer.lastCheckInTime')}
                </Text>
                <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="--:--">
                  {formatTime(volunteer.lastCheckInTime)}
                </SafeText>
              </View>
            )}
            
            {/* 上次签出时间 */}
            {volunteer.lastCheckOutTime && (
              <View style={styles.timeRow}>
                <Ionicons name="log-out" size={16} color={theme.colors.secondary} />
                <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                  {t('wellbeing.volunteer.lastCheckOutTime')}
                </Text>
                <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="--:--">
                  {formatTime(volunteer.lastCheckOutTime)}
                </SafeText>
              </View>
            )}
            
            <View style={styles.timeRow}>
              <Ionicons name="trophy-outline" size={16} color={theme.colors.warning} />
              <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                {t('wellbeing.volunteer.totalHours')}
              </Text>
              <SafeText style={[styles.timeValue, { color: theme.colors.text.primary }]} fallback="0小时">
                {Math.max(0, volunteer.totalHours || 0).toFixed(1)} {t('wellbeing.volunteer.hours_unit')}
              </SafeText>
            </View>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionContainer}>
            {renderActionButton()}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12, // 从2px增加到12px，增加每个卡片间距10px
    borderRadius: 16, // 将圆角移到容器级别
    overflow: 'hidden', // 确保内容被裁剪成圆角
  },
  card: {
    borderRadius: 16, // 保留卡片圆角
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden', // 确保内部内容也被裁剪
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardExpanded: {
    borderColor: theme.colors.primary + '20',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  
  // 基础信息行
  baseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    marginRight: 16,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    marginBottom: 2,
  },
  school: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timePreview: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // 展开内容
  expandedContent: {
    marginTop: 16,
    marginBottom: 2, // 从12px减少到2px，缩短10px间距
  },
  timeDetails: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0, // 保持0
    marginVertical: -4.75, // 从-2.25px减少到-4.75px，再减少2.5px间距
    minHeight: 44, // 确保触达区域
  },
  timeLabel: {
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  
  // 操作按钮
  actionContainer: {
    marginTop: -1.5, // 从8.5px减少到-1.5px，再向上提高10px
    marginBottom: -4, // 从6px减少到-4px，配合卡片高度再减少10px
    paddingHorizontal: 8, // 添加水平内边距
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12, // 按钮内部使用12px圆角
    minHeight: 52, // 确保触达区域
    overflow: 'hidden', // 确保按钮内容不溢出
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  
  // 🎉 JSC引擎下恢复完整的玻璃效果
  cardGlass: {
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card, // 16pt圆角
    ...theme.shadows[LIQUID_GLASS_LAYERS.L1.shadow],
  },
});

export default VolunteerCard;