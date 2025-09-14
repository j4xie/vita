import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '../../../../utils/LightweightIcons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';

import { theme } from '../../../theme';
import { useTheme } from '../../../context/ThemeContext';
import { VolunteerRecord } from './VolunteerCard';
import { SafeText } from '../../../components/common/SafeText';

interface SignOutBottomSheetProps {
  visible: boolean;
  volunteer: VolunteerRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

export const SignOutBottomSheet: React.FC<SignOutBottomSheetProps> = ({
  visible,
  volunteer,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const insets = useSafeAreaInsets();
  
  // 动画值
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  // 计算签出信息
  const getSignOutInfo = () => {
    if (!volunteer?.checkInTime) {
      return { duration: '', timeRange: '' };
    }

    const checkInTime = new Date(volunteer.checkInTime);
    const checkOutTime = new Date();
    const diffMinutes = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      duration: `${hours} ${t('wellbeing.volunteer.hours')} ${minutes} ${t('wellbeing.volunteer.minutes')}`,
      timeRange: `${formatTime(checkInTime)} - ${formatTime(checkOutTime)}`,
      hours,
      minutes,
    };
  };

  // 显示/隐藏动画
  useEffect(() => {
    if (visible) {
      // 显示动画
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 隐藏动画
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // 处理背景点击
  const handleBackdropPress = () => {
    if (!loading) {
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
      onCancel();
    }
  };

  // 处理确认按钮
  const handleConfirm = () => {
    if (!loading) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onConfirm();
    }
  };

  // 处理取消按钮
  const handleCancel = () => {
    if (!loading) {
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      }
      onCancel();
    }
  };

  if (!volunteer) return null;

  const signOutInfo = getSignOutInfo();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      {/* 背景遮罩 */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* 底部弹层 */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* 拖拽指示器 */}
        <View style={styles.dragIndicator}>
          <View
            style={[
              styles.dragBar,
              { backgroundColor: isDarkMode ? '#48484a' : '#c6c6c8' },
            ]}
          />
        </View>

        {/* 标题 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            {t('wellbeing.volunteer.confirmSignOut')}
          </Text>
        </View>

        {/* 用户信息 */}
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <SafeText style={[styles.userName, { color: isDarkMode ? '#ffffff' : '#000000' }]} fallback="志愿者">
                {volunteer.name}
              </SafeText>
              <SafeText style={[styles.userPhone, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]} fallback="无手机号">
                {volunteer.phone}
              </SafeText>
            </View>
          </View>

          {/* 时间信息 */}
          <View style={styles.timeInfo}>
            <View style={styles.timeCard}>
              <View style={styles.timeHeader}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.timeTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  {t('wellbeing.volunteer.thisVolunteerService')}
                </Text>
              </View>
              
              <View style={styles.timeDetails}>
                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
                    {t('wellbeing.volunteer.timeRange')}
                  </Text>
                  <SafeText style={[styles.timeValue, { color: isDarkMode ? '#ffffff' : '#000000' }]} fallback="--:-- - --:--">
                    {signOutInfo.timeRange}
                  </SafeText>
                </View>
                
                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
                    {t('wellbeing.volunteer.serviceDuration')}
                  </Text>
                  <SafeText style={[styles.durationValue, { color: theme.colors.primary }]} fallback="0小时0分钟">
                    {signOutInfo.duration}
                  </SafeText>
                </View>
              </View>
            </View>
          </View>

          {/* 提示信息 */}
          <View style={styles.tipContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={isDarkMode ? '#8e8e93' : '#8e8e93'}
            />
            <Text style={[styles.tipText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
              {t('wellbeing.volunteer.signOutNote')}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              { backgroundColor: isDarkMode ? '#48484a' : '#f2f2f7' },
            ]}
            onPress={handleCancel}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('wellbeing.volunteer.cancelSignOut')}
          >
            <Text style={[styles.cancelButtonText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${t('wellbeing.volunteer.confirmSignOut')} ${volunteer.name}`}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="sync" size={16} color="white" />
                <Text style={styles.confirmButtonText}>{t('wellbeing.volunteer.signingOut')}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.confirmButtonText}>{t('wellbeing.volunteer.confirmSignOut')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  dragIndicator: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 15,
  },
  timeInfo: {
    marginBottom: 16,
  },
  timeCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: theme.colors.primary + '08',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timeDetails: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 15,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 12,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 52,
  },
  cancelButton: {
    // backgroundColor set in component
  },
  confirmButton: {
    // backgroundColor set in component
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SignOutBottomSheet;