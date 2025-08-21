import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
  useColorScheme,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';

interface PersonalInfoCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onPress: () => void;
  testID?: string;
  // 精简统计数据 - 仅2项
  stats?: {
    volunteerHours: number; 
    points: number;
  };
  membershipStatus?: 'free' | 'vip' | 'premium';
  // 新增主CTA
  onQRCodePress?: () => void;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  name,
  email,
  avatarUrl,
  onPress,
  testID,
  stats,
  membershipStatus = 'free',
  onQRCodePress,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L2Config = getLayerConfig('L2', isDarkMode);

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    // Press animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF', // 小红书风格纯白背景
      borderWidth: 0, // 去掉边框，更简洁
      borderRadius: 0, // 去掉圆角，由外层容器处理
      paddingHorizontal: 20,
      paddingVertical: 18, // 稍微减少内边距
    },
    avatarContainer: {
      width: 60, // 56-64pt标准
      height: 60,
      borderRadius: 30, // 圆形头像
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      backgroundColor: '#F5F6F7', // 简洁的浅灰色背景
      borderWidth: 2, // Dawn渐变描边
      borderColor: 'rgba(255, 171, 145, 0.3)', // 1pt Dawn→透明渐变描边
    },
    avatarPlaceholder: {
      // For when we don't have an avatar image
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    email: {
      fontSize: 15, // 稍微小一点，更符合小红书
      color: '#9CA3AF', // 使用中性灰色
    },
    chevron: {
      marginLeft: 8,
    },
    
    // 小红书风格新增样式
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    
    // 会员标识
    memberBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    vipBadge: {
      backgroundColor: '#FFE0B2', // 奶橘色VIP标识
    },
    premiumBadge: {
      backgroundColor: '#E3F2FD', // 淡蓝色PLUS标识
    },
    memberBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#666',
    },
    
    // 统计数据行
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0, 0, 0, 0.06)',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151', // 深灰色数字，简洁风格
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    statDivider: {
      width: 1,
      height: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      marginHorizontal: 12, // 增加间距适配2项布局
    },
    
    // V2.0 克制设计 - 中性玻璃按钮
    qrCodeButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // 中性白玻璃
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)', // 中性淡灰边框
      borderTopColor: 'rgba(255, 255, 255, 0.8)', // 白色rim高光
      paddingHorizontal: 12,
      paddingVertical: 6,
      height: 32, // 更小尺寸，不抢眼
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      // 极轻阴影
      shadowColor: 'rgba(0, 0, 0, 0.05)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    qrCodeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#374151', // 深灰色文字，适配白色背景
      marginLeft: 4,
    },
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[styles.container]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Edit profile for ${name}`}
        accessibilityHint="Double tap to edit your profile information"
        testID={testID}
      >
        {/* 小红书风格简洁头像 */}
        <View style={styles.avatarContainer}>
          <Ionicons
            name="person"
            size={24}
            color="#9CA3AF" // 中性灰色，简洁风格
          />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text 
              style={styles.name}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.4}
              numberOfLines={1}
            >
              {name}
            </Text>
            {/* 会员标识 */}
            {membershipStatus !== 'free' && (
              <View style={[styles.memberBadge, 
                membershipStatus === 'vip' ? styles.vipBadge : styles.premiumBadge
              ]}>
                <Text style={styles.memberBadgeText}>
                  {membershipStatus === 'vip' ? 'VIP' : 'PLUS'}
                </Text>
              </View>
            )}
          </View>
          
          <Text 
            style={styles.email}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
          >
            {email}
          </Text>
          
          {/* 精简统计数据 - 仅2项KPI */}
          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.volunteerHours}h</Text>
                <Text style={styles.statLabel}>{t('profile.volunteer_hours_label')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.points > 1000 ? `${(stats.points/1000).toFixed(1)}k` : stats.points}</Text>
                <Text style={styles.statLabel}>{t('profile.points_label')}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* 主CTA按钮 - 我的二维码 */}
        {onQRCodePress && (
          <TouchableOpacity 
            style={styles.qrCodeButton}
            onPress={onQRCodePress}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code" size={20} color="#000000" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PersonalInfoCard;