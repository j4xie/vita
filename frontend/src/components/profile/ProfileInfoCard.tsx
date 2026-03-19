import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScanIcon, EditIcon } from '../icons/ProfileIcons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useMembershipLevel } from '../../hooks/useMembershipLevel';
import { getUserPoints } from '../../services/orderAPI';

// Card color themes by membership level
const CARD_THEMES: Record<number, { colors: [string, string]; labelKey: string }> = {
  4: { colors: ['#A4CFDF', '#69A6CD'], labelKey: 'rewards.mall.membership.card_level.blue' },
  5: { colors: ['#E8A0A0', '#D46B6B'], labelKey: 'rewards.mall.membership.card_level.red' },
  6: { colors: ['#C47070', '#5C2020'], labelKey: 'rewards.mall.membership.card_level.red_black' },
  7: { colors: ['#3A3A3A', '#1A1A1A'], labelKey: 'rewards.mall.membership.card_level.black' },
};
const DEFAULT_THEME = { colors: ['#A4CFDF', '#69A6CD'] as [string, string], labelKey: 'rewards.mall.membership.card_level.blue' };

// Points thresholds per level for the progress bar
const LEVEL_THRESHOLDS: Record<number, number> = {
  4: 3000,  // Blue → next level
  5: 5000,  // Red → next level
  6: 10000, // Red Black → next level
  7: 10000, // Black (max)
};

interface ProfileInfoCardProps {
  userName: string;
  school?: string;
  position?: string;
  avatarUrl?: string;
  onEditPress: () => void;
  onQRCodePress: () => void;
  onCardPress?: () => void;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  userName,
  school,
  position,
  avatarUrl,
  onEditPress,
  onQRCodePress,
  onCardPress,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;

  const { user, isAuthenticated } = useUser();
  const { membershipLevel } = useMembershipLevel();
  const [points, setPoints] = useState(0);
  const [emailVerifiedLocal, setEmailVerifiedLocal] = useState(false);
  const isEmailVerified = (user as any)?.isEmailVerify === true || emailVerifiedLocal;

  // 每次页面聚焦时检查本地邮箱验证标记
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('@email_verified_local').then((val) => {
        if (val === 'true') setEmailVerifiedLocal(true);
      });
    }, [])
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    getUserPoints().then(setPoints).catch(() => {});
  }, [isAuthenticated]);

  const levelId = membershipLevel?.sysUserLevel?.id || 4;
  const cardTheme = CARD_THEMES[levelId] || DEFAULT_THEME;
  const levelName = membershipLevel?.sysUserLevel?.levelName;
  const threshold = LEVEL_THRESHOLDS[levelId] || 3000;
  const progress = Math.min(points / threshold, 1);

  const handleEditPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onEditPress();
  };

  const handleQRCodePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onQRCodePress();
  };

  const firstChar = userName?.charAt(0) || '?';

  // Format points: 1500 → "1,500"
  const formatPoints = (n: number) => n.toLocaleString();

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={cardTheme.colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        {/* Top section: avatar + name + icons */}
        <View style={styles.topSection}>
          {/* Avatar + Name + Pills */}
          <View style={styles.leftGroup}>
            {/* Avatar */}
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{firstChar}</Text>
              )}
            </View>

            {/* Name + Role pills */}
            <View style={styles.nameBlock}>
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
              <View style={styles.pillRow}>
                {school ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText} numberOfLines={1}>{school}</Text>
                  </View>
                ) : null}
                {position ? (
                  <View style={styles.pill}>
                    <Text style={styles.pillText} numberOfLines={1}>{position}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* QR + Edit icons */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              onPress={handleQRCodePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ScanIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <EditIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom section: Card label + progress bar, or email verification prompt */}
        {isEmailVerified ? (
          <TouchableOpacity
            style={styles.bottomSection}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onCardPress?.();
            }}
            disabled={!onCardPress}
          >
            <View style={styles.progressLabelRow}>
              <Text style={styles.blueCardLabel}>{t(cardTheme.labelKey)}</Text>
              <View style={styles.progressRight}>
                <Text style={styles.progressText}>
                  {formatPoints(points)}/{formatPoints(threshold)}
                </Text>
                {onCardPress && (
                  <View style={styles.arrowCircle}>
                    <Ionicons name="chevron-forward" size={14} color="#FFFFFF" style={{ marginLeft: 1 }} />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={levelId >= 6
                  ? ['#8B0000', '#C44040', '#E8A0A0', '#FFFFFF']
                  : ['#2D80C4', '#2F7FC0', '#A8D8FF', '#FFFFFF']}
                locations={[0, 0.557, 0.84, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.progressFill, { width: `${Math.max(progress * 100, 2)}%` }]}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.verifyPrompt}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onCardPress?.();
            }}
          >
            <Ionicons name="mail-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.verifyPromptText}>
              {t('profile.verify_email_for_membership', { defaultValue: '验证学校邮箱，免费获取蓝卡会员' })}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 31,
    paddingHorizontal: 15,
    paddingTop: 13.5,
    paddingBottom: 16,
    minHeight: 139,
    justifyContent: 'space-between',
  },

  // Top section
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 11,
    marginRight: 8,
  },

  // Avatar
  avatarCircle: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
  },
  avatarText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 25,
    color: '#000000',
    lineHeight: 38,
  },

  // Name + Pills
  nameBlock: {
    flex: 1,
    gap: 3,
    justifyContent: 'flex-end',
  },
  userName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 30,
    color: '#FFFFFF',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 54,
    paddingHorizontal: 8,
    height: 23,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '70%',
  },
  pillText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: '#FFFFFF',
  },

  // Icons
  iconRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 0.5,
    flexShrink: 0,
  },

  // Bottom section
  bottomSection: {
    gap: 6,
    paddingHorizontal: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blueCardLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  progressRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 13,
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(21, 38, 70, 0.8)',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 100,
  },
  verifyPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  verifyPromptText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
});

export default ProfileInfoCard;
