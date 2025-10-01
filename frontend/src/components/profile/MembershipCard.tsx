import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface MembershipCardProps {
  userName: string;
  membershipLevel: 'Free' | 'Silver' | 'Gold' | 'Platinum';
  currentValue: number; // 当前志愿者工时
  targetValue: number; // 升级目标工时
  onQRCodePress?: () => void;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  userName,
  membershipLevel,
  currentValue,
  targetValue,
  onQRCodePress,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;

  // 计算进度百分比
  const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
  const progressCapped = Math.min(progress, 100);

  // 会员等级颜色映射
  const levelColors = {
    Free: '#6B7280',
    Silver: '#9CA3AF',
    Gold: '#F59E0B',
    Platinum: '#8B5CF6',
  };

  // 判断是否为访客
  const isGuest = userName === t('userInfo.guest') || currentValue === 0;

  const handleQRCodePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onQRCodePress?.();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#2C2C2E', '#1C1C1E'] : ['#E5E7EB', '#D1D5DB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {/* 顶部行：用户名 + 等级 + QR码 */}
        <View style={styles.headerRow}>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {userName}
            </Text>
            <Text style={[styles.memberLevel, { color: levelColors[membershipLevel] }]}>
              {membershipLevel}
            </Text>
          </View>

          {/* QR码按钮 / 登录按钮 */}
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleQRCodePress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isGuest ? t('auth.login.login', 'Login') : t('profile.qr_code', 'QR Code')}
          >
            <Ionicons
              name={isGuest ? 'log-in-outline' : 'qr-code-outline'}
              size={28}
              color={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        {/* Level Progress区域 */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressLabel, { color: isDarkMode ? '#D1D5DB' : '#4B5563' }]}>
            {t('profile.level_progress', 'Level Progress')}
          </Text>

          {/* 进度条 */}
          <View style={[styles.progressBarBackground, { backgroundColor: isDarkMode ? '#3C3C3E' : '#9CA3AF' }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressCapped}%`,
                  backgroundColor: levelColors[membershipLevel],
                },
              ]}
            />
          </View>

          {/* 底部：当前值 vs 目标值 */}
          <View style={styles.progressValues}>
            <View style={styles.valueItem}>
              <Text style={[styles.valueNumber, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {currentValue}h
              </Text>
              <Text style={[styles.valueLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                {t('profile.volunteer_hours_label', 'Volunteer Hours')}
              </Text>
            </View>

            <View style={[styles.valueItem, { alignItems: 'flex-end' }]}>
              <Text style={[styles.valueNumber, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                {targetValue}h
              </Text>
              <Text style={[styles.valueLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                {t('profile.to_next_level', 'To Next Level')}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  gradientCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberLevel: {
    fontSize: 16,
    fontWeight: '500',
  },
  qrButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressSection: {
    gap: 12,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  valueItem: {
    flex: 1,
  },
  valueNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
});

export default MembershipCard;
