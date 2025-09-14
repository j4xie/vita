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
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';
import { useWebTabBarRestore } from '../../hooks/useWebTabBarRestore';
// import RenderHtml from 'react-native-render-html'; // 暂时注释掉，避免兼容性问题
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';
import { UltraFastImage } from '../../components/common/UltraFastImage';
import { imageCacheManager } from '../../utils/ImageCacheManager';

const { width: screenWidth } = Dimensions.get('window');

export const ActivityDetailScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  
  const routeActivity = route.params?.activity || {};
  const { user, isAuthenticated } = useUser();
  
  // 🔍 调试：打印接收到的route参数
  useEffect(() => {
    console.log('🎯 [ACTIVITY-DETAIL] Route参数调试:', {
      routeParams: route.params,
      routeActivity,
      activityKeys: Object.keys(routeActivity),
      location: routeActivity.location,
      address: routeActivity.address,
      hasLocation: !!(routeActivity.location || routeActivity.address)
    });
  }, [route.params]);
  
  const [activity, setActivity] = useState(routeActivity);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'available' | 'registered' | 'checked_in'>('available');
  const [loading, setLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [showCheckinSuccessModal, setShowCheckinSuccessModal] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });

  // 🛡️ TabBar状态守护：确保活动详情页面TabBar始终隐藏
  useTabBarVerification('ActivityDetail', { debugLogs: false });

  // 🔧 监听用户登录状态变化，重新获取活动数据
  useEffect(() => {
    if (isAuthenticated && routeActivity.id && (!activity.detail || !activity.image)) {
      console.log('🔄 用户登录后重新获取活动详情数据');
      refreshActivityData();
    }
  }, [isAuthenticated, routeActivity.id]);

  // 🔧 处理登录后返回的刷新逻辑
  useEffect(() => {
    if ((route.params?.refreshOnReturn || route.params?.forceRefresh) && isAuthenticated && routeActivity.id) {
      console.log('🔄 从登录页面返回，刷新活动数据');
      refreshActivityData();
    }
  }, [route.params?.refreshOnReturn, route.params?.forceRefresh, isAuthenticated]);

  // 🔄 重新获取活动详情数据
  const refreshActivityData = async () => {
    if (!routeActivity.id) return;
    
    setIsLoadingActivity(true);
    try {
      // 从活动列表API获取最新数据（包含完整信息）
      const response = await pomeloXAPI.getActivityList({
        pageNum: 1,
        pageSize: 100,
        userId: user?.id ? parseInt(user.id) : undefined
      });
      
      if (response.code === 200 && response.data?.rows) {
        const updatedActivity = response.data.rows.find((act: any) => act.id === routeActivity.id);
        
        if (updatedActivity) {
          console.log('✅ 获取到最新活动数据:', updatedActivity);
          setActivity(updatedActivity);
          
          // 🚀 预加载活动图片
          if (updatedActivity.image) {
            imageCacheManager.preloadImage(updatedActivity.image);
          }
        } else {
          console.warn('⚠️ 在活动列表中未找到对应活动，保持原数据');
          setActivity(routeActivity);
        }
      } else {
        console.warn('⚠️ 获取活动列表失败，保持原数据');
        setActivity(routeActivity);
      }
    } catch (error) {
      console.error('❌ 获取活动数据失败:', error);
      setActivity(routeActivity);
    } finally {
      setIsLoadingActivity(false);
    }
  };

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
      })(),
      // 🐛 新增调试信息
      currentRegistrationStatus: registrationStatus,
      currentIsRegistered: isRegistered,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // 🔧 优先通过API验证状态，而不是依赖可能过时的缓存数据
    const verifyInitialStatus = async () => {
      if (!user?.id || !activity.id) {
        // 未登录或无活动ID时，使用传入的status作为备选
        if (activity.status === 'registered' || activity.status === 'checked_in') {
          setRegistrationStatus(activity.status);
          setIsRegistered(true);
          console.log('✅ [未登录] 使用传入状态:', activity.status);
        } else {
          setRegistrationStatus('available');
          setIsRegistered(false);
          console.log('📋 [未登录] 默认未报名状态');
        }
        return;
      }
      
      try {
        console.log('🔍 [初始化] 验证活动最新报名状态:', {
          activityId: activity.id,
          userId: user.id
        });
        
        const signInfo = await pomeloXAPI.getSignInfo(parseInt(activity.id), parseInt(user.id));
        
        if (signInfo.code === 200) {
          const latestStatus = signInfo.data;
          let newStatus: 'available' | 'registered' | 'checked_in';
          
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
              newStatus = 'available';
              setIsRegistered(false);
          }
          
          setRegistrationStatus(newStatus);
          console.log('✅ [初始化] API验证状态完成:', {
            signInfo: latestStatus,
            finalStatus: newStatus
          });
        } else {
          // API失败时使用传入状态作为备选
          console.log('⚠️ [初始化] API验证失败，使用传入状态:', activity.status);
          if (activity.status === 'registered' || activity.status === 'checked_in') {
            setRegistrationStatus(activity.status);
            setIsRegistered(true);
          } else {
            setRegistrationStatus('available');
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
          setRegistrationStatus('available');
          setIsRegistered(false);
        }
      }
    };
    
    verifyInitialStatus();
  }, [activity.id, user?.id]); // 移除activity.status依赖，避免重复触发

  // 🚀 预加载活动图片
  useEffect(() => {
    if (activity.image) {
      imageCacheManager.preloadImage(activity.image);
    }
  }, [activity.image]);

  // 🔧 页面焦点变化时重新验证状态（确保最新数据）
  useEffect(() => {
    const handleFocus = () => {
      // 当页面获得焦点时，重新验证状态（比如从报名表单页面返回）
      const verifyOnFocus = async () => {
        if (!user?.id || !activity.id) return;
        
        try {
          console.log('🔍 [页面焦点] 重新验证活动报名状态');
          
          const signInfo = await pomeloXAPI.getSignInfo(parseInt(activity.id), parseInt(user.id));
          
          if (signInfo.code === 200) {
            const latestStatus = signInfo.data;
            let newStatus: 'available' | 'registered' | 'checked_in';
            
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
                newStatus = 'available';
                setIsRegistered(false);
            }
            
            setRegistrationStatus(newStatus);
            console.log('✅ [页面焦点] 状态验证完成:', newStatus);
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
  }, [navigation, activity.id, user?.id]);


  // 检查活动是否已结束的辅助函数
  const isActivityEnded = () => {
    try {
      const now = new Date();
      const activityEnd = activity.endDate 
        ? new Date(activity.endDate + ' 23:59:59') 
        : new Date(activity.date + ' ' + (activity.time || '00:00'));
      
      return activityEnd.getTime() < now.getTime();
    } catch (error) {
      console.warn('检查活动结束时间失败:', error);
      return false; // 默认认为未结束，保持功能可用
    }
  };

  // 处理活动报名
  const handleRegister = async () => {
    if (loading) return;

    console.log('🚀 [注册按钮] 用户点击Register Now按钮:', {
      isAuthenticated,
      registrationStatus,
      isRegistered,
      activityId: activity.id,
      activityTitle: activity.title,
      userId: user?.id,
      timestamp: new Date().toLocaleTimeString()
    });

    // 检查用户登录状态
    if (!isAuthenticated) {
      console.log('🔐 [注册按钮] 用户未登录，跳转到登录页面');
      // 未登录，跳转到登录页面，传递完整的activity数据
      navigation.navigate('Login', { 
        returnTo: 'ActivityDetail', 
        activityId: activity.id,
        originalActivity: activity
      });
      return;
    }

    // 已登录，跳转到报名表单页面
    if (registrationStatus === 'available') {
      console.log('📝 [注册按钮] 用户已登录且可以报名，跳转到报名表单页面');
      navigation.navigate('ActivityRegistrationForm', { activity });
      return;
    } else {
      console.log('⚠️ [注册按钮] 用户状态异常，无法进行报名:', {
        registrationStatus,
        isRegistered,
        shouldShowRegisterNow: registrationStatus === 'available' && !isRegistered
      });
    }
  };

  // 处理活动签到 - 打开扫码页面
  const handleSignIn = async () => {
    if (loading || registrationStatus !== 'registered') return;

    try {
      console.log('🚀 [签到] 打开活动签到扫码页面:', { 
        activityId: activity.id, 
        activityName: activity.name,
        userId: user?.id
      });
      
      // 原来的QR扫描逻辑（备用）
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
              // 🔧 增强签到API调用日志
              const activityIdInt = parseInt(activity.id);
              const userIdInt = user?.id ? parseInt(user.id) : 0;
              
              console.log('🚀 [签到] 开始调用后端API:', {
                activityId: activityIdInt,
                userId: userIdInt,
                apiUrl: `/app/activity/signIn?activityId=${activityIdInt}&userId=${userIdInt}`,
                timestamp: new Date().toISOString()
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
                
                // 🎊 显示签到成功提示弹窗
                setShowCheckinSuccessModal(true);
                
                // 返回活动详情页面 (由弹窗处理)
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
                
                setErrorModalData({ 
                  title: t('activityDetail.checkin_failed') || '签到失败', 
                  message: errorMessage 
                });
                setShowErrorModal(true);
              }
            } catch (error) {
              console.error('Activity sign in error:', error);
              setErrorModalData({ 
                title: t('activityDetail.checkin_failed') || '签到失败', 
                message: t('common.network_error') || '网络错误' 
              });
              setShowErrorModal(true);
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
            setErrorModalData({ 
              title: t('activityDetail.scan_failed') || '扫码失败', 
              message: t('activityDetail.scan_failed_message') || '扫码失败，请重试' 
            });
            setShowErrorModal(true);
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
      setErrorModalData({ 
        title: t('activityDetail.open_scanner_failed') || '打开扫码失败', 
        message: t('activityDetail.open_scanner_failed_message') || '打开扫码失败，请重试' 
      });
      setShowErrorModal(true);
    }
  };

  // 监听报名成功事件
  useEffect(() => {
    const registrationListener = DeviceEventEmitter.addListener('activityRegistered', (data: { activityId: string }) => {
      if (data.activityId === activity.id) {
        console.log('🎉 [ActivityDetail] 接收到activityRegistered事件，更新状态为已报名');
        setRegistrationStatus('registered');
        setIsRegistered(true);
        
        // 🔄 额外验证：重新从API获取最新状态以确保数据一致性
        setTimeout(async () => {
          if (user?.id) {
            try {
              const signInfo = await pomeloXAPI.getSignInfo(parseInt(activity.id), parseInt(user.id));
              if (signInfo.code === 200) {
                const latestStatus = signInfo.data;
                console.log('✅ [ActivityDetail] API验证报名后状态:', latestStatus);
                
                if (latestStatus === -1) {
                  setRegistrationStatus('registered');
                  setIsRegistered(true);
                } else if (latestStatus === 1) {
                  setRegistrationStatus('checked_in');
                  setIsRegistered(true);
                }
              }
            } catch (error) {
              console.warn('⚠️ [ActivityDetail] 验证报名状态失败:', error);
            }
          }
        }, 200);
      }
    });

    return () => {
      registrationListener.remove();
    };
  }, [activity.id, user?.id]);

  // 🌐 Web端TabBar恢复机制：当退出详情页时恢复TabBar
  const { manualRestore } = useWebTabBarRestore({
    routeName: 'ActivityDetail',
    forceRestore: false, // 详情页不强制显示TabBar
    debugLogs: true
  });

  const handleBack = () => {
    // 在返回前手动触发TabBar恢复
    try {
      console.log('🔙 [ACTIVITY-DETAIL] 返回ActivityList，触发TabBar恢复');
      
      // 获取父级导航器并强制恢复TabBar
      const parentNav = navigation.getParent();
      if (parentNav && typeof parentNav.setOptions === 'function') {
        parentNav.setOptions({
          tabBarStyle: {
            display: 'flex',
            position: 'absolute' as const,
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            borderTopWidth: 0,
          }
        });
        console.log('✅ [ACTIVITY-DETAIL] TabBar强制恢复为显示状态');
      }
    } catch (error) {
      console.error('⚠️ [ACTIVITY-DETAIL] TabBar恢复失败:', error);
    }
    
    navigation.goBack();
  };


  const handleShare = () => {
    // 移除Alert，使用console.log替代
    console.log('📤 [分享] 用户点击分享按钮');
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  // 移除重复的弹窗处理函数，直接在组件中处理

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
          <UltraFastImage
            uri={activity.image}
            style={styles.image}
            resizeMode="cover"
            onLoad={() => console.log('✅ 活动图片加载成功')}
            onError={(error) => console.warn('⚠️ 活动图片加载失败:', error)}
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
                  <Text style={styles.infoCardValue}>
                    {activity.location || activity.address || t('common.unknown')}
                  </Text>
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
          registrationStatus === 'registered' && styles.checkInButton, // 立即签到时使用绿色
          registrationStatus === 'checked_in' && styles.checkedInButton, // 已签到使用灰色
          isActivityEnded() && styles.activityEndedButton
        ]}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => {
              console.log('🎯 [按钮渲染] 用户点击底部按钮:', {
                registrationStatus,
                isRegistered,
                isAuthenticated,
                isActivityEnded: isActivityEnded(),
                willCallSignIn: registrationStatus === 'registered',
                willCallRegister: registrationStatus !== 'registered',
                currentButtonText: loading ? 'loading' :
                  isActivityEnded() ? 'activity_ended' :
                  !isAuthenticated ? 'login_required_to_register' :
                  registrationStatus === 'available' ? 'registerNow' :
                  registrationStatus === 'registered' ? 'checkin_now' :
                  registrationStatus === 'checked_in' ? 'checked_in' : 'unavailable',
                timestamp: new Date().toLocaleTimeString()
              });
              
              if (registrationStatus === 'registered') {
                handleSignIn();
              } else {
                handleRegister();
              }
            }}
            disabled={loading || registrationStatus === 'checked_in' || isActivityEnded()}
          >
            <Text style={styles.registerButtonText}>
              {loading ? t('common.loading') :
               isActivityEnded() ? (t('activityDetail.activity_ended') || '活动已结束') :
               !isAuthenticated ? t('activityDetail.login_required_to_register') :
               registrationStatus === 'available' ? t('activityDetail.registerNow') :
               registrationStatus === 'registered' ? t('activityDetail.checkin_now') :
               registrationStatus === 'checked_in' ? t('activityDetail.checked_in') : t('activityDetail.unavailable')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 签到成功提示弹窗 */}
      <LiquidSuccessModal
        visible={showCheckinSuccessModal}
        onClose={() => setShowCheckinSuccessModal(false)}
        title={t('activityDetail.checkin_success') || '签到成功'}
        message={t('activityDetail.checkin_success_message') || '恭喜您成功签到，现在您已经参加这个活动'}
        confirmText={t('common.confirm') || '确认'}
        icon="checkmark-circle"
      />

      {/* 取消活动成功提示弹窗 */}
      <LiquidSuccessModal
        visible={showCancelSuccessModal}
        onClose={() => setShowCancelSuccessModal(false)}
        title={t('activityDetail.cancel_success') || '取消成功'}
        message={t('activityDetail.cancel_success_message') || '您已成功取消报名'}
        confirmText={t('common.confirm') || '确认'}
        icon="checkmark-circle"
      />

      {/* 错误提示弹窗 */}
      <LiquidSuccessModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorModalData.title}
        message={errorModalData.message}
        confirmText={t('common.confirm') || '确认'}
        icon="alert-circle"
      />
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
    // 默认使用主题橙色（报名按钮）
    backgroundColor: theme.colors.primary, // 橙色背景
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // 立即签到状态按钮 - 绿色
  checkInButton: {
    backgroundColor: theme.colors.checkedIn, // 立即签到使用绿色
    shadowColor: theme.colors.checkedIn,
  },
  
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  checkedInButton: {
    backgroundColor: '#6B7280', // Activity Ended 使用灰色
    shadowColor: '#6B7280',
  },
  
  // Activity Ended 按钮禁用状态
  activityEndedButton: {
    backgroundColor: '#6B7280', // 灰色背景
    shadowColor: '#6B7280',
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});