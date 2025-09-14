import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { SafeText } from '../../components/common/SafeText';
import { SafeAlert } from '../../utils/SafeAlert';
import { 
  getVolunteerRecords, 
  getVolunteerHours, 
  volunteerSignRecord, 
  getLastVolunteerRecord,
  formatVolunteerHours,
  getVolunteerStatus,
  VolunteerRecord as APIVolunteerRecord,
  VolunteerHours
} from '../../services/volunteerAPI';
import { VolunteerStateService, VolunteerInfo } from '../../services/volunteerStateService';
import VolunteerHistoryBottomSheet from '../../components/volunteer/VolunteerHistoryBottomSheet';

// 前端展示用的志愿者记录类型
interface DisplayVolunteerRecord {
  id: string;
  phone: string;
  name: string;
  school: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
  duration?: number; // 分钟
  totalHours?: number; // 总志愿时长（小时）
  userId?: number; // 添加userId用于API调用
  lastCheckInTime?: string; // 上次签到时间
  lastCheckOutTime?: string; // 上次签出时间
  currentRecordId?: number; // 当前签到记录ID，用于签出
}

// 移除重复的持久化键定义 - 统一使用VolunteerStateService

// mockVolunteers removed - using real volunteer data from API

export const VolunteerCheckInScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, hasPermission, permissions, permissionLevel } = useUser();
  
  const [searchPhone, setSearchPhone] = useState('');
  const [currentUser, setCurrentUser] = useState<DisplayVolunteerRecord | null>(null);
  const [todayRecords, setTodayRecords] = useState<DisplayVolunteerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHours[]>([]);
  
  // Staff历史记录弹窗状态
  const [showStaffHistoryModal, setShowStaffHistoryModal] = useState(false);
  
  
  // 操作防重复锁
  const operationLockRef = useRef<Set<number>>(new Set());
  
  // 缓存历史记录（用于展示"上次签到/签出时间"）
  const lastRecordCacheRef = useRef<Map<number, APIVolunteerRecord>>(new Map());


  // 加载志愿者数据
  useEffect(() => {
    loadVolunteerData();
  }, []);

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 初始化志愿者状态服务
  useEffect(() => {
    VolunteerStateService.initialize();
    return () => VolunteerStateService.cleanup();
  }, []);

  // 当选择志愿者时，加载该用户的历史记录
  useEffect(() => {
    if (currentUser?.userId) {
      loadUserLastRecord(currentUser.userId);
    }
  }, [currentUser?.userId]);

  // 监控状态服务变化
  useEffect(() => {
    const handleStateChange = () => {
      // 当持久化数据变化时重新渲染
      setCurrentTime(new Date());
    };
    
    VolunteerStateService.addListener(handleStateChange);
    return () => VolunteerStateService.removeListener(handleStateChange);
  }, []);


  // 加载用户的最后一条记录（用于展示历史记录）
  const loadUserLastRecord = async (userId: number) => {
    try {
      if (lastRecordCacheRef.current.has(userId)) return; // 已缓存

      console.log('🔍 [DEBUG] 加载用户记录:', userId);
      
      const last = await getLastVolunteerRecord(userId);
      console.log('🔍 [DEBUG] API返回最后记录:', last);
      
      if (last?.code === 200 && last?.data) {
        const record = last.data;
        lastRecordCacheRef.current.set(userId, record);
        
        console.log('🔍 [DEBUG] 处理记录数据:', {
          startTime: record.startTime,
          endTime: record.endTime,
          isCurrentlyCheckedIn: !record.endTime
        });
        
        // 更新currentUser的历史记录信息
        if (currentUser && currentUser.userId === userId) {
          let updatedUser;
          
          if (record.startTime && !record.endTime) {
            // 用户当前已签到状态
            console.log('🔍 [DEBUG] 用户当前已签到，设置当前签到信息');
            updatedUser = {
              ...currentUser,
              status: 'checked_in' as const,
              checkInTime: record.startTime,
              currentRecordId: record.id,
              // 清除签出时间，因为用户重新签到了
              checkOutTime: undefined,
            };
            
            // 同步持久化时间
            await VolunteerStateService.persistCheckinTime(userId, record.startTime);
            console.log('🔍 [DEBUG] 已保存持久化时间:', record.startTime);
          } else {
            // 用户已签出状态
            console.log('🔍 [DEBUG] 用户已签出，设置历史记录');
            updatedUser = {
              ...currentUser,
              status: 'checked_out' as const,
              checkInTime: undefined, // 清除当前签到时间
              lastCheckInTime: record.startTime,
              lastCheckOutTime: record.endTime,
            };
            
            // 清除持久化时间（因为已签出）
            await VolunteerStateService.persistCheckinTime(userId, null);
          }
          
          setCurrentUser(updatedUser);
          console.log('🔍 [DEBUG] 更新用户状态:', updatedUser);
        }
      }
    } catch (e) {
      console.warn('加载最后签到记录失败:', e);
    }
  };

  // 已移除本地getCurrentDurationMinutes函数，统一使用VolunteerStateService.getCurrentDurationMinutes

  // 格式化时长显示（使用统一服务）
  const formatDuration = (minutes: number) => {
    return VolunteerStateService.formatDuration(minutes);
  };

  // 加载志愿者记录和工时数据
  const loadVolunteerData = async () => {
    try {
      setRecordsLoading(true);
      
      // 根据用户权限构建API过滤参数
      let recordsFilters = {};
      let hoursFilters = {};
      
      const dataScope = permissions.getDataScope();
      if (dataScope === 'school' && user?.deptId) {
        // 分管理员：只获取本校数据
        recordsFilters = { deptId: user.deptId };
        hoursFilters = { deptId: user.deptId };
      } else if (dataScope === 'self' && user?.userId) {
        // 内部员工：只获取个人数据
        recordsFilters = { userId: user.userId };
        hoursFilters = { userId: user.userId };
      }
      // 总管理员：无过滤参数，获取所有数据
      
      // 并行加载记录和工时数据
      const [recordsResult, hoursResult] = await Promise.all([
        getVolunteerRecords(recordsFilters),
        getVolunteerHours(hoursFilters)
      ]);

      // 处理打卡记录
      if (recordsResult.code === 200 && recordsResult.rows && recordsResult.rows.length > 0) {
        const displayRecords = await convertAPIRecordsToDisplay(recordsResult.rows);
        setTodayRecords(displayRecords);
      } else if (recordsResult.msg === '无权限') {
        // 如果无权限，使用Mock数据并显示提示
        console.warn('用户无志愿者管理权限，使用演示数据');
        setTodayRecords([]);
      } else {
        // 其他情况，使用Mock数据作为降级
        setTodayRecords([]);
      }

      // 处理工时数据
      if (hoursResult.code === 200 && hoursResult.rows && hoursResult.rows.length > 0) {
        setVolunteerHours(hoursResult.rows);
      }

    } catch (error) {
      console.error('加载志愿者数据失败:', error);
      // 如果API失败，使用Mock数据作为降级
      setTodayRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  // 将API记录转换为前端显示格式
  const convertAPIRecordsToDisplay = async (apiRecords: APIVolunteerRecord[]): Promise<DisplayVolunteerRecord[]> => {
    return apiRecords.map(record => {
      const apiStatus = getVolunteerStatus(record);
      // 将API状态转换为前端状态
      let displayStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
      switch (apiStatus) {
        case 'signed_in':
          displayStatus = 'checked_in';
          break;
        case 'signed_out':
          displayStatus = 'checked_out';
          break;
        default:
          displayStatus = 'not_checked_in';
          break;
      }
      
      return {
        id: record.id.toString(),
        phone: record.userId.toString(), // 暂时用userId，可能需要获取实际手机号
        name: record.legalName,
        school: '获取中...', // 需要根据用户信息获取学校
        checkInTime: record.startTime,
        checkOutTime: record.endTime,
        status: displayStatus,
        userId: record.userId,
        totalHours: getVolunteerTotalHours(record.userId)
      };
    });
  };

  // 获取用户总工时
  const getVolunteerTotalHours = (userId: number): number => {
    const userHours = volunteerHours.find(h => h.userId === userId);
    return userHours ? Math.round(userHours.totalMinutes / 60 * 10) / 10 : 0;
  };

  // 搜索志愿者
  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      SafeAlert.alert(t('volunteerCheckIn.alerts.hint'), t('volunteerCheckIn.alerts.phoneRequired'));
      return;
    }

    console.log('🔍 [DEBUG] 开始搜索志愿者:', searchPhone.trim());
    setLoading(true);
    
    try {
      // 在今日记录中搜索手机号对应的志愿者
      const foundUser = todayRecords.find(v => v.phone === searchPhone.trim());
      console.log('🔍 [DEBUG] 搜索结果:', foundUser);
      
      if (foundUser) {
        console.log('🔍 [DEBUG] 找到用户，获取最新签到状态');
        
        // 获取该用户的最新签到状态
        try {
          const lastRecord = await getLastVolunteerRecord(foundUser.userId!);
          console.log('🔍 [DEBUG] 最新记录:', lastRecord);
          
          if (lastRecord.code === 200 && lastRecord.data) {
            // 更新用户状态
            const apiStatus = getVolunteerStatus(lastRecord.data);
            let displayStatus: 'not_checked_in' | 'checked_in' | 'checked_out';
            switch (apiStatus) {
              case 'signed_in':
                displayStatus = 'checked_in';
                break;
              case 'signed_out':
                displayStatus = 'checked_out';
                break;
              default:
                displayStatus = 'not_checked_in';
                break;
            }
            
            console.log('🔍 [DEBUG] 状态转换:', { apiStatus, displayStatus });
            
            const updatedUser = {
              ...foundUser,
              status: displayStatus,
              checkInTime: lastRecord.data.startTime,
              checkOutTime: lastRecord.data.endTime,
              currentRecordId: (!lastRecord.data.endTime && lastRecord.data.startTime) ? lastRecord.data.id : undefined,
            };
            
            console.log('🔍 [DEBUG] 设置用户数据:', updatedUser);
            setCurrentUser(updatedUser);
            
            // 如果当前已签到，同步持久化时间
            if (displayStatus === 'checked_in' && lastRecord.data.startTime) {
              await persistCheckinTime(foundUser.userId!, lastRecord.data.startTime);
              console.log('🔍 [DEBUG] 已保存持久化时间');
            }
          } else {
            console.log('🔍 [DEBUG] 没有最新记录，使用缓存数据');
            setCurrentUser(foundUser);
          }
        } catch (error) {
          console.warn('获取最新记录失败，使用缓存数据:', error);
          setCurrentUser(foundUser);
        }
      } else {
        console.log('🔍 [DEBUG] 未找到用户');
        setCurrentUser(null);
        SafeAlert.alert(t('volunteerCheckIn.alerts.notFound'), t('volunteerCheckIn.alerts.userNotFound'));
      }
    } catch (error) {
      console.error('搜索志愿者失败:', error);
      SafeAlert.alert(t('common.error'), t('volunteer.search_failed'));
    } finally {
      setLoading(false);
    }
  };

  // 签到
  const handleCheckIn = async () => {
    if (!currentUser || !currentUser.userId) return;

    // 直接执行签到，移除Alert避免Text渲染错误
    console.log('🔄 执行签到:', currentUser.name);
    
    const executeCheckIn = async () => {
            try {
              setLoading(true);
              
              // 调用真实的签到API（带 startTime）
              const startTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
              
              // 🚨 必需参数：operateUserId和operateLegalName
              if (!user?.id || !user?.legalName) {
                throw new Error('操作用户信息缺失，无法执行签到');
              }
              
              const result = await volunteerSignRecord(
                currentUser.userId!, 
                1, // 签到
                user.id, // operateUserId - 必需
                user.legalName, // operateLegalName - 必需  
                startTime // startTime
              );
              
              if (result.code === 200) {
                const checkInTimeISO = new Date().toISOString();
                const updatedUser = {
                  ...currentUser,
                  status: 'checked_in' as const,
                  checkInTime: checkInTimeISO,
                };
                setCurrentUser(updatedUser);
                
                // 持久化签到时间
                await persistCheckinTime(currentUser.userId!, checkInTimeISO);
                
                // 更新记录列表
                setTodayRecords(prev => 
                  prev.map(v => v.id === currentUser.id ? updatedUser : v)
                );
                
                // 重新加载数据以获取最新状态
                await loadVolunteerData();
                
                // 显示签到成功提示
                SafeAlert.alert(
                  t('volunteerCheckIn.success.checkin_title') || '签到成功',
                  t('volunteerCheckIn.success.checkin_message') || `${currentUser.name} 签到成功`,
                  [{ text: t('common.confirm'), onPress: () => {} }]
                );
                
                console.log('✅ 签到成功:', currentUser.name);
              } else {
                console.error('❌ 签到失败:', result.msg);
              }
            } catch (error) {
              console.error('❌ 签到异常:', error);
            } finally {
              setLoading(false);
            }
    };
    
    // 立即执行签到
    executeCheckIn();
  };

  // 签出
  const handleCheckOut = async () => {
    if (!currentUser || !currentUser.userId) return;

    // 优先使用持久化时间，再使用当前签到时间
    const checkInTimeStr = currentUser.checkInTime || VolunteerStateService.getPersistedCheckinTime(currentUser.userId);
    if (!checkInTimeStr) {
      SafeAlert.alert(t('common.error'), '未找到签到时间记录');
      return;
    }

    const checkInTime = new Date(checkInTimeStr);
    const checkOutTime = new Date();
    
    // 验证时间有效性
    if (isNaN(checkInTime.getTime()) || isNaN(checkOutTime.getTime())) {
      SafeAlert.alert(t('common.error'), t('volunteerCheckIn.time.serviceDuration'));
      return;
    }
    
    const timeDiff = checkOutTime.getTime() - checkInTime.getTime();
    const duration = Math.max(0, Math.floor(timeDiff / (1000 * 60))); // 确保非负数
    
    // 验证会话时长（最大24小时）
    const MAX_SESSION_HOURS = 24;
    if (duration > MAX_SESSION_HOURS * 60) {
      SafeAlert.alert(t('common.warning'), `工作时长不能超过${MAX_SESSION_HOURS}小时，请联系管理员确认`);
      return;
    }

    // 直接执行签退，移除SafeAlert.alert避免Text渲染错误
    console.log('🔄 执行签退:', currentUser.name, `${Math.floor(duration / 60)}h${duration % 60}m`);
    
    const executeCheckOut = async () => {
            try {
              setLoading(true);
              
              // 调用真实的签退API（带 endTime 和 recordId）
              const endTime = checkOutTime.toISOString().replace('T', ' ').substring(0, 19);
              
              // 🚨 必需参数：operateUserId和operateLegalName
              if (!user?.id || !user?.legalName) {
                throw new Error('操作用户信息缺失，无法执行签退');
              }
              
              const result = await volunteerSignRecord(
                currentUser.userId!, 
                2, // 2表示签退
                user.id, // operateUserId - 必需
                user.legalName, // operateLegalName - 必需
                undefined, // startTime (签退时不需要)
                endTime, // endTime - 必需
                currentUser.currentRecordId // recordId - 必需
              ); 
              
              if (result.code === 200) {
                const updatedUser = {
                  ...currentUser,
                  status: 'checked_out' as const,
                  checkOutTime: checkOutTime.toISOString(),
                  duration,
                  totalHours: (currentUser.totalHours || 0) + (duration / 60),
                  lastCheckOutTime: checkOutTime.toISOString(),
                };
                setCurrentUser(updatedUser);
                
                // 清除持久化的签到时间
                await persistCheckinTime(currentUser.userId!, null);
                
                // 更新记录列表
                setTodayRecords(prev => 
                  prev.map(v => v.id === currentUser.id ? updatedUser : v)
                );
                
                // 重新加载数据以获取最新状态
                await loadVolunteerData();
                
                // 显示签退成功提示
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                const durationText = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
                
                SafeAlert.alert(
                  t('volunteerCheckIn.success.checkout_title') || '签退成功',
                  t('volunteerCheckIn.success.checkout_message') || `${currentUser.name} 签退成功，本次服务时长：${durationText}`,
                  [{ text: t('common.confirm'), onPress: () => {} }]
                );
                
                console.log('✅ 签退成功:', {
                  name: currentUser.name || '志愿者',
                  hours: Math.floor(duration / 60),
                  minutes: duration % 60
                });
              } else {
                console.error('❌ 签退失败:', result.msg);
              }
            } catch (error) {
              console.error('❌ 签退异常:', error);
            } finally {
              setLoading(false);
            }
    };
    
    // 立即执行签退
    executeCheckOut();
  };


  // 扫码功能
  const handleScanQR = () => {
    // 跳转到扫码页面或实现扫码逻辑
    SafeAlert.alert(t('volunteerCheckIn.alerts.scanFunction'), t('volunteerCheckIn.alerts.scanComingSoon'));
  };

  // 计算签到时长（使用统一服务）
  const getCheckInDuration = (vol: DisplayVolunteerRecord) => {
    const minutes = VolunteerStateService.getCurrentDurationMinutes(vol as VolunteerInfo, currentTime);
    return VolunteerStateService.formatDuration(minutes);
  };

  // 渲染记录项
  const renderRecord = ({ item }: { item: DisplayVolunteerRecord }) => {
    const getStatusColor = () => {
      switch (item.status) {
        case 'checked_in': return theme.colors.success;
        case 'checked_out': return theme.colors.primary;
        default: return theme.colors.text.secondary;
      }
    };

    const getStatusText = () => {
      switch (item.status) {
        case 'checked_in': return t('volunteerCheckIn.status.checkedIn');
        case 'checked_out': return t('volunteerCheckIn.status.checkedOut');
        default: return t('volunteerCheckIn.status.notCheckedIn');
      }
    };

    return (
      <TouchableOpacity 
        style={styles.recordItem}
        onPress={() => setCurrentUser(item)}
      >
        <View style={styles.recordContent}>
          <View style={styles.recordInfo}>
            <Text style={styles.recordName}>{String(item.name || '志愿者')}</Text>
            <Text style={styles.recordPhone}>{String(item.phone || '无手机号')}</Text>
            <Text style={styles.recordSchool}>{String(item.school || '学校信息')}</Text>
          </View>
          
          <View style={styles.recordStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {String(getStatusText() || '状态未知')}
            </Text>
            {item.status === 'checked_in' && (
              <Text style={styles.durationText}>
                {getCheckInDuration(item)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 权限检查 - 普通用户不能访问志愿者管理功能
  if (permissions.isRegularUser()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.noPermissionText}>
            {t('volunteerCheckIn.noPermission')}
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 内部员工专用：个人工时查看界面
  const renderStaffPersonalView = () => {
    const userHours = volunteerHours.find(h => h.userId === user?.userId);
    const userRecords = todayRecords.filter(r => r.userId === user?.userId);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('volunteerCheckIn.personalHours')}</Text>
        
        {/* 个人工时统计卡片 */}
        <View style={styles.personalStatsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="person-circle" size={32} color={theme.colors.primary} />
            <View style={styles.statsInfo}>
              <Text style={styles.statsName}>{user?.legalName || t('volunteerCheckIn.currentUser')}</Text>
              <Text style={styles.statsSchool}>{user?.dept?.deptName || t('profile.school_info', '学校信息')}</Text>
            </View>
          </View>
          
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('volunteerCheckIn.totalHours')}</Text>
              <Text style={styles.statValue}>
                {userHours && typeof userHours.totalMinutes === 'number' 
                  ? formatVolunteerHours(userHours.totalMinutes) 
                  : '0小时'}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('volunteerCheckIn.todayRecords')}</Text>
              <Text style={styles.statValue}>{userRecords.length} {t('volunteerCheckIn.records_unit', '条')}</Text>
            </View>
          </View>
          
          {/* Staff用户历史记录查询按钮 */}
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => setShowStaffHistoryModal(true)}
            disabled={loading}
          >
            <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.historyButtonText}>
              {t('wellbeing.volunteer.viewHistory')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* 个人打卡记录列表 */}
        {userRecords.length > 0 && (
          <View style={styles.personalRecordsSection}>
            <Text style={styles.sectionTitle}>{t('volunteerCheckIn.myRecords')}</Text>
            {userRecords.map((record, index) => (
              <View key={index} style={styles.personalRecordItem}>
                <View style={styles.recordTimeInfo}>
                  <Text style={styles.recordDate}>
                    {record.checkInTime ? new Date(record.checkInTime).toLocaleDateString() : '今日'}
                  </Text>
                  <Text style={styles.recordTime}>
                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '--'}
                    {' - '}
                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '进行中'}
                  </Text>
                </View>
                <View style={styles.recordDuration}>
                  <Text style={styles.durationText}>
                    {record.duration ? `${Math.floor(record.duration / 60)}h ${record.duration % 60}m` : '计时中...'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {/* 只读提示 */}
        <View style={styles.readOnlyNotice}>
          <Ionicons name="information-circle" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.readOnlyText}>
            {t('volunteerCheckIn.staffReadOnlyNotice')}
          </Text>
        </View>
      </View>
    );
  };

  // 如果是内部员工，显示个人界面
  if (permissions.isStaff()) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={['rgba(248, 250, 255, 0.95)', 'rgba(240, 247, 255, 0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>{t('volunteerCheckIn.personalDashboard')}</Text>
                <Text style={styles.headerSubtitle}>{t('volunteerCheckIn.personalDashboardDesc')}</Text>
              </View>
            </View>
            
            {/* 当前时间显示 */}
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.currentTime}>
                {currentTime.toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </Text>
            </View>
          </LinearGradient>

          {renderStaffPersonalView()}
        </ScrollView>
        
        {/* Staff用户历史记录弹窗 */}
        {showStaffHistoryModal && user?.userId && (
          <VolunteerHistoryBottomSheet
            visible={showStaffHistoryModal}
            onClose={() => setShowStaffHistoryModal(false)}
            userId={parseInt(user.userId)}
            userName={user.legalName || user.userName || t('volunteerCheckIn.currentUser')}
            userPermission="staff"
          />
        )}

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.95)', 'rgba(240, 247, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>{t('volunteer.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('volunteer.subtitle')}</Text>
            </View>
          </View>
          
          {/* 当前时间显示 */}
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.currentTime}>
              {currentTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Text>
          </View>
        </LinearGradient>

        {/* Search Section - 只有管理员能搜索其他人 */}
        {permissions.canCheckInOut() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {permissions.isAdmin() 
                ? t('volunteerCheckIn.searchVolunteer') 
                : t('volunteerCheckIn.searchSchoolVolunteer')
              }
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('volunteerCheckIn.searchPlaceholder')}
                value={searchPhone}
                onChangeText={setSearchPhone}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {/* Search Button - Shadow优化 */}
              <View style={styles.searchButtonShadowContainer}>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearch}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryPressed]}
                    style={styles.searchButtonGradient}
                  >
                    <Ionicons name="search" size={20} color="white" />
                    <Text style={styles.searchButtonText}>{t('volunteerCheckIn.search')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScanQR}
              >
                <Ionicons name="qr-code-outline" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* User Info and Actions */}
        {currentUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('volunteerCheckIn.userInfo')}</Text>
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <SafeText style={styles.userName} fallback="志愿者">{currentUser.name}</SafeText>
                  <View style={[
                    styles.userStatus,
                    { backgroundColor: currentUser.status === 'checked_in' ? theme.colors.success : theme.colors.background.secondary }
                  ]}>
                    <Text style={[
                      styles.userStatusText,
                      { color: currentUser.status === 'checked_in' ? 'white' : theme.colors.text.secondary }
                    ]}>
                      {currentUser.status === 'checked_in' ? t('volunteerCheckIn.status.working') : 
                       currentUser.status === 'checked_out' ? t('volunteerCheckIn.status.completed') : t('volunteerCheckIn.status.waiting')}
                    </Text>
                  </View>
                </View>
                
                <SafeText style={styles.userPhone} fallback="无手机号">{currentUser.phone}</SafeText>
                <SafeText style={styles.userSchool} fallback="学校信息">{currentUser.school}</SafeText>
                
                {/* 时间信息 */}
                <View style={styles.timeInfo}>
                  {currentUser.checkInTime && (
                    <View style={styles.timeItem}>
                      <Ionicons name="log-in-outline" size={16} color={theme.colors.success} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.checkInTime')}</Text>
                      <SafeText style={styles.timeValue} fallback="--:--">
                        {new Date(currentUser.checkInTime).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </SafeText>
                    </View>
                  )}
                  
                  {currentUser.checkOutTime && (
                    <View style={styles.timeItem}>
                      <Ionicons name="log-out-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.checkOutTime')}</Text>
                      <SafeText style={styles.timeValue} fallback="--:--">
                        {new Date(currentUser.checkOutTime).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </SafeText>
                    </View>
                  )}
                  
                  
                  {currentUser.status === 'checked_in' && (
                    <View style={styles.timeItem}>
                      <Ionicons name="timer-outline" size={16} color={theme.colors.warning} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.worked')}</Text>
                      <SafeText style={styles.timeValue} fallback="0小时0分钟">
                        {getCheckInDuration(currentUser)}
                      </SafeText>
                    </View>
                  )}
                  
                  
                  {/* 上次签到时间 */}
                  {currentUser.lastCheckInTime && (
                    <View style={styles.timeItem}>
                      <Ionicons name="log-in" size={16} color={theme.colors.primary} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.lastCheckIn')}</Text>
                      <SafeText style={styles.timeValue} fallback="--:--">
                        {new Date(currentUser.lastCheckInTime).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </SafeText>
                    </View>
                  )}
                  
                  {/* 上次签出时间 */}
                  {currentUser.lastCheckOutTime && (
                    <View style={styles.timeItem}>
                      <Ionicons name="log-out" size={16} color={theme.colors.success} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.lastCheckOut')}</Text>
                      <SafeText style={styles.timeValue} fallback="--:--">
                        {new Date(currentUser.lastCheckOutTime).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </SafeText>
                    </View>
                  )}
                  
                  <View style={styles.timeItem}>
                    <Ionicons name="trophy-outline" size={16} color={theme.colors.warning} />
                    <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.totalHours')}</Text>
                    <Text style={styles.timeValue}>
                      {currentUser.totalHours?.toFixed(1) || 0} {t('volunteerCheckIn.time.hours')}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Action Buttons - 只有管理员可以操作 */}
              {permissions.canCheckInOut() && (
                <View style={styles.actionButtons}>
                  {currentUser.status === 'not_checked_in' && (
                    <View style={styles.actionButtonShadowContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCheckIn}
                      >
                        <LinearGradient
                          colors={[theme.colors.primary, theme.colors.primaryPressed]}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="log-in-outline" size={20} color="white" />
                          <Text style={styles.actionButtonText}>{t('volunteerCheckIn.checkIn')}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {currentUser.status === 'checked_in' && (
                    <View style={styles.actionButtonShadowContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCheckOut}
                      >
                        <LinearGradient
                          colors={[theme.colors.success, '#10B981']}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="log-out-outline" size={20} color="white" />
                          <Text style={styles.actionButtonText}>{t('volunteerCheckIn.checkOut')}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Today's Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('volunteerCheckIn.todayRecords')}</Text>
          <FlatList
            data={todayRecords}
            renderItem={renderRecord}
            keyExtractor={(item) => item.id}
            style={styles.recordsList}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  noPermissionText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[6],
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  backButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248, 250, 255, 0.5)',
  },
  headerContent: {
    marginBottom: theme.spacing[3],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[3],
  },
  currentTime: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },

  // Sections
  section: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  // Search Button Shadow容器 - 解决LinearGradient阴影冲突
  searchButtonShadowContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary, // solid background用于阴影优化
    ...theme.shadows.button,
  },
  
  searchButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    // 移除阴影，由searchButtonShadowContainer处理
  },
  
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  searchButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing[1],
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#E5E7EB', // 灰色背景
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB', // 灰色边框
    ...theme.shadows.xs,
  },

  // User Card
  userCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.md,
  },
  userInfo: {
    marginBottom: theme.spacing[4],
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  userStatus: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.badge,
  },
  userStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  userPhone: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  userSchool: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing[3],
  },
  timeInfo: {
    gap: theme.spacing[2],
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[1],
  },
  timeLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
    flex: 1,
  },
  timeValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  // Action Button Shadow容器 - 解决LinearGradient阴影冲突
  actionButtonShadowContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary, // solid background用于阴影优化
    ...theme.shadows.button,
  },
  
  actionButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    // 移除阴影，由actionButtonShadowContainer处理
  },
  
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing[2],
  },

  // Records
  recordsList: {
    maxHeight: 400,
  },
  recordItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.xs,
  },
  recordContent: {
    flexDirection: 'row',
    padding: theme.spacing[3],
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  recordPhone: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  recordSchool: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  recordStatus: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing[1],
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  durationText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  
  // Staff Personal View Styles
  personalStatsCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.md,
    marginBottom: theme.spacing[4],
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  statsInfo: {
    marginLeft: theme.spacing[3],
    flex: 1,
  },
  statsName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  statsSchool: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  statsContent: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  personalRecordsSection: {
    marginTop: theme.spacing[4],
  },
  personalRecordItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  recordTimeInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  recordTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  recordDuration: {
    alignItems: 'flex-end',
  },
  readOnlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing[4],
  },
  readOnlyText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
    flex: 1,
  },
  
  // 历史记录按钮样式
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    backgroundColor: theme.colors.background.primary,
  },
  historyButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
    marginLeft: 8,
    flex: 1,
  },
});