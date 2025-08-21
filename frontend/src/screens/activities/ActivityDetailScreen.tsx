import React, { useState, useEffect } from 'react';
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
import { DeviceEventEmitter } from 'react-native';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
// import RenderHtml from 'react-native-render-html'; // 暂时注释掉，避免兼容性问题
import { vitaGlobalAPI } from '../../services/VitaGlobalAPI';
import { FrontendActivity } from '../../utils/activityAdapter';

const { width: screenWidth } = Dimensions.get('window');

export const ActivityDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const activity = route.params?.activity || {};
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'upcoming' | 'registered' | 'checked_in'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // 初始化报名状态
  useEffect(() => {
    if (activity.status) {
      setRegistrationStatus(activity.status);
      setIsRegistered(activity.status !== 'upcoming');
    }
  }, [activity.status]);

  // 处理活动报名
  const handleRegister = async () => {
    if (loading || registrationStatus !== 'upcoming') return;

    setLoading(true);
    try {
      const result = await vitaGlobalAPI.enrollActivity(parseInt(activity.id));
      
      if (result.code === 200 && result.data && result.data > 0) {
        setRegistrationStatus('registered');
        setIsRegistered(true);
        Alert.alert(t('activityDetail.registration_success'), t('activityDetail.registration_success_message'));
      } else {
        Alert.alert(t('activityDetail.registration_failed'), result.msg || t('activityDetail.registration_failed_message'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(t('activityDetail.registration_failed'), t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };

  // 处理活动签到
  const handleSignIn = async () => {
    if (loading || registrationStatus !== 'registered') return;

    setLoading(true);
    try {
      const result = await vitaGlobalAPI.signInActivity(parseInt(activity.id));
      
      if (result.code === 200 && result.data && result.data > 0) {
        setRegistrationStatus('checked_in');
        Alert.alert(t('activityDetail.checkin_success'), t('activityDetail.checkin_success_message'));
      } else {
        Alert.alert(t('activityDetail.checkin_failed'), result.msg || t('activityDetail.checkin_failed_message'));
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      Alert.alert(t('activityDetail.checkin_failed'), t('common.network_error'));
    } finally {
      setLoading(false);
    }
  };

  // 进入页面时隐藏TabBar，离开时显示
  useEffect(() => {
    // 发送隐藏TabBar事件
    DeviceEventEmitter.emit('hideTabBar', true);

    // 组件卸载时恢复TabBar
    return () => {
      DeviceEventEmitter.emit('hideTabBar', false);
    };
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };


  const handleShare = () => {
    Alert.alert(t('activityDetail.share'), t('activityDetail.shareMessage'));
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
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
              size={20} // 稍微减小尺寸适配36px容器
              color={isFavorited ? theme.colors.danger : '#FFFFFF'} // 白色图标
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fixedActionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        bounces={false} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 120 // 预留空间给浮动的立即报名按钮
        }}
      >
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
              <Ionicons name="people" size={20} color="#111827" />
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
                  <Ionicons name="calendar" size={20} color="#111827" />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>{t('activityDetail.activityTime')}</Text>
                  <Text style={styles.infoCardValue} numberOfLines={1}>
                    {activity.endDate && activity.endDate !== activity.date 
                      ? `${activity.date.split('-')[1]}/${activity.date.split('-')[2]}-${activity.endDate.split('-')[2]}`
                      : `${activity.date.split('-')[1]}/${activity.date.split('-')[2]}`
                    }
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCardShadowContainer}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardOverlay} />
                <View style={styles.infoCardIcon}>
                  <Ionicons name="location" size={20} color="#111827" />
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
              {activity.detail ? 
                // 暂时显示HTML内容的文本版本，后续可以添加HTML解析
                activity.detail.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&') :
                t('activityDetail.no_details')
              }
            </Text>
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
        bottom: insets.bottom + 12, // 安全区上方间距≥12
      }]}>
        <View style={[
          styles.registerButtonShadowContainer,
          isRegistered && styles.registeredButton
        ]}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={registrationStatus === 'upcoming' ? handleRegister : 
                     registrationStatus === 'registered' ? handleSignIn : undefined}
            disabled={loading || registrationStatus === 'checked_in'}
          >
            <Text style={styles.registerButtonText}>
              {loading ? t('common.loading') :
               registrationStatus === 'upcoming' ? t('activityDetail.registerNow') :
               registrationStatus === 'registered' ? t('activityDetail.checkin_now') :
               registrationStatus === 'checked_in' ? t('activityDetail.checked_in') : t('activityDetail.unavailable')}
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
    width: 36, // 按建议调整为36
    height: 36,
    borderRadius: 18, // L1圆形
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light,
    borderWidth: 1, // 描边1pt
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(17, 24, 39, 0.1)', // 淡黑色背景
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
    marginBottom: theme.spacing[4] - 15, // 减少15px，避免文字重叠
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
    backgroundColor: '#111827', // 深黑色背景
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
    position: 'absolute',
    left: 0,
    right: 0,
    padding: theme.spacing[4],
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 更透明的白色背景
    borderTopWidth: 0, // 去掉上方黑线
    borderRadius: 24, // 添加圆角，与TabBar一致
    marginHorizontal: 16, // 外轮廓与屏幕左右各留16-20
    // 添加与TabBar相同的阴影效果
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  // Register Button Shadow容器 - 解决阴影冲突
  registerButtonShadowContainer: {
    borderRadius: 16, // 圆角14-16
    // L2品牌玻璃效果
    backgroundColor: 'rgba(249, 168, 137, 0.14)', // Dawn轻染14%
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 137, 0.22)', // 品牌描边22%
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