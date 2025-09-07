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
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter } from 'react-native';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';
// import RenderHtml from 'react-native-render-html'; // 暂时注释掉，避免兼容性问题
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';

const { width: screenWidth } = Dimensions.get('window');

export const ActivityDetailScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  
  // activity 现在使用 useState 进行管理
  const { user, isAuthenticated } = useUser();
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'upcoming' | 'registered' | 'checked_in'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [activity, setActivity] = useState(route.params?.activity || {}); // ✅ 将activity转为状态以支持动态更新

  // 🛡️ TabBar状态守护：确保活动详情页面TabBar始终隐藏
  useTabBarVerification('ActivityDetail', { debugLogs: false });

  // 🔧 优化报名状态初始化 - 优先使用API验证而非缓存数据
  useEffect(() => {
    console.log('🎯 ActivityDetailScreen接收到的完整activity数据:', {
      rawActivity: activity,
      hasActivity: !!activity,
      activityKeys: activity ? Object.keys(activity) : [],
      routeParams: route.params,
      activityId: activity.id,
      activityTitle: activity.title,
      attendees: activity.attendees,
      maxAttendees: activity.maxAttendees,
      registeredCount: activity.registeredCount,
      enrollment: activity.enrollment,
      registeredCountType: typeof activity.registeredCount,
      hasRegisteredCount: activity.registeredCount !== undefined,
      willDisplay: (() => {
        const registeredCount = activity.registeredCount ?? activity.attendees ?? 0;
        const maxAttendees = activity.maxAttendees || activity.enrollment || 0;
        return maxAttendees > 0 ? `${registeredCount}/${maxAttendees}` : `${registeredCount}`;
      })()
    });
    
    // 🔧 优先通过API验证状态，而不是依赖可能过时的缓存数据
    const verifyInitialStatus = async () => {
      // 🔧 修复用户ID获取逻辑，支持多种字段名
      const userId = user?.id || user?.userId;
      const activityId = activity.id;
      
      if (!userId || !activityId) {
        // 未登录或无活动ID时，使用传入的status作为备选
        if (activity.status === 'registered' || activity.status === 'checked_in') {
          setRegistrationStatus(activity.status);
          setIsRegistered(true);
          console.log('✅ [未登录] 使用传入状态:', activity.status);
        } else {
          setRegistrationStatus('upcoming');
          setIsRegistered(false);
          console.log('📋 [未登录] 默认未报名状态');
        }
        return;
      }
      
      try {
        // 🔧 增强用户ID和活动ID验证
        const parsedUserId = parseInt(String(userId));
        const parsedActivityId = parseInt(String(activityId));
        
        if (isNaN(parsedUserId) || isNaN(parsedActivityId) || parsedUserId <= 0 || parsedActivityId <= 0) {
          console.warn('⚠️ [初始化] ID解析失败，跳过状态验证:', {
            userId,
            activityId,
            parsedUserId,
            parsedActivityId
          });
          return;
        }
        
        console.log('🔍 [初始化] 验证活动最新报名状态:', {
          activityId: parsedActivityId,
          userId: parsedUserId,
          userIdSource: user?.id ? 'user.id' : 'user.userId'
        });
        
        const signInfo = await pomeloXAPI.getSignInfo(parsedActivityId, parsedUserId);
        
        if (signInfo.code === 200) {
          const latestStatus = signInfo.data;
          let newStatus: 'upcoming' | 'registered' | 'checked_in';
          
          switch (latestStatus) {
            case -1:
              newStatus = 'registered';
              setIsRegistered(true);
              break;
            case 1:
              newStatus = 'checked_in';
              setIsRegistered(true);
              break;
            default:
              newStatus = 'upcoming';
              setIsRegistered(false);
          }
          
          setRegistrationStatus(newStatus);
          console.log('✅ [初始化] API验证状态完成:', {
            signInfo: latestStatus,
            finalStatus: newStatus
          });
        } else {
          // API失败时使用传入状态作为备选
          console.log('⚠️ [初始化] API验证失败，使用传入状态:', {
            code: signInfo.code,
            message: signInfo.msg,
            fallbackStatus: activity.status
          });
          if (activity.status === 'registered' || activity.status === 'checked_in') {
            setRegistrationStatus(activity.status);
            setIsRegistered(true);
          } else {
            setRegistrationStatus('upcoming');
            setIsRegistered(false);
          }
        }
      } catch (error) {
        console.warn('⚠️ [初始化] API验证异常，使用传入状态:', error);
        // 异常时使用传入状态作为备选
        if (activity.status === 'registered' || activity.status === 'checked_in') {
          setRegistrationStatus(activity.status);
          setIsRegistered(true);
        } else {
          setRegistrationStatus('upcoming');
          setIsRegistered(false);
        }
      }
    };
    
    verifyInitialStatus();
  }, [activity.id, user?.id, user?.userId]); // 🔧 添加user?.userId到依赖项，确保用户状态变化时重新验证

  // 🔧 页面焦点变化时重新验证状态（确保最新数据）
  useEffect(() => {
    const handleFocus = () => {
      // 当页面获得焦点时，重新验证状态（比如从报名表单页面返回）
      const verifyOnFocus = async () => {
        // 🔧 修复用户ID获取逻辑，支持多种字段名
        const userId = user?.id || user?.userId;
        const activityId = activity.id;
        
        if (!userId || !activityId) return;
        
        try {
          // 🔧 增强ID验证逻辑
          const parsedUserId = parseInt(String(userId));
          const parsedActivityId = parseInt(String(activityId));
          
          if (isNaN(parsedUserId) || isNaN(parsedActivityId) || parsedUserId <= 0 || parsedActivityId <= 0) {
            console.warn('⚠️ [页面焦点] ID解析失败，跳过状态验证:', {
              userId,
              activityId,
              parsedUserId,
              parsedActivityId
            });
            return;
          }
          
          console.log('🔍 [页面焦点] 重新验证活动报名状态:', {
            activityId: parsedActivityId,
            userId: parsedUserId,
            userIdSource: user?.id ? 'user.id' : 'user.userId'
          });
        
          const signInfo = await pomeloXAPI.getSignInfo(parsedActivityId, parsedUserId);
          
          if (signInfo.code === 200) {
            const latestStatus = signInfo.data;
            let newStatus: 'upcoming' | 'registered' | 'checked_in';
            
            switch (latestStatus) {
              case -1:
                newStatus = 'registered';
                setIsRegistered(true);
                break;
              case 1:
                newStatus = 'checked_in';
                setIsRegistered(true);
                break;
              default:
                newStatus = 'upcoming';
                setIsRegistered(false);
            }
            
            setRegistrationStatus(newStatus);
            console.log('✅ [页面焦点] 状态验证完成:', {
              signInfo: latestStatus,
              finalStatus: newStatus
            });
          } else {
            console.warn('⚠️ [页面焦点] API返回失败:', {
              code: signInfo.code,
              message: signInfo.msg
            });
          }
        } catch (error) {
          console.warn('⚠️ [页面焦点] 验证失败:', error);
        }
      };
      
      verifyOnFocus();
    };

    // 监听页面焦点事件
    const unsubscribe = navigation.addListener('focus', handleFocus);
    
    return unsubscribe;
  }, [navigation, activity.id, user?.id, user?.userId]); // 🔧 添加user?.userId到依赖项


  // 处理活动报名
  const handleRegister = async () => {
    if (loading) return;

    // 检查用户登录状态
    if (!isAuthenticated) {
      // 未登录，跳转到登录页面
      navigation.navigate('Login', { returnTo: 'ActivityDetail', activityId: activity.id });
      return;
    }

    // 已登录，跳转到报名表单页面
    if (registrationStatus === 'upcoming') {
      navigation.navigate('ActivityRegistrationForm', { activity });
      return;
    }
  };

  // 处理活动签到 - 打开扫码页面
  const handleSignIn = async () => {
    if (loading || registrationStatus !== 'registered') return;

    try {
      console.log('开始活动签到流程:', { activityId: activity.id, activityName: activity.name });
      
      // 生成唯一的回调ID
      const callbackId = `activity_signin_${Date.now()}`;
      
      // 注册回调函数到导航状态，添加防御性错误处理
      let parentNavigator;
      let state;
      
      try {
        parentNavigator = (navigation as any).getParent();
        if (parentNavigator && typeof parentNavigator.getState === 'function') {
          state = parentNavigator.getState();
        }
      } catch (error) {
        console.warn('⚠️ [QR-SCANNER] 获取导航状态失败，使用备用方案:', error);
      }
      
      // 如果无法获取导航状态，使用备用方案
      if (!state) {
        console.log('🔄 [QR-SCANNER] 使用备用回调存储方案');
        // 可以使用全局状态或其他方式存储回调
        if (!global.qrScannerCallbacks) {
          global.qrScannerCallbacks = {};
        }
        state = { qrScannerCallbacks: global.qrScannerCallbacks };
      }
      
      if (!state.qrScannerCallbacks) {
        state.qrScannerCallbacks = {};
      }
      
      if (state.qrScannerCallbacks) {
          state.qrScannerCallbacks[callbackId] = {
          onScanSuccess: async (scannedData: string) => {
            // 扫码成功后的处理
            console.log('扫码成功，开始签到:', scannedData);
            
            try {
              setLoading(true);
              
              // 🔧 修复签到用户ID验证逻辑
              if (!user || !user.id) {
                console.error('❌ [签到] 用户未登录或无有效ID:', { user: !!user, userId: user?.id });
                Alert.alert(
                  t('activityDetail.checkin_failed'),
                  '用户身份验证失败，请重新登录'
                );
                return;
              }

              const activityIdInt = parseInt(activity.id);
              const userIdInt = parseInt(user.id);
              
              // 验证解析结果
              if (isNaN(activityIdInt) || isNaN(userIdInt) || userIdInt <= 0) {
                console.error('❌ [签到] ID解析失败:', { 
                  activityId: activity.id, 
                  activityIdInt, 
                  userId: user.id, 
                  userIdInt 
                });
                Alert.alert(
                  t('activityDetail.checkin_failed'),
                  '参数解析失败，请重试'
                );
                return;
              }
              
              console.log('🚀 [签到] 开始调用后端API:', {
                activityId: activityIdInt,
                userId: userIdInt,
                apiUrl: `/app/activity/signIn?activityId=${activityIdInt}&userId=${userIdInt}`,
                timestamp: new Date().toISOString(),
                userInfo: {
                  userName: user.userName,
                  legalName: user.legalName
                }
              });
              
              // 调用活动签到API
              const result = await pomeloXAPI.signInActivity(activityIdInt, userIdInt);
              
              console.log('✅ [签到] 后端API响应:', {
                result,
                success: result.code === 200,
                hasData: !!result.data,
                timestamp: new Date().toISOString()
              });
              
              if (result.code === 200 && result.data && result.data > 0) {
                setRegistrationStatus('checked_in');
                
                // 发送签到成功事件，更新活动列表
                DeviceEventEmitter.emit('activitySignedIn', { activityId: activity.id });
                
                Alert.alert(
                  t('activityDetail.checkin_success'), 
                  t('activityDetail.checkin_success_message')
                );
                
                // 返回活动详情页面
                navigation.goBack();
              } else {
                // 详细的错误处理
                let errorMessage = result.msg || t('activityDetail.checkin_failed_message');
                
                if (result.code === 500) {
                  if (errorMessage.includes('已签到')) {
                    errorMessage = t('activityDetail.already_checked_in');
                    setRegistrationStatus('checked_in');
                  } else if (errorMessage.includes('时间')) {
                    errorMessage = t('activityDetail.checkin_time_invalid');
                  } else if (errorMessage.includes('未报名')) {
                    errorMessage = t('activityDetail.not_registered_cannot_checkin');
                  } else {
                    errorMessage = t('activityDetail.checkin_failed_message');
                  }
                }
                
                Alert.alert(t('activityDetail.checkin_failed'), errorMessage);
              }
            } catch (error) {
              console.error('Activity sign in error:', error);
              Alert.alert(t('activityDetail.checkin_failed'), t('common.network_error'));
            } finally {
              setLoading(false);
              // 清理回调函数
              if (state && state.qrScannerCallbacks && state.qrScannerCallbacks[callbackId]) {
                delete state.qrScannerCallbacks[callbackId];
              }
            }
          },
          onScanError: (error: string) => {
            // 扫码失败的处理
            console.error('扫码失败:', error);
            Alert.alert(
              t('activityDetail.scan_failed'),
              t('activityDetail.scan_failed_message')
            );
            // 清理回调函数
            if (state && state.qrScannerCallbacks && state.qrScannerCallbacks[callbackId]) {
              delete state.qrScannerCallbacks[callbackId];
            }
          }
        };
      }
      
      // 导航到扫码页面，只传递序列化参数
      navigation.navigate('QRScanner', {
        purpose: 'activity_signin', // 扫码目的：活动签到
        activity: activity, // 传递活动信息
        callbackId: callbackId // 传递回调ID而不是函数
      });
    } catch (error) {
      console.error('打开扫码页面失败:', error);
      Alert.alert(
        t('activityDetail.open_scanner_failed'),
        t('activityDetail.open_scanner_failed_message')
      );
    }
  };

  // ✅ 监听报名成功事件 - 立即更新机制
  useEffect(() => {
    const registrationListener = DeviceEventEmitter.addListener('activityRegistered', (data: { activityId: string }) => {
      if (data.activityId === activity.id) {
        console.log('📋 [ActivityDetail] 收到活动报名成功事件:', {
          activityId: data.activityId,
          currentRegisteredCount: activity.registeredCount,
          currentAttendees: activity.attendees
        });
        
        // ✅ 立即更新状态
        setRegistrationStatus('registered');
        setIsRegistered(true);
        
        // ✅ 立即更新本地显示的报名人数
        setActivity(prev => {
          const newRegisteredCount = (prev.registeredCount || 0) + 1;
          const newAttendees = (prev.attendees || 0) + 1;
          
          console.log('📈 [ActivityDetail] 立即更新报名人数:', {
            原始registeredCount: prev.registeredCount,
            新registeredCount: newRegisteredCount,
            原始attendees: prev.attendees,
            新attendees: newAttendees
          });
          
          return {
            ...prev,
            registeredCount: newRegisteredCount,
            attendees: newAttendees
          };
        });
        
        // ✅ 不需要重新发送事件，避免循环依赖
        // 事件已经由 RegistrationForm 发送了
        
        // ✅ 延迟获取后端最新数据确保同步
        setTimeout(async () => {
          console.log('🔄 [ActivityDetail] 延迟获取最新活动数据');
          await refreshActivityFromAPI();
        }, 1500);
      }
    });

    return () => {
      registrationListener.remove();
    };
  }, [activity.id, activity.registeredCount, activity.attendees]); // 添加依赖项确保闭包正确

  // ✅ API数据刷新函数
  const refreshActivityFromAPI = async () => {
    try {
      const userId = user?.id || user?.userId;
      if (!userId) return;
      
      const parsedUserId = parseInt(String(userId));
      const parsedActivityId = parseInt(String(activity.id));
      
      if (isNaN(parsedUserId) || isNaN(parsedActivityId)) {
        console.warn('⚠️ [refreshActivityFromAPI] ID解析失败');
        return;
      }
      
      console.log('🔍 [refreshActivityFromAPI] 获取最新数据:', {
        activityId: parsedActivityId,
        userId: parsedUserId
      });
      
      // 同时获取状态和更新的活动数据
      const [statusResponse] = await Promise.all([
        pomeloXAPI.getSignInfo(parsedActivityId, parsedUserId)
      ]);
      
      if (statusResponse.code === 200) {
        const newStatus = statusResponse.data === -1 ? 'registered' : 
                         statusResponse.data === 1 ? 'checked_in' : 'upcoming';
        
        console.log('📊 [refreshActivityFromAPI] 状态验证结果:', {
          signInfo: statusResponse.data,
          finalStatus: newStatus
        });
        
        setRegistrationStatus(newStatus);
        setIsRegistered(newStatus !== 'upcoming');
      }
      
    } catch (error) {
      console.warn('⚠️ [refreshActivityFromAPI] 刷新失败:', error);
    }
  };

  // ✅ 页面获得焦点时重新获取最新数据
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('📱 [ActivityDetail] 页面获得焦点，刷新数据');
      await refreshActivityFromAPI();
    });
    return unsubscribe;
  }, [navigation, activity.id]);

  const handleBack = () => {
    navigation.goBack();
  };


  const handleShare = () => {
    Alert.alert(t('activityDetail.share'), t('activityDetail.shareMessage'));
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  // 格式化时间为12小时制
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
      {/* 固定在顶部的按钮 */}
      <View style={[styles.fixedHeader, { top: insets.top }]}>
        <TouchableOpacity
          style={styles.fixedBackButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
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
                {(() => {
                  // 只有登录用户才显示报名人数
                  if (!isAuthenticated) {
                    return t('auth.login_required_to_view_count') || 'Login to view registration count';
                  }
                  
                  const registeredCount = activity.registeredCount ?? activity.attendees ?? 0;
                  const maxAttendees = activity.maxAttendees || activity.enrollment || 0;
                  const isEnglish = i18n.language === 'en-US' || i18n.language === 'en';
                  
                  // 极简显示逻辑
                  if (maxAttendees > 0) {
                    // 有限制: "5 / 100"
                    return `${registeredCount} / ${maxAttendees}`;
                  } else {
                    // 无限制: "5 / ∞"
                    return `${registeredCount} / ∞`;
                  }
                })()}
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
                  <Text style={styles.infoCardValue} numberOfLines={2}>
                    {activity.date && activity.endDate && activity.endDate !== activity.date 
                      ? `${activity.date.split('-')[1].padStart(2, '0')}/${activity.date.split('-')[2].padStart(2, '0')}-${activity.endDate.split('-')[1].padStart(2, '0')}/${activity.endDate.split('-')[2].padStart(2, '0')}`
                      : activity.date ? `${activity.date.split('-')[1].padStart(2, '0')}/${activity.date.split('-')[2].padStart(2, '0')}` : t('common.unknown')
                    }
                  </Text>
                  {activity.time && activity.time !== '00:00' && (
                    <Text style={[styles.infoCardValue, { fontSize: 14, marginTop: 2 }]}>
                      {formatTime(activity.time)}
                    </Text>
                  )}
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
                <Text style={styles.organizerAvatarText}>
                  {activity.organizer?.name ? activity.organizer.name.substring(0, 2).toUpperCase() : 'ORG'}
                </Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>{activity.organizer?.name || t('activityDetail.official_activity', '官方活动')}</Text>
                <Text style={styles.organizerDesc}>
                  {activity.organizer?.verified ? t('activityDetail.verified_organizer', '官方认证组织') : t('activityDetail.activity_organizer', '活动组织方')}
                </Text>
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
          registrationStatus === 'checked_in' && styles.checkedInButton
        ]}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={registrationStatus === 'registered' ? handleSignIn : handleRegister}
            disabled={loading || registrationStatus === 'checked_in'}
          >
            <Text style={styles.registerButtonText}>
              {loading ? t('common.loading') :
               !isAuthenticated ? t('activityDetail.login_required_to_register') :
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
    borderRadius: 16,
    // 使用鲜明的主题色
    backgroundColor: theme.colors.primary, // 鲜明的橙色背景
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  checkedInButton: {
    backgroundColor: theme.colors.text.disabled,
  },
  registerButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});