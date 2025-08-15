import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

const { width: screenWidth } = Dimensions.get('window');

export const ActivityDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const activity = route.params?.activity || {};
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRegister = () => {
    // 检查是否登录
    const isLoggedIn = false; // TODO: 从全局状态获取
    
    if (!isLoggedIn) {
      // 未登录，跳转到登录页
      navigation.navigate('Login', { returnTo: 'ActivityDetail' });
    } else {
      // 已登录，跳转到报名表单
      navigation.navigate('RegistrationForm', { activity });
    }
  };

  const handleShare = () => {
    Alert.alert(t('activityDetail.share'), t('activityDetail.shareMessage'));
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDay = weekDays[date.getDay()];
    return `${month}/${day} ${weekDay}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 固定在顶部的按钮 */}
      <View style={[styles.fixedHeader, { top: insets.top }]}>
        <TouchableOpacity
          style={styles.fixedBackButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.inverse} />
        </TouchableOpacity>

        <View style={styles.fixedActionButtons}>
          <TouchableOpacity
            style={styles.fixedActionButton}
            onPress={handleFavorite}
          >
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorited ? theme.colors.danger : theme.colors.text.inverse} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fixedActionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Image Header */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: activity.image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{activity.title}</Text>
            <View style={styles.attendeeInfo}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <Text style={styles.attendeeText}>
                {activity.attendees} / {activity.maxAttendees} {t('activityDetail.peopleRegistered')}
              </Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCardShadowContainer}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardOverlay} />
                <View style={styles.infoCardIcon}>
                  <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>{t('activityDetail.activityTime')}</Text>
                  <Text style={styles.infoCardValue}>
                    {formatDate(activity.date)}
                  </Text>
                  <Text style={styles.infoCardValue}>{activity.time}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCardShadowContainer}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardOverlay} />
                <View style={styles.infoCardIcon}>
                  <Ionicons name="location" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>{t('activityDetail.activityLocation')}</Text>
                  <Text style={styles.infoCardValue}>{activity.location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('activityDetail.activityDetails')}</Text>
            <Text style={styles.description}>
              欢迎参加CU 2025春季迎新派对！这是一个绝佳的机会，让新生和老生相聚一堂，建立友谊，分享经验。
              {'\n\n'}
              活动亮点：
              {'\n'}• 自助晚餐和饮料
              {'\n'}• 互动游戏和抽奖活动
              {'\n'}• 学生组织展示
              {'\n'}• 社交网络机会
              {'\n\n'}
              请准时到场，我们期待与您见面！
            </Text>
          </View>

          {/* Requirements Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('activityDetail.registrationRequirements')}</Text>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.requirementText}>CU在读学生</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.requirementText}>需要学生证验证</Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.requirementText}>建议携带名片用于社交</Text>
            </View>
          </View>

          {/* Organizer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('activityDetail.organizer')}</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerAvatarText}>CU</Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>CU中国学生学者联合会</Text>
                <Text style={styles.organizerDesc}>官方认证学生组织</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Register Button */}
      <View style={[styles.bottomContainer, { 
        paddingBottom: insets.bottom + 20,
        marginBottom: 16,
      }]}>
        <View style={[
          styles.registerButtonShadowContainer,
          isRegistered && styles.registeredButton
        ]}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isRegistered || activity.attendees >= activity.maxAttendees}
          >
            <Text style={styles.registerButtonText}>
              {isRegistered ? t('activityDetail.registered') : 
               activity.attendees >= activity.maxAttendees ? t('activityDetail.full') : t('activityDetail.registerNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // 固定在顶部的按钮样式
  fixedHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: 4,
  },
  fixedBackButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 增加不透明度避免阴影问题
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedActionButtons: {
    flexDirection: 'row',
  },
  fixedActionButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // 增加不透明度避免阴影问题
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[2],
  },
  imageContainer: {
    width: screenWidth,
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing[4],
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    position: 'absolute',
    right: theme.spacing[4],
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[2],
  },
  content: {
    padding: theme.spacing[4],
  },
  titleSection: {
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
  infoCards: {
    marginBottom: theme.spacing[4],
  },
  // Info Card Shadow容器 - 解决阴影冲突
  infoCardShadowContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.liquidGlass.card.background,
    marginBottom: theme.spacing[2],
    ...theme.shadows.sm,
  },
  
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
    position: 'relative',
    // 移除阴影，由infoCardShadowContainer处理
  },
  infoCardIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing[1],
  },
  infoCardValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // V1.1 规范: 信息卡暗层增强对比度
  infoCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: theme.borderRadius.lg,
    pointerEvents: 'none',
  },
  section: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  requirementText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  organizerAvatarText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  organizerDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  bottomContainer: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.text.inverse,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  // Register Button Shadow容器 - 解决阴影冲突
  registerButtonShadowContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    // 移除阴影，由registerButtonShadowContainer处理
  },
  registeredButton: {
    backgroundColor: theme.colors.text.disabled,
  },
  registerButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});