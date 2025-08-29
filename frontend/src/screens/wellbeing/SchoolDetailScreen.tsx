import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';
import { GlassCapsule } from '../../components/consulting/GlassCapsule';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { getVolunteerRecords, getVolunteerHours, volunteerSignRecord, getLastVolunteerRecord, getVolunteerStatus } from '../../services/volunteerAPI';
import { VolunteerStateService, VolunteerInfo } from '../../services/volunteerStateService';
import { getUserList } from '../../services/userStatsAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { useUser } from '../../context/UserContext';
import { SafeText } from '../../components/common/SafeText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentToken, getCurrentUserId } from '../../services/authAPI';
import { useGlobalTime, getAPITimeFormat, getFrontendTimeFormat } from '../../services/timeManager';

// 移除重复的持久化键定义 - 统一使用VolunteerStateService

export const SchoolDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const school = (route.params as any)?.school;
  const { permissions, user: userInfo } = useUser(); // 获取用户权限和用户信息
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVolunteer, setExpandedVolunteer] = useState<string | null>(null);
  const currentTime = useGlobalTime(); // 使用统一的时间管理
  const [activitiesCount, setActivitiesCount] = useState<number>(0);
  const [operationInProgress, setOperationInProgress] = useState<Record<string, boolean>>({});
  // 持久化签到时间状态（用于实时计时）
  const [persistedCheckins, setPersistedCheckins] = useState<Record<number, string>>({});
  // 操作防重复锁 - 增强版本
  const operationLockRef = React.useRef<Set<number>>(new Set());
  const pendingOperationsRef = React.useRef<Map<string, Promise<any>>>(new Map());
  // 缓存每个用户的最后一条记录（用于展示"上次签到/签出时间"）
  const lastRecordCacheRef = React.useRef<Map<number, any>>(new Map());

  // 移除独立计时器 - 现在使用全局时间管理

  // 初始化志愿者状态服务 - 强制清理状态
  React.useEffect(() => {
    VolunteerStateService.cleanup(); // 先清理
    VolunteerStateService.initialize(); // 再初始化
    console.log('🔄 [FORCE-CLEAR] 已重置志愿者状态服务');
    return () => VolunteerStateService.cleanup();
  }, []);

  // 加载持久化的签到时间 - 智能清理错误状态
  React.useEffect(() => {
    const loadAndCleanPersistedData = async () => {
      try {
        // 获取持久化数据
        const persistedData = await AsyncStorage.getItem('vg_volunteer_checkin_times');
        const parsed = persistedData ? JSON.parse(persistedData) : {};
        
        console.log('📱 [PERSISTED-DATA] 当前持久化数据:', parsed);
        
        // 🚨 SYSTEM FIX: 清理不一致的持久化数据
        // 如果有持久化数据，需要验证与后端状态是否一致
        const cleanedData: Record<number, string> = {};
        let hasInconsistentData = false;
        
        for (const [userIdStr, persistedTime] of Object.entries(parsed)) {
          if (typeof persistedTime === 'string' && persistedTime.length > 0) {
            hasInconsistentData = true;
            console.warn(`🚨 [CLEANUP] 发现用户${userIdStr}有持久化签到时间，需要验证后端状态`);
          }
        }
        
        if (hasInconsistentData) {
          console.log('🧹 [CLEANUP] 清理可能不一致的持久化数据');
          await AsyncStorage.removeItem('vg_volunteer_checkin_times');
          setPersistedCheckins({});
        } else {
          setPersistedCheckins(parsed);
        }
        
        console.log('✅ [PERSISTED-DATA] 持久化数据处理完成');
      } catch (error) {
        console.warn('📱 处理持久化数据失败:', error);
        setPersistedCheckins({});
      }
    };
    
    loadAndCleanPersistedData();
  }, []);


  // 展开卡片时，加载该用户的最后一条记录用于展示"上次签到/签出时间"
  // 🚨 FIX: 移除volunteers依赖，避免无限循环和竞态条件
  const volunteersRef = React.useRef(volunteers);
  volunteersRef.current = volunteers;
  
  React.useEffect(() => {
    (async () => {
      try {
        const vid = expandedVolunteer;
        if (!vid) return;
        const v = volunteersRef.current.find(x => x.id === vid);
        if (!v?.userId) return;
        if (lastRecordCacheRef.current.has(v.userId)) {
          console.log(`📋 [CACHE-HIT] 用户${v.name}记录已缓存，跳过重新获取`);
          return;
        }
        
        console.log(`🔍 [EXPAND-SYNC] 开始为用户${v.name}(${v.userId})获取最新记录`);
        const last = await getLastVolunteerRecord(v.userId);
        
        if (last?.code === 200 && last?.data) {
          lastRecordCacheRef.current.set(v.userId, last.data);
          
          const backendRecord = last.data;
          const currentStatus = getVolunteerStatus(backendRecord);
          
          console.log(`🔍 [EXPAND-SYNC] 用户${v.name}后端记录:`, {
            recordId: backendRecord.id,
            startTime: backendRecord.startTime,
            endTime: backendRecord.endTime,
            backendStatus: currentStatus,
            willUpdateState: true
          });
          
          // 🚨 CRITICAL: 只有当状态真的不一致时才更新
          const currentFrontendStatus = v.checkInStatus;
          const expectedStatus = currentStatus === 'signed_in' ? 'checked_in' : 'not_checked_in';
          
          if (currentFrontendStatus !== expectedStatus) {
            console.warn(`🚨 [STATE-MISMATCH] 用户${v.name}状态不一致: 前端=${currentFrontendStatus}, 后端=${currentStatus}`);
            
            // 批量状态更新，避免多次渲染
            setVolunteers(prev => prev.map(vol => {
              if (vol.userId !== v.userId) return vol;
              
              const updates: any = { checkInStatus: expectedStatus };
              
              if (currentStatus === 'signed_in') {
                updates.checkInTime = backendRecord.startTime;
                updates.checkOutTime = null;
                // 恢复持久化计时
                persistCheckinTime(v.userId, backendRecord.startTime).catch(console.warn);
              } else {
                updates.checkInTime = null;
                updates.checkOutTime = backendRecord.endTime;
                // 清除持久化计时
                persistCheckinTime(v.userId, null).catch(console.warn);
              }
              
              return { ...vol, ...updates };
            }));
            
            console.log(`✅ [EXPAND-SYNC] 用户${v.name}状态已同步: ${currentStatus}`);
          } else {
            console.log(`✅ [EXPAND-SYNC] 用户${v.name}状态已同步，无需更新`);
          }
        } else {
          console.log(`⚠️ [EXPAND-SYNC] 用户${v.name}获取后端记录失败，保持当前状态`);
        }
      } catch (e) {
        console.warn('展开同步失败:', e);
      }
    })();
  }, [expandedVolunteer]); // 只依赖expandedVolunteer，避免循环依赖

  // 使用统一的状态服务计算时长
  const getCurrentDurationMinutes = (vol: any) => {
    return VolunteerStateService.getCurrentDurationMinutes(vol as VolunteerInfo, currentTime);
  };

  const formatDuration = (minutes: number) => {
    return VolunteerStateService.formatDuration(minutes);
  };

  // 持久化签到时间管理
  const persistCheckinTime = async (userId: number, startTime: string | null) => {
    try {
      const newData = { ...persistedCheckins };
      if (startTime) {
        newData[userId] = startTime;
      } else {
        delete newData[userId];
      }
      setPersistedCheckins(newData);
      await AsyncStorage.setItem('vg_volunteer_checkin_times', JSON.stringify(newData));
      console.log('📱 持久化签到时间:', { userId, startTime, newData });
    } catch (error) {
      console.warn('📱 保存持久化数据失败:', error);
    }
  };
  
  // 加载志愿者数据和活动统计
  React.useEffect(() => {
    loadVolunteerData();
    loadSchoolActivitiesCount();
  }, [school]);

  const loadVolunteerData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 SchoolDetailScreen权限和数据加载:', {
        school: school?.nameCN || school?.name,
        schoolId: school?.id,
        deptId: school?.deptId,
        currentUser: {
          userName: userInfo?.userName,
          legalName: userInfo?.legalName,
          deptId: userInfo?.deptId
        },
        permissions: {
          level: permissions.getPermissionLevel(),
          dataScope: permissions.getDataScope(),
          canCheckInOut: permissions.canCheckInOut(),
          canViewAllSchools: permissions.canViewAllSchools(),
          hasVolunteerAccess: permissions.hasVolunteerManagementAccess()
        }
      });
      
      // 根据权限和学校ID过滤数据
      let filters = {};
      const dataScope = permissions.getDataScope();
      
      if (dataScope === 'school' && school?.deptId) {
        // 分管理员和内部员工：只能查看本校数据
        filters = { deptId: school.deptId };
        console.log('📊 使用学校数据过滤 (分管理员/内部员工):', filters);
        
        // 额外检查：确保当前用户有权限查看此学校
        if (userInfo?.deptId && userInfo.deptId !== school.deptId) {
          console.warn('⚠️ 权限不足：用户不能查看其他学校数据');
          setVolunteers([]);
          setLoading(false);
          return;
        }
      } else if (dataScope === 'all') {
        // 总管理员：可以查看所有数据
        console.log('📊 总管理员权限：获取全部学校数据');
      } else if (dataScope === 'self') {
        // Staff员工：只能查看自己的数据
        console.log('📊 Staff权限：只获取个人志愿者数据');
        // 为Staff用户设置特殊过滤：只显示自己
        filters = { userId: userInfo?.userId };
      } else {
        console.log('📊 无数据访问权限');
        setVolunteers([]);
        setLoading(false);
        return;
      }
      
      const [recordsResult, hoursResult, userListResult] = await Promise.all([
        getVolunteerRecords(filters),
        getVolunteerHours(filters),
        getUserList(),
      ]);

      console.log('📊 API调用结果:', {
        recordsResult: {
          code: recordsResult.code,
          msg: recordsResult.msg,
          rowCount: recordsResult.rows?.length || 0
        },
        hoursResult: {
          code: hoursResult.code,
          msg: hoursResult.msg,
          rowCount: hoursResult.rows?.length || 0
        },
        userListResult: {
          code: userListResult?.code,
          msg: userListResult?.msg,
          total: userListResult?.total || 0,
          dataLength: userListResult?.data?.length || 0
        },
      });

      // 新策略：基于用户列表获取该学校的管理员和内部员工，然后关联工时数据
      if (userListResult?.code === 200 && userListResult?.data) {
        console.log('📊 从用户列表获取学校管理员和内部员工');
        const allUsers = userListResult.data;
        const schoolStaff = [];
        
        // 根据权限过滤用户列表
        for (const user of allUsers) {
          // Staff权限：只显示自己
          if (permissions.getDataScope() === 'self' && user.userId !== userInfo?.userId) {
            continue;
          }
          
          // 分管理员权限：只显示本校用户
          if (permissions.getDataScope() === 'school' && user.deptId !== school?.deptId) {
            console.log(`⚠️ 用户${user.userName}(deptId:${user.deptId})不属于当前学校(deptId:${school?.deptId})，已过滤`);
            continue;
          }
          
          // 总管理员：显示所有用户（无额外过滤）
          
          try {
            // 获取完整的用户权限信息
            const fullUserInfo = await pomeloXAPI.getUserInfo(user.userId);
            if (fullUserInfo.code !== 200 || !fullUserInfo.data) {
              console.warn(`⚠️ 无法获取用户${user.userName}的完整信息`);
              continue;
            }
            
            const userData = fullUserInfo.data;
            
            // 检查用户是否为管理员或内部员工（基于完整权限信息）
            const isStaff = isUserStaffOrAdmin(userData);
            if (!isStaff) {
              console.log(`⚠️ 用户${user.userName}非管理员/内部员工角色，已过滤`, {
                admin: userData.admin,
                roles: userData.roles?.map((r: any) => r.roleKey),
                roleIds: userData.roleIds
              });
              continue;
            }
            
            // 查找该用户的工时记录
            const hourRecord = hoursResult?.rows?.find((h: any) => h.userId === user.userId);
            
            // 🚨 CRITICAL FIX: 优先使用实时记录，确保状态准确性
            let userRecord = null;
            
            // Step 1: 尝试从recordsResult获取（可能是最新的）
            const cachedRecord = recordsResult?.rows?.find((r: any) => r.userId === user.userId);
            
            // Step 2: 实时获取最新记录进行对比
            try {
              const realtimeRecord = await getLastVolunteerRecord(user.userId);
              if (realtimeRecord.code === 200 && realtimeRecord.data) {
                userRecord = realtimeRecord.data;
                
                // 检查是否有更新的记录
                const isNewerRecord = !cachedRecord || 
                  (userRecord.id > cachedRecord.id) || 
                  (userRecord.startTime > cachedRecord.startTime);
                
                if (isNewerRecord) {
                  console.log(`🔄 [REALTIME-NEWER] 用户${user.userName}使用更新的实时记录:`, {
                    realtimeId: userRecord.id,
                    cachedId: cachedRecord?.id || 'none',
                    startTime: userRecord.startTime,
                    endTime: userRecord.endTime
                  });
                } else {
                  console.log(`📋 [REALTIME-SAME] 用户${user.userName}实时记录与缓存一致`);
                }
              } else {
                // 实时获取失败，使用缓存
                userRecord = cachedRecord;
                console.log(`📋 [CACHE-FALLBACK] 用户${user.userName}使用缓存记录:`, !!userRecord);
              }
            } catch (e) {
              userRecord = cachedRecord;
              console.warn(`⚠️ 获取用户${user.userName}实时记录失败，使用缓存:`, e);
            }
            
            // 详细检测用户的签到记录状态
            console.log(`🔍 [DATA-CHECK] 用户${user.userName}的最终记录详情:`, {
              userId: user.userId,
              hasHourRecord: !!hourRecord,
              hasUserRecord: !!userRecord,
              isRealtimeData: !!userRecord && userRecord.id,
              userRecord: userRecord ? {
                startTime: userRecord.startTime,
                endTime: userRecord.endTime,
                recordId: userRecord.id
              } : null
            });
            
            // 🚨 CRITICAL FIX: 根据后端记录正确设置初始状态
            let initialCheckInStatus = 'not_checked_in';
            if (userRecord) {
              const recordStatus = getVolunteerStatus(userRecord);
              switch (recordStatus) {
                case 'signed_in':
                  initialCheckInStatus = 'checked_in';
                  break;
                case 'signed_out':
                  initialCheckInStatus = 'not_checked_in';
                  break;
                default:
                  initialCheckInStatus = 'not_checked_in';
                  break;
              }
            }
            
            console.log(`🔍 [INITIAL-STATE] 用户${user.userName}初始状态设置:`, {
              hasRecord: !!userRecord,
              recordStatus: userRecord ? getVolunteerStatus(userRecord) : 'no_record',
              finalStatus: initialCheckInStatus,
              startTime: userRecord?.startTime,
              endTime: userRecord?.endTime
            });
            
            const volunteer = {
              id: user.userId.toString(),
              name: userData.legalName || userData.nickName || userData.userName || '管理员',
              avatar: null,
              hours: hourRecord ? Math.max(0, Math.round(hourRecord.totalMinutes / 60)) : 0,
              level: getUserLevel(userData),
              major: getUserMajor(userData),
              checkInStatus: initialCheckInStatus, // 根据后端记录设置正确状态
              checkInTime: userRecord?.startTime,
              checkOutTime: userRecord?.endTime,
              totalHours: hourRecord ? Math.max(0, hourRecord.totalMinutes / 60) : 0,
              lastCheckInTime: userRecord?.startTime,
              lastCheckOutTime: userRecord?.endTime,
              userId: user.userId,
            };
            
            // 移除自动状态检查 - 强制保持未签到状态
            console.log('🔄 [FORCE-CLEAR] 用户状态强制设置为未签到:', volunteer.name);
            
            schoolStaff.push(volunteer);
            console.log(`✅ 管理员/内部员工${user.userName}已添加到${school?.deptName}`, {
              userId: user.userId,
              level: volunteer.level,
              major: volunteer.major,
              hasHours: !!hourRecord,
              totalHours: volunteer.totalHours,
              roles: userData.roles?.map((r: any) => r.roleKey)
            });
          } catch (error) {
            console.warn(`⚠️ 处理用户${user.userName}时出错:`, error);
          }
        }

        console.log('✅ 学校管理员和内部员工列表:', schoolStaff.length, '个');
        setVolunteers(schoolStaff);
      } else {
        console.log('⚠️ 无法获取用户列表，显示空列表');
        setVolunteers([]);
      }
    } catch (error) {
      console.error('加载志愿者数据失败:', error);
      // API失败时显示空列表，不使用mock数据
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  // 基于学校创建默认的志愿者显示数据
  const createDefaultVolunteersForSchool = (school: any) => {
    const schoolVolunteers = [];
    
    console.log('🏫 创建学校默认志愿者数据:', {
      school: school,
      deptId: school?.deptId,
      deptIdType: typeof school?.deptId,
      schoolName: school?.nameCN || school?.name,
      schoolId: school?.id
    });
    
    // 根据学校ID判断应该显示哪些用户 - 同时检查字符串和数字类型
    const deptId = school?.deptId;
    if (deptId === 223 || deptId === '223' || school?.id === '223') {
      // CU总部 - 显示admin和EB-1
      schoolVolunteers.push(
        {
          id: 'admin',
          name: '管理员',
          avatar: null,
          hours: 0,
          level: 'Admin',
          status: 'online',
          major: '管理',
          checkInStatus: 'not_checked_in',
          totalHours: 0,
          userId: 102,
        },
        {
          id: 'eb1',
          name: '内部员工',
          avatar: null,
          hours: 0,
          level: 'Staff',
          status: 'online',
          major: '运营',
          checkInStatus: 'not_checked_in',
          totalHours: 0,
          userId: 122,
        }
      );
    } else if (deptId === 211 || deptId === '211' || school?.id === '211') {
      // UCB - 显示admin-bracnh
      schoolVolunteers.push({
        id: 'admin-bracnh',
        name: '分管理员',
        avatar: null,
        hours: 0,
        level: 'Manager',
        status: 'online',
        major: '管理',
        checkInStatus: 'not_checked_in',
        totalHours: 0,
        userId: 121,
      });
    }
    // 其他学校暂无志愿者
    
    console.log(`🎯 学校${school?.nameCN || school?.name}最终志愿者数量:`, schoolVolunteers.length);
    return schoolVolunteers;
  };
  
  if (!school) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t('school.not_found_message')}</Text>
      </SafeAreaView>
    );
  }

  const logoSource = getSchoolLogo(school.id);

  // 处理志愿者签到
  const handleCheckIn = async (volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer?.userId) return;
    
    const operationKey = `checkin-${volunteer.userId}`;
    
    // 🚨 ENHANCED: 三重保护防止重复操作
    if (operationInProgress[volunteerId] || 
        operationLockRef.current.has(volunteer.userId) ||
        pendingOperationsRef.current.has(operationKey)) {
      console.warn('[DUPLICATE-CLICK] 签到操作进行中，忽略重复点击');
      return;
    }
    
    // 验证签到条件 - 先调试志愿者对象结构
    console.log('🔍 [CHECKIN-VALIDATION] 签到前志愿者对象结构:', {
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      userId: volunteer.userId,
      status: (volunteer as any).status,
      checkInStatus: (volunteer as any).checkInStatus,
      checkInTime: volunteer.checkInTime,
      checkOutTime: volunteer.checkOutTime
    });
    
    const validation = VolunteerStateService.validateCheckInConditions(volunteer as VolunteerInfo);
    if (!validation.isValid) {
      console.error('❌ [CHECKIN-VALIDATION] 验证失败:', validation.error);
      Alert.alert('签到失败', validation.error || '签到条件不满足');
      return;
    }
    
    console.log('✅ [CHECKIN-VALIDATION] 签到验证通过');
    
    // 设置操作状态和锁
    setOperationInProgress(prev => ({ ...prev, [volunteerId]: true }));
    operationLockRef.current.add(volunteer.userId);
    
    // 创建操作promise并缓存，防止重复执行
    const operationPromise = (async () => {
    try {
      const volunteer = volunteers.find(v => v.id === volunteerId);
      const volunteerName = volunteer?.name || volunteer?.userName || '志愿者';
      
      // 检查userId
      const userId = volunteer?.userId;
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        Alert.alert('错误', '无法识别用户身份，请重试或联系管理员');
        return;
      }
      
      // 获取当前操作用户信息
      const currentUser = userInfo;
      const operateUserId = currentUser?.userId;
      const operateLegalName = currentUser?.legalName;
      
      // 移除自动检测逻辑 - 每次签到都创建新记录
      console.log('[INFO] 开始新的签到操作，不检查历史记录');

      // 生成签到时间（使用统一时间服务）
      const checkInTime = getAPITimeFormat();

      // 调用后端API进行签到（严格按接口文档）
      const apiResult = await volunteerSignRecord(
        userId,
        1, // 1表示签到
        operateUserId,
        operateLegalName,
        checkInTime // startTime
      );

      if (apiResult && (apiResult.code === 200 || (apiResult as any).success === true)) {
        const newState = {
          checkInStatus: 'checked_in',
          checkInTime: getFrontendTimeFormat(),
          checkOutTime: null,
          lastCheckInTime: getFrontendTimeFormat(), // 更新上次签到时间
        };
        
        setVolunteers(prev => prev.map(v => 
          v.userId === userId
            ? { ...v, ...newState }
            : v
        ));

        // 持久化本次签到开始时间用于常驻计时
        await persistCheckinTime(userId, checkInTime);
        
        // 🔄 更新历史记录缓存 - 签到成功后创建新记录缓存
        const newSignInRecord = {
          id: null, // API返回的新记录ID暂时未知，下次获取时会更新
          userId,
          startTime: checkInTime,
          endTime: null,
          type: 1,
          legalName: volunteerName
        };
        lastRecordCacheRef.current.set(userId, newSignInRecord);
        console.log(`🔄 [CACHE-UPDATE] 签到成功后更新用户${userId}历史记录缓存，新的开始时间: ${checkInTime}`);
        
        console.log('[SUCCESS] 志愿者签到成功 (API):', volunteerName);
      } else {
        const errorMsg = apiResult?.msg || (apiResult as any)?.message || `code=${apiResult?.code ?? 'N/A'}`;
        console.error('[ERROR] 志愿者签到失败:', apiResult);
        
        // 🚨 SPECIAL HANDLING: "存在未签退记录"错误的特殊处理
        if (apiResult?.msg?.includes('存在未签退的记录') || apiResult?.msg?.includes('请先签退')) {
          console.log('[CONFLICT] 检测到状态冲突：后端已签到，前端显示未签到');
          
          // 自动修复：获取后端记录并同步状态
          try {
            const last = await getLastVolunteerRecord(userId);
            const lastData: any = last?.data;
            
            if (last?.code === 200 && lastData && lastData.startTime && !lastData.endTime) {
              // 后端确实处于签到状态，同步到前端
              setVolunteers(prev => prev.map(v => 
                v.userId === userId
                  ? { ...v, checkInStatus: 'checked_in', checkInTime: lastData.startTime, checkOutTime: null }
                  : v
              ));
              await persistCheckinTime(userId, lastData.startTime);
              console.log('[AUTO-SYNC] 已自动同步为签到状态，用户现在可以点击签退');
              
              Alert.alert('状态已同步', '检测到您已处于签到状态，现在可以进行签退操作');
            } else {
              Alert.alert('状态异常', '后端数据异常，请联系管理员');
            }
          } catch (e) {
            Alert.alert('状态同步失败', '无法同步后端状态，请重新加载页面');
          }
        } else {
          // 其他错误的正常处理
          try {
            const last = await getLastVolunteerRecord(userId);
            const lastData: any = last?.data;
            const isActuallyCheckedIn = last?.code === 200 && lastData && lastData.userId === userId && lastData.startTime && !lastData.endTime;
            if (isActuallyCheckedIn) {
              setVolunteers(prev => prev.map(v => 
                v.userId === userId
                  ? { ...v, checkInStatus: 'checked_in', checkInTime: lastData.startTime, checkOutTime: null }
                  : v
              ));
              await persistCheckinTime(userId, lastData.startTime);
              console.log('[RECOVERY] 后端返回失败但状态为已签到，已根据最后记录修复');
            } else {
              Alert.alert('签到失败', String(errorMsg || '未知错误'));
            }
          } catch (e) {
            Alert.alert('签到失败', String(errorMsg || '未知错误'));
          }
        }
      }
    } catch (error) {
      console.error('[ERROR] 志愿者签到失败:', error);
      Alert.alert('签到失败', '网络错误，请重试');
    } finally {
      setOperationInProgress(prev => {
        const newState = { ...prev };
        delete newState[volunteerId];
        return newState;
      });
      operationLockRef.current.delete(volunteer.userId);
      pendingOperationsRef.current.delete(operationKey);
    }
    })();
    
    // 缓存操作promise
    pendingOperationsRef.current.set(operationKey, operationPromise);
    await operationPromise;
  };

  // 处理志愿者签退
  const handleCheckOut = async (volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer?.userId) return;
    
    const operationKey = `checkout-${volunteer.userId}`;
    
    // 🚨 ENHANCED: 三重保护防止重复操作
    if (operationInProgress[volunteerId] || 
        operationLockRef.current.has(volunteer.userId) ||
        pendingOperationsRef.current.has(operationKey)) {
      console.warn('[DUPLICATE-CLICK] 签退操作进行中，忽略重复点击');
      return;
    }
    
    // 验证签退条件 - 先调试志愿者对象结构
    console.log('🔍 [CHECKOUT-VALIDATION] 签退前志愿者对象结构:', {
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      userId: volunteer.userId,
      status: (volunteer as any).status,
      checkInStatus: (volunteer as any).checkInStatus,
      checkInTime: volunteer.checkInTime,
      checkOutTime: volunteer.checkOutTime
    });
    
    const validation = VolunteerStateService.validateCheckOutConditions(volunteer as VolunteerInfo);
    if (!validation.isValid) {
      console.error('❌ [CHECKOUT-VALIDATION] 验证失败:', validation.error);
      Alert.alert('签退失败', validation.error || '签退条件不满足');
      return;
    }
    
    console.log('✅ [CHECKOUT-VALIDATION] 签退验证通过');
    
    // 设置操作状态和锁
    setOperationInProgress(prev => ({ ...prev, [volunteerId]: true }));
    operationLockRef.current.add(volunteer.userId);
    
    // 创建操作promise并缓存
    const operationPromise = (async () => {
    try {
      const volunteer = volunteers.find(v => v.id === volunteerId);
      const volunteerName = volunteer?.name || volunteer?.userName || '志愿者';
      
      // 检查userId
      const userId = volunteer?.userId;
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        Alert.alert('错误', '无法识别用户身份，请重试或联系管理员');
        return;
      }
      
      // 先获取最后的签到记录以获取记录ID
      const lastRecord = await getLastVolunteerRecord(userId);
      console.log(`🔍 [CHECKOUT-DEBUG] 用户${volunteerName}(${userId})的最后记录:`, {
        apiCode: lastRecord?.code,
        apiMsg: lastRecord?.msg,
        hasData: !!lastRecord?.data,
        recordDetails: lastRecord?.data ? {
          id: lastRecord.data.id,
          userId: lastRecord.data.userId,
          startTime: lastRecord.data.startTime,
          endTime: lastRecord.data.endTime,
          type: lastRecord.data.type,
          legalName: lastRecord.data.legalName
        } : null
      });
      
      if (lastRecord.code !== 200 || !lastRecord.data) {
        Alert.alert('签退失败', '没有找到对应的签到记录');
        return;
      }
      
      // 检查是否为有效的未签退记录
      if (!lastRecord.data.startTime || lastRecord.data.endTime) {
        Alert.alert('签退失败', '没有找到有效的签到记录，或该记录已签退');
        return;
      }
      
      const recordId = lastRecord.data.id;
      
      // 验证记录ID
      if (!recordId || typeof recordId !== 'number') {
        Alert.alert('签退失败', '无法找到有效的签到记录ID');
        return;
      }
      
      // 获取当前操作用户信息
      const currentUser = userInfo;
      const operateUserId = currentUser?.userId;
      const operateLegalName = currentUser?.legalName;
      
      // 生成签退时间（使用统一时间服务）
      const checkOutTime = getAPITimeFormat();

      console.log(`🔍 [CHECKOUT-API] 准备调用签退API:`, {
        targetUser: volunteerName,
        targetUserId: userId,
        recordId: recordId,
        recordIdType: typeof recordId,
        operateUserId: operateUserId,
        operateLegalName: operateLegalName,
        checkOutTime: checkOutTime,
        apiParams: {
          userId,
          type: 2,
          operateUserId,
          operateLegalName,
          startTime: undefined,
          endTime: checkOutTime,
          recordId
        }
      });

      // 调用后端API进行签退（严格按接口文档）
      const apiResult = await volunteerSignRecord(
        userId,
        2, // 2表示签退
        operateUserId,
        operateLegalName,
        undefined, // startTime - 签退不需要
        checkOutTime, // endTime
        recordId // 记录ID
      );
      
      console.log(`🔍 [CHECKOUT-API] 签退API响应:`, {
        user: volunteerName,
        result: apiResult,
        success: apiResult?.code === 200,
        errorMsg: apiResult?.msg || (apiResult as any)?.message
      });

      if (apiResult && (apiResult.code === 200 || (apiResult as any).success === true)) {
        // 签退成功：直接更新前端状态，不依赖lastRecordList验证
        const newState = {
          checkInStatus: 'not_checked_in',
          checkInTime: null,
          checkOutTime: getFrontendTimeFormat(),
          lastCheckOutTime: getFrontendTimeFormat(), // 更新上次签退时间
        };
        
        setVolunteers(prev => prev.map(v => 
          v.userId === userId
            ? { ...v, ...newState }
            : v
        ));

        // 清除持久化的签到时间
        await persistCheckinTime(userId, null);
        
        // 🔄 更新历史记录缓存 - 签退成功后更新记录缓存
        const cachedRecord = lastRecordCacheRef.current.get(userId);
        if (cachedRecord) {
          const updatedRecord = {
            ...cachedRecord,
            id: recordId, // 使用实际的记录ID
            endTime: checkOutTime,
            type: 2 // 标记为签退记录
          };
          lastRecordCacheRef.current.set(userId, updatedRecord);
          console.log(`🔄 [CACHE-UPDATE] 签退成功后更新用户${userId}历史记录缓存，结束时间: ${checkOutTime}`);
        }
        
        console.log('[SUCCESS] 志愿者签退成功，状态已更新:', volunteerName);
        
        // 异步验证后端状态（不影响UI更新）
        setTimeout(async () => {
          try {
            const verifyRecord = await getLastVolunteerRecord(userId);
            console.log(`🔍 [POST-CHECKOUT-VERIFY] 用户${volunteerName}签退后验证:`, {
              code: verifyRecord.code,
              hasEndTime: !!verifyRecord.data?.endTime,
              recordId: verifyRecord.data?.id
            });
          } catch (e) {
            console.warn('签退后状态验证失败（不影响功能）:', e);
          }
        }, 1000);
        
      } else {
        const errorMsg = apiResult?.msg || (apiResult as any)?.message || `code=${apiResult?.code ?? 'N/A'}`;
        console.error('[ERROR] 志愿者签退API调用失败:', apiResult);
        Alert.alert('签退失败', `操作失败：${errorMsg}`);
      }
    } catch (error) {
      console.error('[ERROR] 志愿者签退失败:', error);
      Alert.alert('签退失败', '网络错误，请重试');
    } finally {
      setOperationInProgress(prev => {
        const newState = { ...prev };
        delete newState[volunteerId];
        return newState;
      });
      operationLockRef.current.delete(volunteer.userId);
      pendingOperationsRef.current.delete(operationKey);
    }
    })();
    
    // 缓存操作promise
    pendingOperationsRef.current.set(operationKey, operationPromise);
    await operationPromise;
  };

  // 使用统一的时间格式化服务
  const formatChineseDateTime = (timeString: string) => {
    return VolunteerStateService.formatChineseDateTime(timeString);
  };

  const formatTime = (timeString: string) => {
    return formatChineseDateTime(timeString);
  };

  // 判断用户是否为管理员或内部员工（混合判断策略）
  const isUserStaffOrAdmin = (userData: any): boolean => {
    // 1. 检查admin字段
    if (userData?.admin === true) {
      return true;
    }
    
    // 2. 检查roles数组中的roleKey（优先使用）
    const roles = userData?.roles || [];
    if (Array.isArray(roles) && roles.length > 0) {
      const hasAdminRole = roles.some((role: any) => {
        const roleKey = role.roleKey;
        return roleKey === 'manage' ||        // 总管理员
               roleKey === 'part_manage' ||   // 分管理员  
               roleKey === 'staff' ||         // 内部员工
               roleKey === 'admin';           // 管理员
      });
      if (hasAdminRole) return true;
    }
    
    // 3. 检查roleIds数组
    const roleIds = userData?.roleIds || [];
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const hasAdminRoleId = roleIds.some((id: number) => [1, 2, 3, 4].includes(id));
      if (hasAdminRoleId) return true;
    }
    
    // 4. 兼容方案：基于用户名和法定姓名（用于权限未分配的管理员账户）
    const userName = userData?.userName?.toLowerCase() || '';
    const legalName = userData?.legalName || '';
    
    // 基于用户名模式
    if (userName.includes('admin') || userName.includes('eb-') || userName.includes('org') || 
        userName.includes('sms') || userName.includes('invite') || userName.includes('manager')) {
      return true;
    }
    
    // 基于法定姓名
    if (legalName.includes('管理员') || legalName.includes('内部员工') || legalName.includes('分管理员') ||
        legalName.includes('用户') && (legalName.includes('短信') || legalName.includes('组织') || legalName.includes('邀请'))) {
      return true;
    }
    
    return false;
  };

  // 根据用户权限字段确定级别（混合策略）
  const getUserLevel = (userData: any): string => {
    // 1. 基于roles数组中的roleKey（优先使用）
    const roles = userData?.roles || [];
    if (Array.isArray(roles) && roles.length > 0) {
      const roleKey = roles[0]?.roleKey;
      switch (roleKey) {
        case 'manage':
          return 'Super Admin';
        case 'part_manage':
          return 'Manager';
        case 'staff':
          return 'Staff';
        case 'admin':
          return 'Admin';
        default:
          return roles[0]?.roleName || 'Member';
      }
    }
    
    // 2. 检查admin字段
    if (userData?.admin === true) {
      return 'Super Admin';
    }
    
    // 3. 兼容方案：基于用户名（用于权限未分配的账户）
    const userName = userData?.userName?.toLowerCase() || '';
    if (userName.includes('admin')) {
      return userName === 'admin' ? 'Super Admin' : 'Manager';
    } else if (userName.includes('eb-')) {
      return 'Staff';
    } else if (userName.includes('org') || userName.includes('sms') || userName.includes('invite')) {
      return 'Staff';
    }
    
    return 'Member';
  };

  // 根据用户权限字段确定专业/职位（混合策略）
  const getUserMajor = (userData: any): string => {
    // 1. 基于roles数组中的roleName（优先使用）
    const roles = userData?.roles || [];
    if (Array.isArray(roles) && roles.length > 0) {
      return roles[0]?.roleName || '志愿服务';
    }
    
    // 2. 基于admin字段
    if (userData?.admin === true) {
      return '系统管理';
    }
    
    // 3. 兼容方案：基于用户名和法定姓名
    const userName = userData?.userName?.toLowerCase() || '';
    const legalName = userData?.legalName || '';
    
    if (userName === 'admin') return '总管理';
    if (userName.includes('admin')) return '分管理';
    if (userName.includes('eb-')) return '运营';
    if (userName.includes('org')) return '组织管理';
    if (userName.includes('sms')) return '通讯管理';
    if (userName.includes('invite')) return '邀请管理';
    
    // 4. 基于法定姓名
    if (legalName.includes('管理员')) return '管理';
    if (legalName.includes('短信')) return '通讯管理';
    if (legalName.includes('组织')) return '组织管理';
    if (legalName.includes('邀请')) return '邀请管理';
    
    // 5. 默认
    return userData?.dept?.deptName || '志愿服务';
  };



  // 加载学校活动数量
  const loadSchoolActivitiesCount = async () => {
    try {
      // 获取所有活动，然后统计该学校相关的活动数量
      const response = await pomeloXAPI.getActivityList({
        pageNum: 1,
        pageSize: 100, // 获取更多数据来统计
      });
      
      if (response.code === 200 && response.data) {
        // 由于API不支持按学校过滤，这里显示总活动数
        // TODO: 等后端支持按学校过滤后再优化
        setActivitiesCount(response.data.total);
      }
    } catch (error) {
      console.error('获取活动数量失败:', error);
      setActivitiesCount(0);
    }
  };

  const renderVolunteerItem = ({ item }: { item: any }) => {
    // 临时简化的渲染，避免Text渲染错误
    return (
      <View style={styles.volunteerItemContainer}>
        <TouchableOpacity 
          style={styles.volunteerItem}
          onPress={() => {
            console.log('[VOLUNTEER-CLICK] 点击志愿者:', String(item.name || '未知'));
            setExpandedVolunteer(expandedVolunteer === item.id ? null : item.id);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.volunteerContent}>
            {/* 简化的信息显示 */}
            <View style={styles.volunteerInfo}>
              <Text style={styles.volunteerName}>{String(item.name || '志愿者')}</Text>
              <Text style={styles.volunteerMajor}>{String(item.major || '专业信息')}</Text>
              <Text style={styles.volunteerHours}>
                {String(item.hours || 0)}小时 • {String(item.level || '志愿者')}
              </Text>
            </View>

            {/* 简化的状态 */}
            <View style={styles.rightSection}>
              <Text style={styles.statusText}>
                {String(item.status === 'online' ? 'Online' : 'Offline')}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 展开区域 - 显示详细信息和权限控制的签到按钮 */}
        {expandedVolunteer === item.id && (
          <View style={styles.expandedSection}>
            <BlurView intensity={Glass.blur} tint="light" style={styles.expandedBlur}>
              <LinearGradient 
                colors={[Glass.hairlineFrom, Glass.hairlineTo]}
                start={{ x: 0, y: 0 }} 
                end={{ x: 0, y: 1 }} 
                style={{ height: 1 }}
              />
              <LinearGradient 
                colors={[Glass.overlayTop, Glass.overlayBottom]}
                start={{ x: 0, y: 0 }} 
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.expandedContent}>
                {/* 完整签到状态信息 */}
                <View style={styles.checkInInfo}>
                  {/* 1. 签到状态 */}
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>{t('volunteer_status.check_in_time_label')}</Text>
                    <Text style={[
                      styles.statusValue,
                      { color: 
                        item.checkInStatus === 'checked_in' ? '#34D399' : 
                        item.checkInStatus === 'checked_out' ? '#9CA3AF' : 
                        '#F59E0B'
                      }
                    ]}>
                      {item.checkInStatus === 'checked_in' ? (t('volunteer_status.checked_in') || '已签到') : 
                       item.checkInStatus === 'checked_out' ? (t('volunteer_status.checked_out') || '已签退') : 
                       (t('volunteer_status.not_checked_in') || '未签到')}
                    </Text>
                  </View>

                  {/* 2. 本次工作时长 - 实时计时器（仅已签到状态显示） */}
                  {item.checkInStatus === 'checked_in' && !!(item.checkInTime || persistedCheckins[item.userId]) && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>本次工作时长:</Text>
                      <Text style={[styles.statusValue, styles.workingDurationValue]}>
                        {(() => {
                          try {
                            const checkInTime = new Date(item.checkInTime || persistedCheckins[item.userId]);
                            const now = currentTime;
                            const diffMs = now.getTime() - checkInTime.getTime();
                            
                            if (diffMs > 0) {
                              const hours = Math.floor(diffMs / (1000 * 60 * 60));
                              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
                              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            } else {
                              return '00:00:00';
                            }
                          } catch (error) {
                            return '--:--:--';
                          }
                        })()}
                      </Text>
                    </View>
                  )}

                  {/* 3. 总计时长 */}
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>{t('volunteer_status.total_duration_label')}</Text>
                    <Text style={styles.statusValue}>
                      {`${Math.max(0, item.totalHours || 0).toFixed(1)}小时`}
                    </Text>
                  </View>

                  {/* 4. 今日签到时间（持久化计时回显） */}
                  {!!(item.checkInTime || persistedCheckins[item.userId]) && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.check_in_time_label')}</Text>
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.checkInTime || persistedCheckins[item.userId])}</Text>
                    </View>
                  )}

                  {/* 5. 今日签退时间 */}
                  {!!item.checkOutTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.check_out_time_label')}</Text>
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.checkOutTime)}</Text>
                    </View>
                  )}

                  {/* 6-7. 历史记录：上次签到/签退（来自lastRecord缓存） */}
                  {(() => {
                    const last: any = lastRecordCacheRef.current.get(item.userId);
                    if (!last) return null;
                    return (
                      <>
                        {last.startTime && (
                          <View style={styles.statusRow}>
                            <Text style={[styles.statusLabel, { color: '#666' }]}>上次签到</Text>
                            <Text style={[styles.statusValue, { color: '#666' }]}>{formatChineseDateTime(last.startTime)}</Text>
                          </View>
                        )}
                        {last.endTime && (
                          <View style={styles.statusRow}>
                            <Text style={[styles.statusLabel, { color: '#666' }]}>上次签退</Text>
                            <Text style={[styles.statusValue, { color: '#666' }]}>{formatChineseDateTime(last.endTime)}</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>

                {/* 签到签退按钮 - 根据权限显示 */}
                <View style={styles.actionButtons}>
                  {/* 权限检查：只有管理员才能操作签到，且不能给自己操作 */}
                  {permissions.canCheckInOut() && item?.userId !== userInfo?.userId && (
                    <>
                      {(item?.checkInStatus === 'not_checked_in' || item?.checkInStatus === 'checked_out') && (
                        <TouchableOpacity 
                          style={[
                            styles.actionButton, 
                            styles.checkInBtn,
                            operationInProgress[item?.id] && styles.disabledButton
                          ]}
                          onPress={() => handleCheckIn(item?.id)}
                          disabled={operationInProgress[item?.id]}
                        >
                          {operationInProgress[item?.id] ? (
                            <Text style={styles.actionButtonText}>签到中...</Text>
                          ) : (
                            <Text style={styles.actionButtonText}>
                              {t('volunteer_status.check_in_button') || '签到'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                      
                      {item?.checkInStatus === 'checked_in' && (
                        <TouchableOpacity 
                          style={[
                            styles.actionButton, 
                            styles.checkOutBtn,
                            operationInProgress[item?.id] && styles.disabledButton
                          ]}
                          onPress={() => handleCheckOut(item?.id)}
                          disabled={operationInProgress[item?.id]}
                        >
                          {operationInProgress[item?.id] ? (
                            <Text style={styles.actionButtonText}>签退中...</Text>
                          ) : (
                            <Text style={styles.actionButtonText}>
                              {t('volunteer_status.check_out_button') || '签退'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                  
                  {/* 权限提示信息 */}
                  {(!permissions.canCheckInOut() || item?.userId === userInfo?.userId) && (
                    <View style={styles.noPermissionHint}>
                      <Text style={styles.hintText}>
                        {item?.userId === userInfo?.userId ? 
                          '不能给自己签到' : 
                          permissions.isStaff() ? 
                            '内部员工仅可查看，无签到权限' : 
                            '仅查看模式'
                        }
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </BlurView>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 背景渐变 */}
      <LinearGradient
        colors={[Glass.pageBgTop, Glass.pageBgBottom, '#F8F9FA', '#F1F3F4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.7, 1]}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Glass.textMain} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{t('school.volunteer_details_title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 学校信息卡片 */}
        <View style={styles.schoolCard}>
          <BlurView intensity={Glass.blur} tint="light" style={styles.schoolCardBlur}>
            <LinearGradient 
              colors={[Glass.hairlineFrom, Glass.hairlineTo]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 0, y: 1 }} 
              style={{ height: 1 }}
            />
            <LinearGradient 
              colors={[Glass.overlayTop, Glass.overlayBottom]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.schoolInfo}>
              {/* 校徽 */}
              <View style={styles.schoolLogo}>
                {logoSource ? (
                  <Image 
                    source={logoSource}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.logoText}>{school.shortName}</Text>
                )}
              </View>

              <View style={styles.schoolTextInfo}>
                <Text style={styles.schoolNameCN}>{school.nameCN}</Text>
                <Text style={styles.schoolNameEN}>{school.nameEN}</Text>
                <Text style={styles.schoolLocation}>{school.city}, {school.state}</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* 统计信息 */}
        <View style={styles.statsSection}>
          <GlassCapsule
            items={[
              { value: volunteers.length.toString(), label: t('school.volunteers_label') },
              { value: activitiesCount.toString(), label: t('school.activities_count_label') },
            ]}
          />
        </View>

        {/* 志愿者列表 */}
        <View style={styles.volunteersSection}>
          <Text style={styles.sectionTitle}>{t('school.active_volunteers_title')}</Text>
          <Text style={styles.sectionSubtitle}>{t('school.click_volunteer_instruction')}</Text>
          
          <FlatList
            data={volunteers}
            renderItem={renderVolunteerItem}
            keyExtractor={(item) => String(item.id || Math.random())}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={
              loading ? null : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>该学校暂无活跃志愿者</Text>
                  <Text style={styles.emptySubtext}>只有进行过志愿活动的用户才会显示在这里</Text>
                </View>
              )
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    paddingTop: 12,
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Glass.textMain,
  },

  // 学校信息卡片
  schoolCard: {
    marginHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 20,
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    ...Glass.shadows.sm.ios,
    elevation: Glass.shadows.sm.android.elevation,
  },

  schoolCardBlur: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },

  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  schoolLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  logoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: Glass.textMain,
  },

  schoolTextInfo: {
    flex: 1,
  },

  schoolNameCN: {
    fontSize: 18,
    fontWeight: '700',
    color: Glass.textMain,
    marginBottom: 4,
  },

  schoolNameEN: {
    fontSize: 14,
    fontWeight: '500',
    color: Glass.textWeak,
    marginBottom: 4,
  },

  schoolLocation: {
    fontSize: 12,
    color: Glass.textWeak,
  },

  // 统计区域
  statsSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 24,
  },

  // 志愿者区域
  volunteersSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 40,
  },

  sectionHeaderWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Glass.textMain,
    marginBottom: 8,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: Glass.textWeak,
    marginBottom: 16,
  },

  // 志愿者列表项
  volunteerItem: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  volunteerBlur: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },

  volunteerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  volunteerInfo: {
    flex: 1,
  },

  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 2,
  },

  volunteerMajor: {
    fontSize: 14,
    color: Glass.textWeak,
    marginBottom: 2,
  },

  volunteerHours: {
    fontSize: 12,
    color: Glass.textWeak,
  },

  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // 展开区域样式
  volunteerItemContainer: {
    marginBottom: 8,
  },

  expandedSection: {
    marginTop: 4,
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  expandedBlur: {
    borderRadius: Glass.radius.card,
    overflow: 'hidden',
  },

  expandedContent: {
    padding: 16,
  },

  checkInInfo: {
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  statusLabel: {
    fontSize: 14,
    color: Glass.textWeak,
    fontWeight: '500',
  },

  statusValue: {
    fontSize: 14,
    color: Glass.textMain,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    ...Glass.shadows.xs.ios,
    elevation: Glass.shadows.xs.android.elevation,
  },

  checkInBtn: {
    backgroundColor: '#34D399',
  },

  checkOutBtn: {
    backgroundColor: '#F59E0B',
  },

  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  noPermissionHint: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
  },

  hintText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  workingDurationValue: {
    fontSize: 14,
    color: '#059669', // 绿色突出实时计时
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // 等宽字体
  },

  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 16,
    color: Glass.textWeak,
    textAlign: 'center',
    marginBottom: 4,
  },

  emptySubtext: {
    fontSize: 14,
    color: Glass.textWeak,
    textAlign: 'center',
  },

});

export default SchoolDetailScreen;