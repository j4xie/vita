import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Keyboard,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter } from 'react-native';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { useTabBarVerification } from '../../hooks/useTabBarStateGuard';
import { RichTextRenderer } from '../../components/common/RichTextRenderer';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { FrontendActivity } from '../../utils/activityAdapter';
import { useUser } from '../../context/UserContext';
import { LiquidSuccessModal } from '../../components/modals/LiquidSuccessModal';
import { timeService } from '../../utils/UnifiedTimeService';
import { ActionButtonGroup } from '../../components/activity/ActionButtonGroup';
import { AttendeesList } from '../../components/activity/AttendeesList';
import { LocationCard } from '../../components/activity/LocationCard';

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
  const [activity, setActivity] = useState(route.params?.activity || {}); // ✅ 将activity转为状态以支持动态更新
  const [showCheckinSuccessModal, setShowCheckinSuccessModal] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({ title: '', message: '' });

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


  // 检查活动是否已结束的辅助函数
  const isActivityEnded = () => {
    try {
      const now = new Date();
      // 使用统一时间服务解析活动结束时间
      const endTimeStr = activity.endDate
        ? `${activity.endDate} 23:59:59`
        : `${activity.date} ${activity.time || '00:00:00'}`;

      const activityEnd = timeService.parseServerTime(endTimeStr);
      if (!activityEnd) {
        console.warn('无法解析活动结束时间:', endTimeStr);
        return false;
      }

      return activityEnd.getTime() < now.getTime();
    } catch (error) {
      console.warn('检查活动结束时间失败:', error);
      return false; // 默认认为未结束，保持功能可用
    }
  };

  // 处理活动报名
  const handleRegister = async () => {
    if (loading) return;

    // 检查活动是否已结束
    if (isActivityEnded()) {
      setErrorModalData({
        title: t('activityDetail.activity_ended') || '活动已结束',
        message: t('activityDetail.cannot_register_ended_activity') || '已结束的活动无法报名'
      });
      setShowErrorModal(true);
      return;
    }

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
                setErrorModalData({
                  title: t('activityDetail.checkin_failed') || '签到失败',
                  message: '用户身份验证失败，请重新登录'
                });
                setShowErrorModal(true);
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
                setErrorModalData({
                  title: t('activityDetail.checkin_failed') || '签到失败',
                  message: '参数解析失败，请重试'
                });
                setShowErrorModal(true);
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

                // 显示签到成功弹窗
                setShowCheckinSuccessModal(true);

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

  // ✅ 监听活动状态变化事件 - 立即更新机制
  useEffect(() => {
    const registrationListener = DeviceEventEmitter.addListener('activityRegistrationChanged', (data: { activityId: string; action: string }) => {
      if (data.activityId === activity.id) {
        console.log('📋 [ActivityDetail] 收到活动状态变化事件:', {
          activityId: data.activityId,
          action: data.action,
          currentRegisteredCount: activity.registeredCount,
          currentAttendees: activity.attendees
        });

        // ✅ 根据不同的操作类型更新状态
        switch (data.action) {
          case 'register':
            setRegistrationStatus('registered');
            setIsRegistered(true);
            // 更新报名人数
            setActivity(prev => {
              const newRegisteredCount = (prev.registeredCount || 0) + 1;
              const newAttendees = (prev.attendees || 0) + 1;
              console.log('📈 [ActivityDetail] 报名成功，更新人数:', {
                原始registeredCount: prev.registeredCount,
                新registeredCount: newRegisteredCount
              });
              return {
                ...prev,
                registeredCount: newRegisteredCount,
                attendees: newAttendees
              };
            });
            break;

          case 'cancel_registration':
            setRegistrationStatus('upcoming');
            setIsRegistered(false);
            // 更新报名人数（减少）
            setActivity(prev => {
              const newRegisteredCount = Math.max((prev.registeredCount || 0) - 1, 0);
              const newAttendees = Math.max((prev.attendees || 0) - 1, 0);
              console.log('📉 [ActivityDetail] 取消报名，更新人数:', {
                原始registeredCount: prev.registeredCount,
                新registeredCount: newRegisteredCount
              });
              return {
                ...prev,
                registeredCount: newRegisteredCount,
                attendees: newAttendees
              };
            });
            break;

          case 'checkin_success':
            setRegistrationStatus('checked_in');
            setIsRegistered(true);
            console.log('✅ [ActivityDetail] 签到成功，更新状态为已签到');
            break;

          default:
            console.log('🔍 [ActivityDetail] 未知的活动状态变化类型:', data.action);
        }

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

  // ✅ API数据刷新函数 - 获取最新的活动信息和状态
  const refreshActivityFromAPI = async () => {
    try {
      const userId = user?.id || user?.userId;
      const parsedActivityId = parseInt(String(activity.id));

      if (isNaN(parsedActivityId)) {
        console.warn('⚠️ [refreshActivityFromAPI] 活动ID解析失败');
        return;
      }

      console.log('🔍 [refreshActivityFromAPI] 获取最新活动数据:', {
        activityId: parsedActivityId,
        userId: userId || '访客模式'
      });

      // 🔄 获取最新的活动列表数据（包含时间更新）
      const listResponse = await pomeloXAPI.getActivityList({
        pageNum: 1,
        pageSize: 20,
        userId: userId ? parseInt(String(userId)) : undefined,
      });

      if (listResponse.code === 200 && listResponse.data?.rows) {
        // 从列表中找到当前活动
        const updatedActivityData = listResponse.data.rows.find((a: any) => a.id === parsedActivityId);

        if (updatedActivityData) {
          // 使用适配器重新解析（会重新解析时间）
          const { adaptActivity, clearTimeParseCache } = await import('../../utils/activityAdapter');

          // 清除时间缓存确保获取最新时间
          clearTimeParseCache();

          const freshActivity = adaptActivity(updatedActivityData, i18n.language === 'zh-CN' ? 'zh' : 'en');

          console.log('✅ [refreshActivityFromAPI] 活动数据已更新:', {
            activityId: parsedActivityId,
            oldDate: activity.date,
            oldEndDate: activity.endDate,
            newDate: freshActivity.date,
            newEndDate: freshActivity.endDate,
            dateChanged: activity.date !== freshActivity.date || activity.endDate !== freshActivity.endDate
          });

          // 更新activity状态
          setActivity(freshActivity);

          // 更新报名状态
          const newStatus = freshActivity.status as 'upcoming' | 'registered' | 'checked_in';
          setRegistrationStatus(newStatus);
          setIsRegistered(newStatus !== 'upcoming');
        } else {
          console.warn('⚠️ [refreshActivityFromAPI] 列表中未找到该活动');
        }
      }

      // 🔄 如果用户已登录，额外获取精确的报名状态
      if (userId) {
        const parsedUserId = parseInt(String(userId));
        if (!isNaN(parsedUserId)) {
          const statusResponse = await pomeloXAPI.getSignInfo(parsedActivityId, parsedUserId);

          if (statusResponse.code === 200) {
            const newStatus = statusResponse.data === -1 ? 'registered' :
              statusResponse.data === 1 ? 'checked_in' : 'upcoming';

            console.log('📊 [refreshActivityFromAPI] 报名状态验证:', {
              signInfo: statusResponse.data,
              finalStatus: newStatus
            });

            setRegistrationStatus(newStatus);
            setIsRegistered(newStatus !== 'upcoming');
          }
        }
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




  // 格式化时间为12小时制
  const formatTime = (timeString: string) => {
    // 解析时间字符串
    const date = timeService.parseServerTime(`2025-01-01 ${timeString}`);
    if (!date) {
      // 如果解析失败，使用原始逻辑
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }

    // 使用统一时间服务格式化，但只显示时间部分
    return timeService.formatForDisplay(date, { showTime: true, showDate: false });
  };

  // Luma风格日期格式化: "Sun, 29 Jun, 11.00 AM - 12.00 PM"
  const formatLumaDateTime = () => {
    try {
      const startDate = new Date(activity.date);
      const endDate = activity.endDate ? new Date(activity.endDate) : startDate;

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const weekday = weekdays[startDate.getDay()];
      const day = startDate.getDate();
      const month = months[startDate.getMonth()];

      // 格式化时间部分
      const formatTimeStr = (timeStr: string) => {
        if (!timeStr || timeStr === '00:00') return '';
        const [hours, minutes] = timeStr.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}.${minutes} ${ampm}`;
      };

      const timeStr = formatTimeStr(activity.time);

      // 如果有结束日期且不同于开始日期
      if (activity.endDate && activity.endDate !== activity.date) {
        const endDay = endDate.getDate();
        const endMonth = months[endDate.getMonth()];
        return `${weekday}, ${day} ${month} - ${endDay} ${endMonth}${timeStr ? ', ' + timeStr : ''}`;
      }

      return `${weekday}, ${day} ${month}${timeStr ? ', ' + timeStr : ''}`;
    } catch (error) {
      console.warn('Date format error:', error);
      return `${activity.date}${activity.time ? ' ' + activity.time : ''}`;
    }
  };

  // 活动价格数据（从后端获取）
  const priceData = {
    isFree: !activity.price || activity.price === 0,
    price: activity.price || 0,
  };

  return (
    <>
      <ImageBackground
        source={{ uri: activity.image }}
        style={styles.backgroundImage}
        blurRadius={20}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.45)', 'rgba(0, 0, 0, 0.65)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.container}>
            {/* 固定在顶部的返回按钮 */}
            <View style={[styles.fixedHeader, { top: insets.top }]}>
              <TouchableOpacity
                style={styles.fixedBackButton}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: insets.top + 60, // 留出返回按钮空间
                paddingBottom: 40,
              }}
            >
              {/* 封面图白色卡片 */}
              <View style={styles.coverCardContainer}>
                <View style={styles.coverCard}>
                  <Image
                    source={{ uri: activity.image }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />

                  {/* 价格/免费标签 */}
                  <View style={styles.priceTagContainer}>
                    {priceData.isFree ? (
                      <View style={styles.freeTag}>
                        <Text style={styles.freeTagText}>
                          {t('activityDetail.free') || 'Free'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.paidTag}>
                        <Text style={styles.paidTagText}>
                          ${priceData.price}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* 活动标题 */}
              <View style={styles.titleContainer}>
                <Text style={styles.lumaTitle}>{activity.title}</Text>
              </View>

              {/* Luma风格日期时间 */}
              <View style={styles.dateTimeContainer}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.lumaDateTime}>{formatLumaDateTime()}</Text>
              </View>

              {/* 操作按钮组 */}
              <ActionButtonGroup
                registrationStatus={registrationStatus}
                isActivityEnded={isActivityEnded()}
                loading={loading}
                onRegister={handleRegister}
                onSignIn={handleSignIn}
                onInvite={() => {
                  // 分享邀请功能 - 未来实现
                  Alert.alert(
                    t('activityDetail.invite') || 'Invite',
                    t('activityDetail.invite_coming_soon') || 'Invite feature coming soon'
                  );
                }}
                onMore={() => {
                  // 更多选项功能 - 未来实现
                  Alert.alert(
                    t('activityDetail.more') || 'More',
                    t('activityDetail.more_options_coming_soon') || 'More options coming soon'
                  );
                }}
              />

              {/* 参与者列表 */}
              <AttendeesList count={activity.attendees || 0} />

              {/* 地址卡片 */}
              <LocationCard location={activity.location} />

              {/* 组织方信息卡片 */}
              <View style={styles.hostSection}>
                <Text style={styles.hostTitle}>
                  {t('activityDetail.host') || 'Host'}
                </Text>
                <View style={styles.hostCard}>
                  <View style={styles.hostAvatar}>
                    <Text style={styles.hostAvatarText}>
                      {activity.organizer?.name
                        ? activity.organizer.name.substring(0, 2).toUpperCase()
                        : 'ORG'}
                    </Text>
                  </View>
                  <View style={styles.hostInfo}>
                    <Text style={styles.hostName}>
                      {activity.organizer?.name || t('activityDetail.official_activity', '官方活动')}
                    </Text>
                    {activity.organizer?.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        <Text style={styles.verifiedText}>
                          {t('activityDetail.verified') || 'Verified'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* 活动详情 */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>
                  {t('activityDetail.about_event') || 'About Event'}
                </Text>
                <View style={styles.detailsCard}>
                  {activity.detail ? (
                    <RichTextRenderer
                      html={activity.detail}
                      contentWidth={screenWidth - theme.spacing[4] * 4}
                    />
                  ) : (
                    <Text style={styles.detailsPlaceholder}>
                      {t('activityDetail.no_details')}
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </LinearGradient>
      </ImageBackground>

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
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 封面图卡片
  coverCardContainer: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  coverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.md,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 220,
  },
  priceTagContainer: {
    position: 'absolute',
    top: theme.spacing[3],
    right: theme.spacing[3],
  },
  freeTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
  },
  freeTagText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  paidTag: {
    backgroundColor: '#FFA500',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
  },
  paidTagText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
  // 标题区域
  titleContainer: {
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  lumaTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    lineHeight: theme.typography.fontSize['3xl'] * 1.2,
  },
  // 日期时间
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
    gap: theme.spacing[2],
  },
  lumaDateTime: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: theme.typography.fontWeight.medium,
  },
  // Host区域
  hostSection: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  hostTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing[3],
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  hostAvatarText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing[1],
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  verifiedText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#4CAF50',
    fontWeight: theme.typography.fontWeight.medium,
  },
  // 活动详情
  detailsSection: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  detailsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing[3],
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailsPlaceholder: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // 旧样式保留（以防引用）
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