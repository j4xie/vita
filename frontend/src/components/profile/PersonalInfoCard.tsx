import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';

interface PersonalInfoCardProps {
  name: string;
  email?: string; // 改为可选，保持兼容性
  school?: string; // 学校名称
  organization?: string; // 组织名称
  position?: string; // 岗位信息
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
  onVolunteerHoursPress?: () => void; // 新增：点击志愿者小时回调
  onEditPress?: () => void; // 新增：点击编辑资料回调
  isGuest?: boolean; // 新增：是否为访客状态
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  name,
  email,
  school,
  organization,
  position,
  avatarUrl,
  onPress,
  testID,
  stats,
  membershipStatus = 'free',
  onQRCodePress,
  onVolunteerHoursPress,
  onEditPress,
  isGuest = false,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;
  
  const darkModeSystem = useAllDarkModeStyles();
  const { styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L2Config = getLayerConfig('L2', isDarkMode);

  // 动画相关的 shared values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // 处理按压开始
  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 300,
    });
    opacity.value = withTiming(0.8, { duration: 150 });
    
    // 触觉反馈
    if (Platform.OS === 'ios') {
      runOnJS(Haptics.selectionAsync)();
    }
  };

  // 处理按压结束
  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
    opacity.value = withTiming(1, { duration: 200 });
  };

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
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
      borderWidth: 2, // Dawn渐变描边
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
      marginBottom: 4,
    },
    email: {
      fontSize: 15, // 稍微小一点，更符合小红书
      flex: 1, // 在同行布局中占据剩余空间
    },
    position: {
      fontSize: 16, // 提升至交互文字16pt（职位信息重要）
      fontWeight: '500',
      color: '#374151', // 深灰色文字
      textAlign: 'center',
    },
    positionBadge: {
      backgroundColor: '#F3F4F6', // 中性浅灰色背景
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      alignSelf: 'flex-start', // 让徽章贴合内容大小
      marginLeft: 8, // 与左侧文字的间距
    },
    organizationRow: {
      flexDirection: 'row',
      alignItems: 'center', // 垂直居中对齐
      marginBottom: 8, // 与下方统计数据的间距
      justifyContent: 'flex-start', // 左对齐
    },
    chevron: {
      marginLeft: 8,
    },
    
    // 小红书风格新增样式
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6, // 与组织行的间距保持一致
    },
    
    // 会员标识
    memberBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    vipBadge: {
      backgroundColor: '#F5F5F5', // 浅灰色VIP标识
    },
    premiumBadge: {
      backgroundColor: '#E3F2FD', // 淡蓝色PLUS标识
    },
    memberBadgeText: {
      fontSize: 14, // 提升至辅助信息最小14pt
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
      fontSize: 14, // 提升至辅助信息最小14pt（统计标签）
      color: '#9CA3AF',
    },
    statDivider: {
      width: 1,
      height: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
      marginHorizontal: 12, // 增加间距适配2项布局
    },
    volunteerHoursLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    clickIndicator: {
      marginLeft: 3,
      opacity: 0.6,
    },
    
    // 访客状态样式 - 右侧登录按钮
    guestLoginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    
    // 访客状态专用的nameRow样式
    guestNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    guestLoginText: {
      fontSize: 16, // 增大字体
      color: '#6B7280',
      fontWeight: '600', // 更加加粗
    },
    guestLoginIcon: {
      marginLeft: 4,
    },
    
    // V2.0 克制设计 - 中性玻璃按钮
    rightButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // 按钮之间的间距
    },
    actionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // 中性白玻璃
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.1)', // 中性淡灰边框
      borderTopColor: 'rgba(255, 255, 255, 0.8)', // 白色rim高光
      paddingHorizontal: 10,
      paddingVertical: 6,
      height: 32, // 更小尺寸，不抢眼
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      // 极轻阴影
      shadowColor: 'rgba(0, 0, 0, 0.05)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      minWidth: 32, // 确保圆形按钮的最小宽度
    },
    editButton: {
      // 编辑按钮特定样式
    },
    qrCodeButton: {
      // QR码按钮特定样式
    },
    buttonText: {
      fontSize: 12, // 稍微小一点以适应更紧凑的布局
      fontWeight: '600',
      color: '#374151', // 深灰色文字，适配白色背景
      marginLeft: 4,
    },
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.container, 
          dmStyles.card.contentSection,
          animatedStyle
        ]}
      >
        {/* 小红书风格简洁头像 */}
        <View style={[
          styles.avatarContainer,
          {
            backgroundColor: isDarkMode ? '#374151' : '#F5F6F7',
            borderColor: isDarkMode ? 'rgba(255, 138, 101, 0.4)' : 'rgba(255, 171, 145, 0.3)'
          }
        ]}>
          <Ionicons
            name="person"
            size={24}
            color={dmIcons?.tertiary || dmIcons?.primary || (isDarkMode ? '#EBEBF54D' : '#3C3C434D')}
          />
        </View>
        
        <View style={styles.infoContainer}>
          {!isGuest ? (
            <View style={styles.nameRow}>
              <Text 
                style={[styles.name, dmStyles.text.title]}
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
          ) : (
            /* 访客状态：Guest名称与Login按钮在同一水平线 */
            <View style={styles.guestNameRow}>
              <Text 
                style={[styles.name, dmStyles.text.title]}
                allowFontScaling={true}
                maxFontSizeMultiplier={1.4}
                numberOfLines={1}
              >
                {name}
              </Text>
              <View style={styles.guestLoginButton}>
                <Text style={styles.guestLoginText}>
                  {t('auth.login.login', 'Login')}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={18} 
                  color="#6B7280" 
                  style={styles.guestLoginIcon}
                />
              </View>
            </View>
          )}
          
          {/* 学校 • 组织信息 与 岗位徽章同行显示 - 仅登录用户显示 */}
          {!isGuest && (school || organization || position) && (
            <View style={styles.organizationRow}>
              {/* 学校组织信息 */}
              {(school || organization) && (
                <Text 
                  style={[styles.email, dmStyles.text.secondary]}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.3}
                  numberOfLines={1}
                >
                  {school && organization ? `${school} • ${organization}` : (school || organization)}
                </Text>
              )}
              
              {/* 岗位徽章 */}
              {position && (
                <View style={styles.positionBadge}>
                  <Text 
                    style={styles.position}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={1.1}
                    numberOfLines={1}
                  >
                    {position}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* 兜底显示邮箱（如果没有学校和组织信息） - 仅登录用户显示 */}
          {!isGuest && !school && !organization && email && (
            <Text 
              style={[styles.email, dmStyles.text.secondary]}
              allowFontScaling={true}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
            >
              {email}
            </Text>
          )}
          
          {/* 精简统计数据 - 仅2项KPI */}
          {stats && !isGuest && (
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.statItem} 
                onPress={onVolunteerHoursPress}
                disabled={!onVolunteerHoursPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`查看志愿者工时详情: ${stats.volunteerHours}小时`}
              >
                <Text style={[styles.statNumber, dmStyles.text.primary]}>{stats.volunteerHours}h</Text>
                <View style={styles.volunteerHoursLabelContainer}>
                  <Text style={[styles.statLabel, dmStyles.text.secondary]}>{t('profile.volunteer_hours_label')}</Text>
                  {onVolunteerHoursPress && (
                    <Ionicons 
                      name="chevron-forward" 
                      size={12} 
                      color={dmStyles.text.tertiary.color}
                      style={styles.clickIndicator}
                    />
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, dmStyles.text.primary]}>{stats.points > 1000 ? `${(stats.points/1000).toFixed(1)}k` : stats.points}</Text>
                <Text style={[styles.statLabel, dmStyles.text.secondary]}>{t('profile.points_label')}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* 右侧操作按钮 - 编辑和QR码 */}
        {!isGuest && (onEditPress || onQRCodePress) && (
          <View style={styles.rightButtonsContainer}>
            {/* 编辑按钮 - 🚫 临时封禁：由于后端角色字段问题暂时禁用 */}
            {false && onEditPress && (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={onEditPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('profile.edit.title', '编辑资料')}
              >
                <Ionicons
                  name="pencil"
                  size={16}
                  color={dmIcons?.primary || (isDarkMode ? '#FFFFFF' : '#374151')}
                />
              </TouchableOpacity>
            )}

            {/* QR码按钮 */}
            {onQRCodePress && (
              <TouchableOpacity
                style={[styles.actionButton, styles.qrCodeButton]}
                onPress={onQRCodePress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('profile.qr_code', 'QR 码')}
              >
                <Ionicons
                  name="qr-code"
                  size={16}
                  color={dmIcons?.primary || (isDarkMode ? '#FFFFFF' : '#374151')}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

export default PersonalInfoCard;