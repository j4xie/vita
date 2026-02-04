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
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';
import { GlassCapsule } from '../../components/consulting/GlassCapsule';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { getVolunteerRecords, getVolunteerHours, performVolunteerCheckIn, performVolunteerCheckOut, getLastVolunteerRecord, getVolunteerStatus, forceResetVolunteerStatus } from '../../services/volunteerAPI';
import { VolunteerStateService, VolunteerInfo } from '../../services/volunteerStateService';
import { timeService } from '../../utils/UnifiedTimeService';
import { getUserList } from '../../services/userStatsAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { positionService } from '../../services/positionService';
import { getUserPermissionLevel } from '../../types/userPermissions';
import { getApiUrl } from '../../utils/environment';
import { useUser } from '../../context/UserContext';
import { useVolunteerContext } from '../../context/VolunteerContext';
import { 
  VolunteerRecord, 
  VolunteerHours, 
  UserData, 
  VolunteerStatusUpdate,
  APIResponse 
} from '../../types/volunteer';
import { getCurrentToken } from '../../services/authAPI';
import { apiCache, CacheTTL } from '../../services/apiCache';
import { i18n } from '../../utils/i18n';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { formatVolunteerTime as formatChineseDateTime } from '../../utils/volunteerTimeFormatter';
import VolunteerHistoryBottomSheet from '../../components/volunteer/VolunteerHistoryBottomSheet';
// 移除SearchBar导入，改为使用内置搜索组件


// 移除重复的持久化键定义 - 统一使用VolunteerStateService

export const VolunteerSchoolDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  
  // 🔧 支持两种参数格式：完整school对象 或 schoolId+schoolName
  // 使用 useMemo 避免每次渲染创建新对象导致无限循环
  const routeParams = route.params as any;
  const school = React.useMemo(() => {
    return routeParams?.school || (routeParams?.schoolId ? {
      deptId: routeParams.schoolId,
      deptName: routeParams.schoolName || '未知学校',
    } : null);
  }, [routeParams?.school, routeParams?.schoolId, routeParams?.schoolName]);
  const { permissions, user: userInfo, isAuthenticated } = useUser(); // 获取用户权限和用户信息
  const volunteerContext = useVolunteerContext(); // 获取志愿者状态管理

  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  // 历史记录弹窗状态
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<{userId: number, name: string} | null>(null);

  // 监听VolunteerContext状态变化，自动刷新页面数据
  React.useEffect(() => {
    if (volunteerContext.currentStatus === 'signed_out') {
      // 延迟一点时间确保后端数据已更新
      setTimeout(() => {
        loadVolunteerData(true);
        // 如果历史记录弹窗是打开的，也触发其刷新
        if (showHistoryModal && selectedHistoryUser) {
          // 通过重新设置用户来触发历史记录组件的刷新
          const currentUser = selectedHistoryUser;
          setSelectedHistoryUser(null);
          setTimeout(() => {
            setSelectedHistoryUser(currentUser);
          }, 100);
        }
      }, 500);
    }
  }, [volunteerContext.currentStatus, showHistoryModal, selectedHistoryUser]);

  // 志愿者卡片展开状态
  const [expandedVolunteer, setExpandedVolunteer] = useState<string | null>(null);

  // 搜索功能状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultIndex, setSearchResultIndex] = useState<number | null>(null);
  
  // 移除全局时间管理
  const [activitiesCount, setActivitiesCount] = useState<number>(0);
  const [operationInProgress, setOperationInProgress] = useState<Record<string, boolean>>({});
  // 🚀 内存优化：统一refs管理，避免内存泄漏
  const screenStateRef = React.useRef({
    operationLocks: new Set<number>(),
    pendingOperations: new Map<string, Promise<any>>(),
    recordCache: new Map<number, any>(),
    flatList: null as FlatList | null,
  });


  // 移除独立计时器 - 现在使用全局时间管理

  // 🚀 内存优化：简化初始化和cleanup逻辑
  React.useEffect(() => {
    VolunteerStateService.cleanup();
    VolunteerStateService.initialize();

    // 设置初始翻译消息
    setLoadingMessage(t('volunteer.loading.default', { defaultValue: 'Loading...' }));
    
    return () => {
      // 🧹 统一内存清理，避免内存泄漏
      VolunteerStateService.cleanup();
      screenStateRef.current.operationLocks.clear();
      screenStateRef.current.pendingOperations.clear();
      screenStateRef.current.recordCache.clear();
      screenStateRef.current.flatList = null;
    };
  }, []);

  // 移除复杂的持久化逻辑


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
        if (screenStateRef.current.recordCache.has(v.userId)) {
          return;
        }
        const last = await getLastVolunteerRecord(v.userId);
        
        if (last?.code === 200 && last?.data) {
          screenStateRef.current.recordCache.set(v.userId, last.data);
          
          const backendRecord = last.data;
          const currentStatus = getVolunteerStatus(backendRecord);
          
          
          // 🚨 CRITICAL: 只有当状态真的不一致时才更新
          const currentFrontendStatus = v.checkInStatus;
          const expectedStatus = currentStatus === 'signed_in' ? 'checked_in' : 'not_checked_in';
          
          if (currentFrontendStatus !== expectedStatus) {
            if (__DEV__) {
              console.warn(`🚨 [STATE-MISMATCH] 用户${v.name}状态不一致: 前端=${currentFrontendStatus}, 后端=${currentStatus}`);
            }
            
            // 批量状态更新，避免多次渲染
            setVolunteers(prev => prev.map(vol => {
              if (vol.userId !== v.userId) return vol;
              
              const updates: Partial<VolunteerStatusUpdate> = { checkInStatus: expectedStatus };
              
              if (currentStatus === 'signed_in') {
                // 🔧 使用timeService保持本地时间格式，不做UTC转换
                try {
                  const parsedTime = timeService.parseServerTime(backendRecord.startTime);
                  updates.checkInTime = parsedTime ? timeService.formatForServer(parsedTime) : backendRecord.startTime;
                } catch (e) {
                  updates.checkInTime = backendRecord.startTime;
                }
                updates.checkOutTime = null;
                // 移除持久化逻辑
              } else {
                updates.checkInTime = null;
                // 🔧 解析签退时间，使用本地时间格式
                try {
                  const parsedTime = timeService.parseServerTime(backendRecord.endTime);
                  updates.checkOutTime = parsedTime ? timeService.formatForServer(parsedTime) : backendRecord.endTime;
                } catch (e) {
                  updates.checkOutTime = backendRecord.endTime;
                }
                // 移除持久化逻辑
              }
              
              return { ...vol, ...updates };
            }));
            
          }
        }
      } catch (e) {
        if (__DEV__) {
          console.warn('展开同步失败:', e);
        }
      }
    })();
  }, [expandedVolunteer]); // 只依赖expandedVolunteer，避免循环依赖


  const formatDuration = (minutes: number) => {
    return VolunteerStateService.formatDuration(minutes);
  };

  // 志愿者搜索功能 - 支持姓名和手机号搜索
  const searchVolunteer = async () => {
    if (!searchQuery.trim()) {
      setSearchError('请输入志愿者姓名或手机号');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    setSearchResultIndex(null);
    
    try {
      const query = searchQuery.trim().toLowerCase();
      
      // 在当前志愿者列表中搜索
      const matchedIndex = volunteers.findIndex(volunteer => {
        // 支持姓名搜索（模糊匹配）
        const nameMatches = 
          volunteer.name?.toLowerCase().includes(query) ||
          volunteer.legalName?.toLowerCase().includes(query) ||
          volunteer.userName?.toLowerCase().includes(query);
          
        // 支持手机号搜索（去除格式符号后匹配）
        const cleanQuery = query.replace(/\D/g, '');
        const phoneMatches = cleanQuery.length >= 3 && 
          (volunteer.phoneNumber || '').replace(/\D/g, '').includes(cleanQuery);
          
        return nameMatches || phoneMatches;
      });
      
      if (matchedIndex !== -1) {
        const foundVolunteer = volunteers[matchedIndex];
        
        // 跳转到志愿者位置并展开
        scrollToVolunteer(matchedIndex, foundVolunteer.id);
        setSearchResultIndex(matchedIndex);
        
        // 显示成功提示并清空搜索
        Alert.alert(
          '找到志愿者', 
          `已定位到 ${foundVolunteer.name}`,
          [{ text: '确定', onPress: () => {
            setSearchQuery('');
            setTimeout(() => setSearchResultIndex(null), 2000);
          }}]
        );
        
      } else {
        setSearchError(`未找到匹配"${searchQuery.trim()}"的志愿者`);
        // 3秒后清除错误信息
        setTimeout(() => setSearchError(''), 3000);
      }
    } catch (error) {
      console.error('志愿者搜索失败:', error);
      setSearchError('搜索失败，请重试');
      setTimeout(() => setSearchError(''), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  // 简化的搜索输入处理
  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    setSearchError('');
    
    // 如果输入为空，清除所有搜索状态
    if (!text.trim()) {
      setSearchResultIndex(null);
      return;
    }
    
    // 输入达到2个字符时自动高亮匹配（不自动滚动）
    if (text.trim().length >= 2) {
      const query = text.trim().toLowerCase();
      const matchedIndex = volunteers.findIndex(volunteer => {
        // 支持姓名搜索（模糊匹配）
        const nameMatches = 
          volunteer.name?.toLowerCase().includes(query) ||
          volunteer.legalName?.toLowerCase().includes(query) ||
          volunteer.userName?.toLowerCase().includes(query);
          
        // 支持手机号搜索（简化版本，不强制格式）
        const phoneMatches = query.length >= 3 && 
          (volunteer.phoneNumber || '').toLowerCase().includes(query);
          
        return nameMatches || phoneMatches;
      });
      
      if (matchedIndex !== -1) {
        setSearchResultIndex(matchedIndex);
        setSearchError('');
      } else {
        setSearchResultIndex(null);
      }
    }
  };

  // 滚动到指定志愿者并展开详情
  const scrollToVolunteer = (index: number, volunteerId: string) => {
    try {
      // 滚动到指定位置
      screenStateRef.current.flatList?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, // 居中显示
      });
      
      // 展开志愿者详情
      setExpandedVolunteer(volunteerId);
      
    } catch (error) {
      console.error('跳转到志愿者位置失败:', error);
      // 降级处理：直接展开，不滚动
      setExpandedVolunteer(volunteerId);
    }
  };

  // 处理扫码功能 - 暂时禁用
  const handleScanQR = () => {
    // 二维码功能暂时禁用
  };

  // 移除持久化计时功能
  
  // 🌍 根据当前语言和用户要求获取学校显示信息
  const getSchoolDisplayInfo = () => {
    const currentLanguage = i18n.language;
    
    // Title Display Logic (用户要求):
    // - English interface: Use engName
    // - Chinese interface: Use deptName
    const title = (currentLanguage === 'en-US' && school?.engName) 
      ? school.engName 
      : school?.deptName || school?.nameCN || '未知学校';
    
    // Subtitle Display: Always use aprName in both languages
    const subtitle = school?.aprName || '';
    
    return { title, subtitle };
  };

  // 加载学校活动数量
  const loadSchoolActivitiesCount = async () => {
    try {
      // 获取所有活动，然后统计该学校相关的活动数量
      // 🔧 支持访客统计模式
      const isLoggedIn = !!(userInfo?.id);

      const response = await pomeloXAPI.getActivityList({
        pageNum: 1,
        pageSize: 100, // 获取更多数据来统计
        userId: isLoggedIn ? parseInt(userInfo.id) : undefined, // 🔧 可选参数
      });


      if (response.code === 200 && response.data) {
        // 显示总活动数(当前API返回所有活动)
        setActivitiesCount(response.data.total);
      }
    } catch (error) {
      console.error('获取活动数量失败:', error);
      setActivitiesCount(0);
    }
  };

  // 🔧 移除重复的 useEffect，使用 useFocusEffect 统一管理加载逻辑
  // 只保留活动统计的加载
  React.useEffect(() => {
    try {
      if (typeof loadSchoolActivitiesCount === 'function') {
        loadSchoolActivitiesCount();
      }
    } catch (error) {
      console.error('加载活动统计时出错:', error);
    }
  }, [school?.deptId]); // 使用 deptId 作为稳定依赖

  // 🔧 使用 ref 防止重复加载和并发加载
  const hasLoadedRef = React.useRef(false);
  const isLoadingRef = React.useRef(false);
  const mountedRef = React.useRef(true);

  // 组件卸载时标记
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 页面聚焦时刷新数据（处理从签退页面返回的情况）
  useFocusEffect(
    React.useCallback(() => {
      // 🔧 防止重复加载和并发加载
      if (hasLoadedRef.current || isLoadingRef.current) {
        console.log('🔄 [FOCUS-EFFECT] 跳过加载:', {
          hasLoaded: hasLoadedRef.current,
          isLoading: isLoadingRef.current
        });
        return;
      }

      // 🔧 简化：只在首次加载
      const shouldRefresh = route.params?.refresh;
      const hasTimestamp = route.params?.timestamp;
      const shouldRefreshGlobal = route.params?.shouldRefresh;
      const needsForceRefresh = shouldRefresh || shouldRefreshGlobal || hasTimestamp;

      console.log('🔄 [FOCUS-EFFECT] 首次加载:', { needsForceRefresh });

      hasLoadedRef.current = true;
      loadVolunteerData(needsForceRefresh);

      // 清除刷新参数
      if (needsForceRefresh) {
        (navigation as any).setParams({
          refresh: undefined,
          shouldRefresh: undefined,
          timestamp: undefined
        });
      }

      return () => {
        // 页面离开时重置，允许返回时重新加载
        hasLoadedRef.current = false;
      };
    }, [])
  );

  const loadVolunteerData = async (forceClearCache = false) => {
    // 🔧 防止并发加载
    if (isLoadingRef.current) {
      console.log('🚀 [LOAD] 已在加载中，跳过重复调用');
      return;
    }
    isLoadingRef.current = true;

    console.log('🚀 [LOAD] loadVolunteerData 开始执行, forceClearCache:', forceClearCache);
    try {

      // 🚨 HERMES DETECTION: 检测JavaScript引擎
      let jsEngine = 'unknown';
      try {
        if ((global as any).HermesInternal) {
          jsEngine = 'Hermes';
        } else if ((global as any).__JSC__) {
          jsEngine = 'JSC';
        } else {
          jsEngine = 'Other';
        }
      } catch (e) {
        jsEngine = 'Detection failed';
      }
      
      
      setLoading(true);
      setLoadingProgress(0);
      setLoadingMessage(t('volunteer.loading.volunteer_data', { defaultValue: 'Loading volunteer data...' }));

      // 🔄 每次刷新都清理岗位缓存，确保获取最新岗位信息
      try {
        positionService.clearCache();
        console.log('✅ [CACHE] 职位缓存已清理');
      } catch (e) {
        if (__DEV__) {
          console.warn('岗位缓存清理失败:', e);
        }
      }

      if (forceClearCache) {
        try {
          // 清理API缓存
          if (typeof (apiCache as any)?.clearAll === 'function') {
            (apiCache as any).clearAll();
          }
          console.log('✅ [CACHE] API缓存已清理');
        } catch (e) {
          if (__DEV__) {
            console.warn('API缓存清理失败:', e);
          }
        }
      }
      
      const permissionInfo = {
        school: getSchoolDisplayInfo().title,
        schoolId: school?.id,
        deptId: school?.deptId,
        currentUser: {
          userName: userInfo?.userName,
          legalName: userInfo?.legalName,
          deptId: userInfo?.deptId,
          rawRoles: userInfo?.roles
        },
        permissions: {
          level: permissions.getPermissionLevel(),
          dataScope: permissions.getDataScope(),
          canCheckInOut: permissions.canCheckInOut(),
          canViewAllSchools: permissions.canViewAllSchools(),
          hasVolunteerAccess: permissions.hasVolunteerManagementAccess()
        }
      };
      
      
      // 根据权限和学校ID过滤数据
      let filters = {};
      const dataScope = permissions.getDataScope();
      console.log('🔒 [LOAD] 权限检查:', { dataScope, schoolDeptId: school?.deptId, userDeptId: userInfo?.deptId });

      if (dataScope === 'school' && school?.deptId) {
        // 分管理员和内部员工：只能查看本校数据
        filters = { deptId: school.deptId };
        
        // 额外检查：确保当前用户有权限查看此学校
        if (userInfo?.deptId && userInfo.deptId !== school.deptId) {
          if (__DEV__) {
            console.warn('⚠️ 权限不足：用户不能查看其他学校数据');
          }
          setVolunteers([]);
          setLoading(false);
          return;
        }
      } else if (dataScope === 'all') {
        // 总管理员：可以查看所有数据
      } else if (dataScope === 'self') {
        // Staff员工：只能查看自己的数据
        filters = { userId: userInfo?.userId };
      } else {
        setVolunteers([]);
        setLoading(false);
        return;
      }
      
      setLoadingMessage(t('volunteer.loading.basic_data', { defaultValue: 'Fetching basic data...' }));
      setLoadingProgress(20);
      
      
      let recordsResult, hoursResult, userListResult;

      // 🔧 恢复志愿者记录和工时API调用
      // 注意: 使用 /app/hour/recordList 而非 /app/hour/lastRecordList (后者有后端SQL错误)
      try {
        const token = await getCurrentToken();
        if (token) {
          // 并行获取志愿者记录和工时数据
          const [recordsResponse, hoursResponse] = await Promise.all([
            fetch(`${getApiUrl()}/app/hour/recordList`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(err => {
              console.warn('获取志愿者记录失败:', err);
              return null;
            }),
            fetch(`${getApiUrl()}/app/hour/hourList`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(err => {
              console.warn('获取工时数据失败:', err);
              return null;
            })
          ]);

          if (recordsResponse?.ok) {
            const recordsData = await recordsResponse.json();
            recordsResult = { code: recordsData.code, msg: recordsData.msg, rows: recordsData.rows || [] };
          } else {
            recordsResult = { code: 200, msg: 'OK', rows: [] };
          }

          if (hoursResponse?.ok) {
            const hoursData = await hoursResponse.json();
            hoursResult = { code: hoursData.code, msg: hoursData.msg, rows: hoursData.rows || [] };
          } else {
            hoursResult = { code: 200, msg: 'OK', rows: [] };
          }
        } else {
          recordsResult = { code: 200, msg: 'OK', rows: [] };
          hoursResult = { code: 200, msg: 'OK', rows: [] };
        }
      } catch (error) {
        console.warn('获取志愿者记录/工时失败，使用空数据:', error);
        recordsResult = { code: 200, msg: 'OK', rows: [] };
        hoursResult = { code: 200, msg: 'OK', rows: [] };
      }

      try {
        console.log('🔄 [LOAD] 开始获取用户列表...');
        // 🚨 直接API调用，避免getUserList函数的复杂逻辑
        const token = await getCurrentToken();
        if (!token) {
          throw new Error('未获取到token');
        }
        
        // 🔧 使用 POST /app/user/list 接口，传递 deptId 筛选特定学校用户
        const schoolDeptId = school?.deptId;

        // 构建请求参数
        const requestBody = new URLSearchParams();
        if (schoolDeptId) {
          requestBody.append('deptId', String(schoolDeptId));
        }
        requestBody.append('pageSize', '1000'); // 获取足够多的用户

        const response = await fetch(`${getApiUrl()}/app/user/list`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: requestBody.toString()
        });
        const data = await response.json();

        // 🐛 打印第一个用户的完整数据结构，用于调试
        if (__DEV__ && data.rows && data.rows.length > 0) {
          console.log('🔍 [API-RAW-DATA] /app/user/list 返回的第一个用户数据:', JSON.stringify(data.rows[0], null, 2));
        }

        userListResult = { code: data.code, msg: data.msg, data: data.rows || [] };

        if (__DEV__) {
          console.log('📊 [USER-LIST] API响应:', {
            code: data.code,
            total: data.total,
            rowsCount: data.rows?.length,
            schoolDeptId: schoolDeptId
          });
        }
        
        
      } catch (error) {
        console.error('直接API调用失败:', error);
        userListResult = { code: 500, msg: 'API调用失败', data: [] };
      }
      
      setLoadingProgress(40);
      setLoadingMessage(t('volunteer.loading.processing_volunteers', { defaultValue: 'Processing volunteer information...' }));


      // 🚀 性能优化：基于用户列表获取学校管理员和内部员工，使用并行处理
      if (userListResult?.code === 200 && userListResult?.data) {
        const allUsers = userListResult.data;
        
        
        
        const schoolDistribution: Record<string, number> = {};
        allUsers.forEach(user => {
          const deptId = user.deptId;
          const key = `${deptId}`;
          schoolDistribution[key] = (schoolDistribution[key] || 0) + 1;
        });
        
        // 第一步：快速过滤符合条件的用户（强制按学校过滤）
        const eligibleUsers = allUsers.filter(user => {
          // Staff权限：只显示自己
          if (permissions.getDataScope() === 'self' && user.userId !== userInfo?.userId) {
            return false;
          }

          // 所有权限级别都必须按学校过滤
          // 即使是总管理员，在查看特定学校时也只显示该学校的志愿者
          // 🔧 使用字符串比较避免类型不匹配问题
          if (String(user.deptId) !== String(school?.deptId)) {
            return false;
          }

          return true; // 只有属于当前学校的用户才显示
        });

        if (__DEV__) {
          console.log('📊 [FILTER] 过滤结果:', {
            allUsersCount: allUsers.length,
            eligibleUsersCount: eligibleUsers.length,
            schoolDeptId: school?.deptId,
            firstUserDeptId: allUsers[0]?.deptId
          });
        }

        // 第二步：优化处理用户数据
        setLoadingProgress(60);

        // 单个志愿者优化：跳过并行处理的复杂逻辑
        if (eligibleUsers.length === 1) {
          setLoadingMessage(t('volunteer.loading.single_volunteer', { defaultValue: 'Loading volunteer data...' }));
        } else {
          setLoadingMessage(t('volunteer.loading.parallel_processing', { count: eligibleUsers.length, defaultValue: `Processing ${eligibleUsers.length} volunteers...` }));
        }

        const userProcessingPromises = eligibleUsers.map(async (user, index) => {
          try {
            // HERMES FIX: 顺序执行API调用，避免Promise.all兼容性问题
            let fullUserInfo, realtimeRecord;

            try {
              fullUserInfo = await apiCache.cachedCall(
                `userInfo:${user.userId}`,
                () => pomeloXAPI.getUserInfo(user.userId),
                CacheTTL.USER_INFO
              );
            } catch (error) {
              return null;
            }

            try {
              realtimeRecord = await apiCache.cachedCall(
                `volunteerRecord:${user.userId}`,
                () => getLastVolunteerRecord(user.userId),
                CacheTTL.VOLUNTEER_RECORDS
              );
            } catch (error) {
              // 志愿者记录失败不是致命的，继续处理
              realtimeRecord = { code: 500, data: null };
            }

            if (fullUserInfo.code !== 200 || !fullUserInfo.data) {
              return null;
            }

            const userData = fullUserInfo.data;

            // 查找该用户的工时记录
            const hourRecord = hoursResult?.rows?.find((h: VolunteerHours) => h.userId === user.userId);

            // 处理志愿者记录
            let userRecord = null;
            const cachedRecord = recordsResult?.rows?.find((r: VolunteerRecord) => r.userId === user.userId);

            if (realtimeRecord.code === 200 && realtimeRecord.data) {
              userRecord = realtimeRecord.data;
            } else {
              userRecord = cachedRecord;
            }

            // 🔄 动态获取岗位信息，支持后台更新
            let positionInfo = null;

            try {
              // 使用统一的权限判断逻辑
              const userPermissionLevel = getUserPermissionLevel(userData);

              // 只有管理员、分管理员、内部员工才显示在志愿者列表中
              const isVolunteerRole = ['manage', 'part_manage', 'staff'].includes(userPermissionLevel);

              if (!isVolunteerRole) {
                return null;
              }

              // 🐛 调试日志：查看API返回的用户岗位数据
              console.log('🔍 [DEBUG-POSITION] 用户岗位数据:', {
                userName: userData.userName,
                postIds: userData.postIds,
                posts: userData.posts,
                post: userData.post,
                postCode: userData.postCode,
                postName: userData.postName,
                roles: userData.roles,
                roleKey: userData.roles?.[0]?.key
              });

              // ✅ 使用positionService动态获取岗位，优先使用后端posts字段
              positionInfo = await positionService.getUserPositionDisplay(userData);

              // 如果positionService无法获取岗位信息，使用备用逻辑
              if (!positionInfo) {
                console.log('⚠️ [POSITION] positionService返回null，使用备用逻辑');

                let level = '';
                let major = '';

                switch (userPermissionLevel) {
                  case 'manage':
                    level = 'President';
                    major = '总管理员';
                    break;
                  case 'part_manage':
                    level = 'Vice President';
                    major = '分管理员';
                    break;
                  case 'staff':
                    level = 'EB';
                    major = '内部员工';
                    break;
                  default:
                    return null;
                }

                positionInfo = { level: level, major: major };
              } else {
                console.log('✅ [POSITION] 从positionService获取岗位成功:', positionInfo);
              }

            } catch (error) {
              console.error('❌ [POSITION] 获取岗位信息失败:', error);
              return null;
            }

            // 如果没有岗位信息，不显示在志愿者列表中
            if (!positionInfo) {
              return null;
            }

            return { user, userData, userRecord, hourRecord, positionInfo };

          } catch (error) {
            return null;
          }
        });
        
        
        // 等待所有用户数据处理完成
        const processedUsers = await Promise.all(userProcessingPromises);
        
        
        setLoadingProgress(80);
        setLoadingMessage(t('volunteer.loading.building_list', { defaultValue: 'Building volunteer list...' }));
        
        // 第三步：构建志愿者对象（快速同步处理）
        const schoolStaff = processedUsers
          .filter(result => result !== null) // 过滤失败的处理结果
          .map(({ user, userData, userRecord, hourRecord, positionInfo }) => {
            
            // 详细检测用户的签到记录状态
            // 🚨 修复：正确处理userRecord可能是数组或单个记录的情况
            const actualRecord = Array.isArray(userRecord) ? userRecord[0] : userRecord;
            
            // 🚨 CRITICAL FIX: 根据后端记录正确设置初始状态
            let initialCheckInStatus = 'not_checked_in';
            if (actualRecord) {
              const recordStatus = getVolunteerStatus(actualRecord);
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
            
            
            // 🚨 HERMES FIX: 简化对象构建，避免复杂的条件表达式
            let volunteerName = '管理员';
            if (userData.legalName) {
              volunteerName = userData.legalName;
            } else if (userData.nickName) {
              volunteerName = userData.nickName;
            } else if (userData.userName) {
              volunteerName = userData.userName;
            }
            
            let volunteerHours = 0;
            if (hourRecord && hourRecord.totalMinutes) {
              volunteerHours = Math.max(0, Math.round(hourRecord.totalMinutes / 60));
            }
            
            // 🚨 HERMES SAFE: 简单对象构建，正确设置历史时间
            const volunteer = {
              id: String(user.userId),
              name: volunteerName,
              legalName: userData.legalName,
              userName: userData.userName,
              phoneNumber: userData.phonenumber, // 添加手机号用于搜索
              avatar: null,
              hours: volunteerHours,
              level: positionInfo.level,
              major: positionInfo.major,
              checkInStatus: initialCheckInStatus,
              checkInTime: (() => {
                if (initialCheckInStatus === 'checked_in' && actualRecord?.startTime) {
                  try {
                    const parsedTime = timeService.parseServerTime(actualRecord.startTime);
                    return parsedTime ? timeService.formatForServer(parsedTime) : actualRecord.startTime;
                  } catch (e) {
                      return actualRecord.startTime;
                  }
                }
                return null;
              })(),
              checkOutTime: (() => {
                if (initialCheckInStatus === 'not_checked_in' && actualRecord?.endTime) {
                  try {
                    const parsedTime = timeService.parseServerTime(actualRecord.endTime);
                    return parsedTime ? timeService.formatForServer(parsedTime) : actualRecord.endTime;
                  } catch (e) {
                      return actualRecord.endTime;
                  }
                }
                return null;
              })(),
              totalHours: volunteerHours,
              // 🚀 正确设置历史时间：如果当前已签退，显示最后一次的签到和签退时间
              lastCheckInTime: (() => {
                if (actualRecord?.startTime) {
                  try {
                    const parsedTime = timeService.parseServerTime(actualRecord.startTime);
                    return parsedTime ? timeService.formatForServer(parsedTime) : actualRecord.startTime;
                  } catch (e) {
                    return actualRecord.startTime;
                  }
                }
                return null;
              })(),
              lastCheckOutTime: (() => {
                if (actualRecord?.endTime && initialCheckInStatus === 'not_checked_in') {
                  try {
                    const parsedTime = timeService.parseServerTime(actualRecord.endTime);
                    return parsedTime ? timeService.formatForServer(parsedTime) : actualRecord.endTime;
                  } catch (e) {
                    return actualRecord.endTime;
                  }
                }
                return null;
              })(),
              userId: user.userId,
            };
            
            return volunteer;
          });
        
        setLoadingProgress(100);
        setLoadingMessage(t('volunteer.loading.complete', { defaultValue: 'Loading complete' }));
        


        // 将当前用户置顶显示
        const sortedStaff = schoolStaff.sort((a, b) => {
          // 当前用户始终排在第一位
          const isCurrentUserA = a.userId === userInfo?.userId ||
                                 a.name === userInfo?.legalName ||
                                 a.legalName === userInfo?.legalName;
          const isCurrentUserB = b.userId === userInfo?.userId ||
                                 b.name === userInfo?.legalName ||
                                 b.legalName === userInfo?.legalName;

          if (isCurrentUserA && !isCurrentUserB) return -1;
          if (!isCurrentUserA && isCurrentUserB) return 1;

          // 其他用户按原有顺序（按姓名排序）
          return (a.name || '').localeCompare(b.name || '');
        });

        setVolunteers(sortedStaff);
      } else {
        setVolunteers([]);
      }
    } catch (error) {
      console.error('加载志愿者数据失败:', error);
      
      
      // API失败时显示空列表，不使用mock数据
      setVolunteers([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false; // 🔧 重置加载状态
    }
  };

  
  if (!school) {
    if (__DEV__) console.warn('⚠️ 学校信息缺失，请检查导航参数');

    return (
      <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
        <Text style={dmStyles.text.primary}>{t('school.not_found_message')}</Text>
      </SafeAreaView>
    );
  }

  // 获取学校logo，带错误处理
  let logoSource;
  try {
    logoSource = getSchoolLogo(school.id);
  } catch (error) {
    console.error('❌ 获取学校logo失败:', error);
    logoSource = null;
  }

  // 处理重置志愿者状态（用于修复时间异常）
  const handleResetStatus = async (volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer?.userId) return;

    Alert.alert(
      '重置状态',
      '检测到签到时间记录异常。重置后您需要重新签到，是否继续？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确认重置',
          style: 'destructive',
          onPress: async () => {
            let recordId: number | undefined;
            try {
              setOperationInProgress(prev => ({ ...prev, [volunteerId]: true }));

              console.log('🚨 [RESET] 开始重置用户状态:', {
                volunteerId,
                userId: volunteer.userId,
                userName: volunteer.name,
                operateUserId: userInfo?.userId,
                operateLegalName: userInfo?.legalName
              });

              // 🆕 智能获取recordId - 通用方案
              const getResetRecordId = async (): Promise<number> => {
                console.log('🔍 [RESET] 开始智能获取recordId...');

                // 1. 优先使用已有的recordId字段
                if (volunteer.recordId) {
                  console.log('✅ [RESET] 使用volunteer.recordId:', volunteer.recordId);
                  return volunteer.recordId;
                }

                if (volunteer.id && typeof volunteer.id === 'number') {
                  console.log('✅ [RESET] 使用volunteer.id:', volunteer.id);
                  return volunteer.id;
                }

                // 2. 基于异常检测推断：如果能显示重置按钮，说明有记录存在
                const anomaly = timeService.detectTimeAnomaly(volunteer.checkInTime);
                if (anomaly.type === 'too_long') {
                  console.log('🔍 [RESET] 检测到超长时间异常，尝试API获取recordId...');

                  try {
                    // 使用较短的超时时间，避免用户等待过久
                    const timeoutPromise = new Promise<never>((_, reject) =>
                      setTimeout(() => reject(new Error('API调用超时')), 3000)
                    );

                    const lastRecord = await Promise.race([
                      getLastVolunteerRecord(volunteer.userId),
                      timeoutPromise
                    ]);

                    if (lastRecord.code === 200 && lastRecord.data?.id) {
                      console.log('✅ [RESET] 从API获取到recordId:', lastRecord.data.id);
                      return lastRecord.data.id;
                    }
                  } catch (apiError) {
                    console.warn('⚠️ [RESET] API获取recordId失败:', apiError.message);
                  }
                }

                // 3. 最后尝试：从现有的志愿者列表数据中查找
                const volunteerWithRecord = volunteers.find(v =>
                  v.userId === volunteer.userId && (v.recordId || v.id)
                );
                if (volunteerWithRecord) {
                  const foundRecordId = volunteerWithRecord.recordId || volunteerWithRecord.id;
                  console.log('✅ [RESET] 从志愿者列表找到recordId:', foundRecordId);
                  return foundRecordId;
                }

                // 4. 如果所有方法都失败
                throw new Error(`无法获取用户 ${volunteer.name} 的签到记录ID\n\n可能原因：\n• 网络连接问题\n• 数据同步延迟\n• 记录已被删除\n\n请稍后重试或联系管理员`);
              };

              recordId = await getResetRecordId();
              console.log('🎯 [RESET] 最终确定的recordId:', recordId);

              // 🔧 验证必要参数
              if (!recordId) {
                throw new Error('无法确定要重置的记录ID，请联系管理员');
              }

              const effectiveOperateUserId = userInfo?.userId || volunteer.userId;
              const effectiveOperateLegalName = userInfo?.legalName || volunteer.name || '管理员';

              console.log('🔍 [RESET] 重置参数确认:', {
                targetUserId: volunteer.userId,
                targetUserName: volunteer.name,
                operateUserId: effectiveOperateUserId,
                operateLegalName: effectiveOperateLegalName,
                recordId
              });

              // 使用简化的重置函数
              const result = await forceResetVolunteerStatus(
                volunteer.userId,
                effectiveOperateUserId,
                effectiveOperateLegalName,
                recordId
              );

              console.log('📊 [RESET] 重置结果:', {
                success: result.code === 200,
                code: result.code,
                msg: result.msg
              });

              if (result.code === 200) {
                console.log('✅ [RESET] 重置API调用成功');

                // 🧹 立即清理相关缓存
                try {
                  apiCache.clearByPattern(`volunteerRecord:${volunteer.userId}`);
                  apiCache.clearKey('volunteerRecords');
                  apiCache.clearKey('volunteerHours');
                  console.log('🧹 [RESET] 缓存清理完成');
                } catch (cacheError) {
                  console.warn('缓存清理失败:', cacheError);
                }

                Alert.alert('✅ 重置成功', `用户 ${volunteer.name} 的签到状态已重置\n\n现在可以重新签到了`, [
                  {
                    text: '确定',
                    onPress: async () => {
                      console.log('🔄 [RESET] 开始强制刷新所有数据...');

                      // 🚀 多重刷新确保状态同步
                      try {
                        // 1. 刷新志愿者数据
                        await loadVolunteerData(true);
                        console.log('✅ [RESET] 志愿者数据刷新完成');

                        // 2. 额外等待确保后端数据同步
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // 3. 再次刷新确保UI更新
                        await loadVolunteerData(true);
                        console.log('✅ [RESET] 二次数据刷新完成');

                      } catch (refreshError) {
                        console.error('❌ [RESET] 数据刷新失败:', refreshError);
                        Alert.alert('提示', '重置成功但页面刷新失败，请手动刷新页面');
                      }
                    }
                  }
                ]);
              } else {
                const errorMsg = result.msg || '状态重置失败';
                console.error('❌ [RESET] 重置API失败:', {
                  code: result.code,
                  message: result.msg,
                  userId: volunteer.userId,
                  recordId
                });

                Alert.alert('❌ 重置失败',
                  `重置操作失败：${errorMsg}\n\n` +
                  `用户ID: ${volunteer.userId}\n` +
                  `记录ID: ${recordId}\n\n` +
                  `请联系管理员或稍后重试`, [
                  {
                    text: '重试',
                    onPress: () => {
                      console.log('🔄 [RESET] 用户选择重试');
                      // 递归调用重置
                      handleResetStatus(volunteerId);
                    }
                  },
                  {
                    text: '取消',
                    style: 'cancel'
                  }
                ]);
              }
            } catch (error) {
              console.error('❌ [RESET] 重置状态异常:', {
                error: error.message,
                stack: error.stack,
                userId: volunteer.userId,
                userName: volunteer.name,
                recordId,
                operateUserId: userInfo?.userId,
                timestamp: new Date().toISOString()
              });

              // 🔍 详细错误分析和用户友好提示
              let errorMessage = '网络错误，请稍后重试';
              let showRetryOption = true;

              if (error.message.includes('记录ID')) {
                errorMessage = `无法确定要重置的记录ID\n\n用户: ${volunteer.name}\nID: ${volunteer.userId}\n\n这可能是数据同步问题，请联系管理员`;
                showRetryOption = false;
              } else if (error.message.includes('记录')) {
                errorMessage = '无法获取签到记录，可能是网络问题或数据异常';
              } else if (error.message.includes('权限')) {
                errorMessage = '权限不足，请确认您有管理员权限';
                showRetryOption = false;
              } else if (error.message.includes('网络') || error.message.includes('fetch')) {
                errorMessage = '网络连接失败，请检查网络后重试';
              } else if (error.message.includes('超时')) {
                errorMessage = '操作超时，请检查网络连接后重试';
              }

              const alertActions = [];

              if (showRetryOption) {
                alertActions.push({
                  text: '重试',
                  onPress: () => {
                    console.log('🔄 [RESET] 用户选择重试重置');
                    handleResetStatus(volunteerId);
                  }
                });
              }

              alertActions.push({
                text: '刷新页面',
                onPress: () => {
                  console.log('🔄 [RESET] 用户选择刷新页面');
                  loadVolunteerData(true);
                }
              });

              alertActions.push({
                text: '取消',
                style: 'cancel'
              });

              Alert.alert('❌ 重置失败', errorMessage, alertActions);
            } finally {
              setOperationInProgress(prev => ({ ...prev, [volunteerId]: false }));
              console.log('🏁 [RESET] 重置操作结束，解除loading状态');
            }
          }
        }
      ]
    );
  };

  // 处理查看志愿者历史记录
  const handleViewVolunteerHistory = (volunteer: any) => {
    
    if (!volunteer.userId) {
      console.error('❌ [HISTORY] 志愿者userId缺失');
      return;
    }
    
    setSelectedHistoryUser({
      userId: volunteer.userId,
      name: volunteer.name || '志愿者'
    });
    setShowHistoryModal(true);
  };

  // 关闭历史记录弹窗
  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedHistoryUser(null);
  };

  // 处理志愿者签到
  const handleCheckIn = async (volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer?.userId) return;
    
    const operationKey = `checkin-${volunteer.userId}`;
    
    // 🚨 ENHANCED: 三重保护防止重复操作
    if (operationInProgress[volunteerId] ||
        screenStateRef.current.operationLocks.has(volunteer.userId) ||
        screenStateRef.current.pendingOperations.has(operationKey)) {
      if (__DEV__) {
        /* Operation already in progress - skip */
      }
      return;
    }
    
    const validation = VolunteerStateService.validateCheckInConditions(volunteer as VolunteerInfo);
    if (!validation.isValid) {
      console.error('❌ [CHECKIN-VALIDATION] 验证失败:', validation.error);
      Alert.alert(t('common.signin_failed'), validation.error || t('volunteer.signin_conditions_not_met'));
      return;
    }
    
    
    // 设置操作状态和锁
    setOperationInProgress(prev => ({ ...prev, [volunteerId]: true }));
    screenStateRef.current.operationLocks.add(volunteer.userId);
    
    // 创建操作promise并缓存，防止重复执行
    const operationPromise = (async () => {
    try {
      const volunteer = volunteers.find(v => v.id === volunteerId);
      const volunteerName = volunteer?.name || volunteer?.userName || '志愿者';
      
      // 检查userId
      const userId = volunteer?.userId;
      if (!userId || typeof userId !== 'number' || userId <= 0) {
        Alert.alert(t('common.error'), t('common.cannot_identify_user'));
        return;
      }
      
      // 获取当前操作用户信息
      const currentUser = userInfo;
      const operateUserIdRaw = currentUser?.userId;
      const operateUserId = typeof operateUserIdRaw === 'string' ? parseInt(operateUserIdRaw) : operateUserIdRaw;
      const operateLegalName = currentUser?.legalName;

      // 🚨 关键修复：参数验证防止undefined错误
      if (!operateUserId || !operateLegalName) {
        console.error('❌ [VALIDATION] 操作用户信息缺失:', {
          hasCurrentUser: !!currentUser,
          operateUserId,
          operateLegalName,
          userInfoLoaded: !!userInfo
        });
        Alert.alert(t('common.signin_failed'), t('common.cannot_get_operator_info'));
        return;
      }
      

      // 生产环境简化参数日志
      if (__DEV__) {
        /* Debug parameter logging placeholder */
      }

      // 🎉 JSC引擎下直接使用JavaScript实现
      let apiResult;
      try {
        apiResult = await performVolunteerCheckIn(
          userId,
          operateUserId,
          operateLegalName
        );
      } catch (apiError) {
        console.error('🚨 [API-ERROR] JavaScript签到失败:', apiError);
        Alert.alert(t('common.signin_failed'), t('common.network_error_try_later'));
        return;
      }

      if (apiResult && (apiResult.code === 200 || (apiResult as any).success === true)) {
        const newState = {
          checkInStatus: 'checked_in',
          checkInTime: timeService.formatForServer(new Date()),
          checkOutTime: null,
          lastCheckInTime: timeService.formatForServer(new Date()), // 更新上次签到时间
          // 签到时不清除上次签退时间，保持历史记录
        };
        
        setVolunteers(prev => prev.map(v => 
          v.userId === userId
            ? { ...v, ...newState }
            : v
        ));

        // 清理缓存，强制下次重新获取
        screenStateRef.current.recordCache.delete(userId);
        
      } else {
        const errorMsg = apiResult?.msg || (apiResult as any)?.message || `code=${apiResult?.code ?? 'N/A'}`;
        console.error('[ERROR] 志愿者签到失败:', apiResult);
        
        // 🚨 SPECIAL HANDLING: "存在未签退记录"错误的特殊处理
        if (apiResult?.msg?.includes('存在未签退的记录') || apiResult?.msg?.includes('请先签退')) {
          
          // 自动修复：获取后端记录并同步状态
          try {
            const last = await getLastVolunteerRecord(userId);
            const lastData: any = last?.data;
            
            if (last?.code === 200 && lastData && lastData.startTime && !lastData.endTime) {
              // 后端确实处于签到状态，同步到前端
              setVolunteers(prev => prev.map(v =>
                v.userId === userId
                  ? {
                      ...v,
                      checkInStatus: 'checked_in',
                      checkInTime: (() => {
                        try {
                          const parsedTime = timeService.parseServerTime(lastData.startTime);
                          return parsedTime ? timeService.formatForServer(parsedTime) : lastData.startTime;
                        } catch (e) {
                                  return lastData.startTime;
                        }
                      })(),
                      checkOutTime: null
                    }
                  : v
              ));
              // 移除持久化逻辑

              Alert.alert(t('volunteer.status_synced'), t('volunteer.status_sync_msg'));
            } else {
              Alert.alert(t('volunteer.status_abnormal'), t('volunteer.backend_data_error'));
            }
          } catch (e) {
            Alert.alert(t('volunteer.status_sync_failed'), t('volunteer.status_sync_failed_msg'));
          }
        } else {
          // 其他错误的正常处理 - 改进用户体验
          try {
            const last = await getLastVolunteerRecord(userId);
            const lastData: any = last?.data;
            const isActuallyCheckedIn = last?.code === 200 && lastData && lastData.userId === userId && lastData.startTime && !lastData.endTime;
            if (isActuallyCheckedIn) {
              setVolunteers(prev => prev.map(v =>
                v.userId === userId
                  ? {
                      ...v,
                      checkInStatus: 'checked_in',
                      checkInTime: (() => {
                        try {
                          const parsedTime = timeService.parseServerTime(lastData.startTime);
                          return parsedTime ? timeService.formatForServer(parsedTime) : lastData.startTime;
                        } catch (e) {
                                  return lastData.startTime;
                        }
                      })(),
                      checkOutTime: null
                    }
                  : v
              ));
            } else {
              // 🚀 改进错误处理：提供更用户友好的错误信息
              let userFriendlyMessage = '签到失败，请稍后重试';
              
              if (errorMsg.includes('权限') || errorMsg.includes('permission')) {
                userFriendlyMessage = '权限不足，请联系管理员';
              } else if (errorMsg.includes('网络') || errorMsg.includes('timeout')) {
                userFriendlyMessage = '网络连接异常，请检查网络后重试';
              } else if (errorMsg.includes('重复') || errorMsg.includes('duplicate')) {
                userFriendlyMessage = '检测到重复操作，请稍后重试';
              }
              
              Alert.alert(
                '签到失败',
                userFriendlyMessage,
                [
                  { text: '刷新页面', onPress: () => loadVolunteerData(true) },
                  { text: '确定', style: 'cancel' }
                ]
              );
            }
          } catch (e) {
            Alert.alert(t('common.signin_failed'), t('volunteer.operation_abnormal'));
          }
        }
      }
    } catch (error) {
      console.error('[ERROR] 志愿者签到失败:', error);
      Alert.alert(t('common.signin_failed'), t('common.network_error_retry'));
    } finally {
      setOperationInProgress(prev => {
        const newState = { ...prev };
        delete newState[volunteerId];
        return newState;
      });
      screenStateRef.current.operationLocks.delete(volunteer.userId);
      screenStateRef.current.pendingOperations.delete(operationKey);
    }
    })();
    
    // 缓存操作promise
    screenStateRef.current.pendingOperations.set(operationKey, operationPromise);
    await operationPromise;
  };

  // 处理志愿者签退
  const handleCheckOut = async (volunteerId: string) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer?.userId) return;

    const operationKey = `checkout-${volunteer.userId}`;

    // 🚨 ENHANCED: 三重保护防止重复操作
    if (operationInProgress[volunteerId] ||
        screenStateRef.current.operationLocks.has(volunteer.userId) ||
        screenStateRef.current.pendingOperations.has(operationKey)) {
      if (__DEV__) {
        /* Operation already in progress - skip */
      }
      return;
    }

    const validation = VolunteerStateService.validateCheckOutConditions(volunteer as VolunteerInfo);
    if (!validation.isValid) {
      console.error('❌ [CHECKOUT-VALIDATION] 验证失败:', validation.error);
      Alert.alert(t('common.signout_failed'), validation.error || t('volunteer.signout_conditions_not_met'));
      return;
    }

    // 🔧 修复：直接使用志愿者真实的签到时间，确保时间显示一致性

    // 构建志愿者记录对象
    const volunteerRecord = {
      id: volunteer.id,
      userId: volunteer.userId,
      name: volunteer.legalName || volunteer.name || '志愿者',
      phone: volunteer.phonenumber || '',
      school: school?.deptName || '',
      checkInTime: volunteer.checkInTime, // 使用真实的签到时间，保持一致性
      status: 'checked_in' as const,
    };

    // 导航到全屏签退页面
    (navigation as any).navigate('VolunteerCheckOut', {
      volunteer: volunteerRecord,
    });

    // 清理操作状态（将在页面刷新后执行）
    setOperationInProgress(prev => ({ ...prev, [volunteerId]: false }));
    screenStateRef.current.operationLocks.delete(volunteer.userId);
    screenStateRef.current.pendingOperations.delete(operationKey);
  };


  // 🚨 DEPRECATED: 旧的员工判断函数，现在使用岗位服务代替
  /*
  const isUserStaffOrAdmin = (userData: UserData): boolean => {
    // 1. 检查admin字段
    if (userData?.admin === true) {
      return true;
    }
    
    // 2. 检查roles数组中的roleKey（优先使用）
    const roles = userData?.roles || [];
    if (Array.isArray(roles) && roles.length > 0) {
      const hasAdminRole = roles.some((role: UserRole) => {
        const roleKey = role.key || role.roleKey;
        return roleKey === 'manage' ||        // 总管理员
               roleKey === 'part_manage' ||   // 分管理员  
               roleKey === 'staff';           // 内部员工
      });
      if (hasAdminRole) return true;
    }
    
    // 3. 检查roleIds数组（仅管理员角色）
    const roleIds = userData?.roleIds || [];
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const hasAdminRoleId = roleIds.some((id: number) => [1, 2, 3].includes(id)); // 移除4，更严格
      if (hasAdminRoleId) return true;
    }
    
    // 4. 严格的用户名检查（移除过于宽松的模式匹配）
    const userName = userData?.userName?.toLowerCase() || '';
    
    // 只有明确的管理员用户名才通过
    if (userName === 'admin' || userName.startsWith('admin-') || userName.startsWith('eb-')) {
      return true;
    }
    
    // 移除法定姓名的模糊匹配，避免误判
    
    return false;
  };
  */


  const renderVolunteerItem = ({ item, index }: { item: any; index: number }) => {
    // 检查是否为搜索结果高亮
    const isSearchResult = searchResultIndex === index;
    
    return (
      <View style={styles.volunteerItemContainer}>
        <TouchableOpacity 
          style={[
            styles.volunteerItem,
            isSearchResult && styles.searchHighlight // 搜索结果高亮
          ]}
          onPress={() => {
            try {
              const itemId = String(item.id || '');
              setExpandedVolunteer(expandedVolunteer === itemId ? null : itemId);
              // 清除搜索高亮
              if (isSearchResult) {
                setSearchResultIndex(null);
              }
            } catch (clickError) {
              console.error('志愿者点击处理错误:', clickError);
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.volunteerContent}>
            {/* 简化的信息显示 */}
            <View style={styles.volunteerInfo}>
              <Text style={styles.volunteerName}>{String(item.name || '志愿者')}</Text>
              <Text style={styles.volunteerMajor}>{String(item.level || '岗位')}</Text>
              <Text style={styles.volunteerHours}>
                {String(item.hours || 0)}{t('wellbeing.volunteer.hours_unit')}
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
                    <Text style={styles.statusLabel}>{t('volunteer_status.check_status_label') || '签到状态:'}</Text>
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

                  {/* 2. 工作状态简单显示 */}
                  {item.checkInStatus === 'checked_in' && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('wellbeing.volunteer.work_status')}:</Text>
                      <Text style={[styles.statusValue, { color: '#34D399' }]}>
                        {t('wellbeing.volunteer.currently_working')}
                      </Text>
                    </View>
                  )}

                  {/* 3. 总计时长 */}
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>{t('volunteer_status.total_duration_label')}</Text>
                    <Text style={styles.statusValue}>
                      {`${Math.max(0, item.totalHours || 0).toFixed(1)} ${t('wellbeing.volunteer.hours_unit')}`}
                    </Text>
                  </View>

                  {/* 4. 今日签到时间 */}
                  {!!item.checkInTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.check_in_time_label') || '签到时间:'}</Text>
                      <Text style={styles.statusValue}>
                        {item.checkInTime ? item.checkInTime.substring(11, 16) : '--:--'}
                      </Text>
                    </View>
                  )}

                  {/* 5. 今日签退时间 */}
                  {!!item.checkOutTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.check_out_time_label') || '签退时间:'}</Text>
                      <Text style={styles.statusValue}>
                        {item.checkOutTime ? item.checkOutTime.substring(11, 16) : '--:--'}
                      </Text>
                    </View>
                  )}

                  {/* 6. 上次签到时间 - 仅当用户未签到且有历史签到记录时显示 */}
                  {item.checkInStatus === 'not_checked_in' && item.lastCheckInTime && !item.checkInTime && (
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusLabel, { color: '#666' }]}>
                        {t('volunteer_status.last_check_in_label') || '上次签到:'}
                      </Text>
                      <Text style={[styles.statusValue, { color: '#666' }]}>
                        {item.lastCheckInTime ? item.lastCheckInTime.substring(11, 16) : '--:--'}
                      </Text>
                    </View>
                  )}

                  {/* 7. 上次签退时间 - 仅当用户未签到且有历史签退记录时显示（不重复显示当前签退时间） */}
                  {item.checkInStatus === 'not_checked_in' && item.lastCheckOutTime && !item.checkOutTime && (
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusLabel, { color: '#666' }]}>
                        {t('volunteer_status.last_check_out_label') || '上次签退:'}
                      </Text>
                      <Text style={[styles.statusValue, { color: '#666' }]}>
                        {item.lastCheckOutTime ? item.lastCheckOutTime.substring(11, 16) : '--:--'}
                      </Text>
                    </View>
                  )}

                </View>

                {/* 操作按钮区域 */}
                <View style={styles.actionButtons}>
                  {/* 判断是否为当前用户 */}
                  {(() => {
                    // 用户识别逻辑
                    const isCurrentUser = () => {
                      // 方法1：通过 userId 匹配
                      if (item?.userId && userInfo?.userId &&
                          item.userId === userInfo.userId) {
                        return true;
                      }

                      // 方法2：通过 legalName 匹配（处理空格问题）
                      const normalizedVolunteerName = item?.name?.replace(/\s+/g, '');
                      const normalizedCurrentName = userInfo?.legalName?.replace(/\s+/g, '');

                      if (normalizedVolunteerName && normalizedCurrentName &&
                          normalizedVolunteerName === normalizedCurrentName) {
                        return true;
                      }

                      return false;
                    };

                    const isCurrentUserVolunteer = isCurrentUser();

                    return (
                      <>
                        {/* 当前用户显示签到/签退按钮 */}
                        {isCurrentUserVolunteer && (
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
                                accessibilityRole="button"
                                accessibilityLabel={`签到`}
                                accessibilityHint="点击执行签到操作"
                                accessibilityState={{ disabled: operationInProgress[item?.id] }}
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
                              <>
                                <TouchableOpacity
                                  style={[
                                    styles.actionButton,
                                    styles.checkOutBtn,
                                    operationInProgress[item?.id] && styles.disabledButton
                                  ]}
                                  onPress={() => handleCheckOut(item?.id)}
                                  disabled={operationInProgress[item?.id]}
                                  accessibilityRole="button"
                                  accessibilityLabel={`签退`}
                                  accessibilityHint="点击执行签退操作"
                                  accessibilityState={{ disabled: operationInProgress[item?.id] }}
                                >
                                  {operationInProgress[item?.id] ? (
                                    <Text style={styles.actionButtonText}>签退中...</Text>
                                  ) : (
                                    <Text style={styles.actionButtonText}>
                                      {t('volunteer_status.check_out_button') || '签退'}
                                    </Text>
                                  )}
                                </TouchableOpacity>

                                {/* 时间异常时显示重置按钮 */}
                                {(() => {
                                  // 使用统一的异常检测函数
                                  const anomaly = timeService.detectTimeAnomaly(item?.checkInTime);

                                  // 如果检测到异常，显示重置按钮
                                  if (anomaly.type) {
                                    return (
                                      <TouchableOpacity
                                        style={[
                                          styles.actionButton,
                                          styles.resetBtn,
                                          operationInProgress[item?.id] && styles.disabledButton
                                        ]}
                                        onPress={() => handleResetStatus(item?.id)}
                                        disabled={operationInProgress[item?.id]}
                                        accessibilityRole="button"
                                        accessibilityLabel={`重置状态`}
                                        accessibilityHint="重置签到状态以修复时间异常"
                                      >
                                        <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>
                                          重置状态
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  }
                                  return null;
                                })()}
                              </>
                            )}

                            {/* 补录工时按钮 - 始终显示，不依赖签到状态 */}
                            <TouchableOpacity
                              style={[styles.actionButton, styles.timeEntryBtn]}
                              onPress={() => (navigation as any).navigate('TimeEntry')}
                              accessibilityRole="button"
                              accessibilityLabel={`补录我的工时`}
                              accessibilityHint="点击补录自己的工时记录"
                            >
                              <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>
                                {t('volunteerCheckIn.timeEntry', '补录工时')}
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </>
                    );
                  })()}

                  {/* 历史记录按钮 - 所有管理员都可以查看 */}
                  {['manage', 'part_manage'].includes(permissions.getPermissionLevel()) && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.historyBtn]} // 使用统一的actionButton基础样式
                      onPress={() => handleViewVolunteerHistory(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`查看${item.name}的历史记录`}
                      accessibilityHint="点击查看此志愿者的打卡历史记录"
                    >
                      <Text style={[styles.actionButtonText, { color: '#FF6B35' }]}>
                        {t('wellbeing.volunteer.viewHistory')}
                      </Text>
                    </TouchableOpacity>
                  )}


                  {/* 权限提示信息 - 只有内部员工显示无权限提示 */}
                  {!permissions.canCheckInOut() && (
                    <View style={styles.noPermissionHint}>
                      <Text style={styles.hintText}>
                        {permissions.isStaff() ? 
                          t('wellbeing.volunteer.staffViewHint') : 
                          t('wellbeing.volunteer.viewOnly')
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

  // 用户登录检查 - 修复登出后仍能访问志愿者模块的问题
  if (!isAuthenticated || !userInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[Glass.pageBgTop, Glass.pageBgBottom, '#F8F9FA', '#F1F3F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.3, 0.7, 1]}
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{school?.deptName || t('wellbeing.school_detail')}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        
        {/* 未登录提示 */}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="person-outline" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>{t('auth.login_required')}</Text>
          <Text style={styles.emptyMessage}>{t('auth.volunteer_login_required_message')}</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => (navigation as any).navigate('Login')}
          >
            <Text style={styles.loginButtonText}>{t('auth.login.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
      {/* 背景渐变 */}
      <LinearGradient
        colors={isDarkMode ? ['#000000', '#1C1C1E', '#2C2C2E'] : [Glass.pageBgTop, Glass.pageBgBottom, '#F8F9FA', '#F1F3F4']}
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
            <Ionicons name="chevron-back" size={24} color={dmIcons.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, dmStyles.text.title]}>{t('school.volunteer_details_title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 学校信息卡片 */}
        <View style={styles.schoolCard}>
          <BlurView intensity={dmBlur.intensity} tint={dmBlur.tint} style={styles.schoolCardBlur}>
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
                  <Text style={styles.logoText}>{school?.aprName || school?.deptName?.substring(0, 2) || 'S'}</Text>
                )}
              </View>

              <View style={styles.schoolTextInfo}>
                <Text style={styles.schoolNameCN}>{getSchoolDisplayInfo().title}</Text>
                {getSchoolDisplayInfo().subtitle ? (
                  <Text style={styles.schoolNameEN}>{getSchoolDisplayInfo().subtitle}</Text>
                ) : null}
                {/* 根据用户要求移除城市地址显示 */}
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
          
          {/* 志愿者搜索功能 */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchInputIcon} />
              <TextInput
                style={[styles.searchInput, dmStyles.text.primary]}
                value={searchQuery}
                onChangeText={handleSearchInput}
                onSubmitEditing={searchVolunteer}
                placeholder={t('wellbeing.volunteer.searchVolunteers')}
                placeholderTextColor="#8E8E93"
                keyboardType="default"  // 允许输入中英文
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"  // iOS清除按钮
              />
              {isSearching && (
                <Ionicons name="sync" size={16} color="#FF6B35" style={styles.searchLoadingIcon} />
              )}
            </View>
            
            {/* 搜索错误提示 */}
            {searchError ? (
              <View style={styles.searchErrorContainer}>
                <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                <Text style={styles.searchErrorText}>{searchError}</Text>
              </View>
            ) : null}
            
            {/* 搜索结果提示 */}
            {searchResultIndex !== null && (
              <View style={styles.searchResultInfo}>
                <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                <Text style={styles.searchResultText}>
                  已定位到志愿者 ({searchResultIndex + 1}/{volunteers.length})
                </Text>
                <TouchableOpacity 
                  style={styles.clearSearchButton}
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResultIndex(null);
                    setExpandedVolunteer(null);
                  }}
                >
                  <Text style={styles.clearSearchText}>清除</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <FlatList
            ref={(ref) => { screenStateRef.current.flatList = ref; }}
            data={volunteers}
            renderItem={renderVolunteerItem}
            keyExtractor={(item) => String(item.id || Math.random())}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            onScrollToIndexFailed={(info) => {
              if (__DEV__) {
                console.warn('滚动到索引失败:', info);
              }
              // 降级处理：等待渲染完成后重试
              setTimeout(() => {
                try {
                  screenStateRef.current.flatList?.scrollToIndex({
                    index: Math.min(info.index, volunteers.length - 1),
                    animated: true,
                  });
                } catch (e) {
                  if (__DEV__) {
                    console.warn('重试滚动也失败:', e);
                  }
                }
              }, 100);
            }}
            onRefresh={() => {
              loadVolunteerData(true);
            }}
            refreshing={loading}
            ListEmptyComponent={
              loading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
                  </View>
                  <Text style={styles.loadingText}>{loadingMessage}</Text>
                  <Text style={styles.loadingProgress}>{loadingProgress}%</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{t('volunteer.empty_state.title', { defaultValue: '该学校暂无活跃志愿者' })}</Text>
                  <Text style={styles.emptySubtext}>{t('volunteer.empty_state.subtitle', { defaultValue: '只有进行过志愿活动的用户才会显示在这里' })}</Text>
                  
                </View>
              )
            }
          />
        </View>
      </ScrollView>
      
      {/* 历史记录弹窗 */}
      {selectedHistoryUser && (
        <VolunteerHistoryBottomSheet
          visible={showHistoryModal}
          onClose={handleCloseHistoryModal}
          userId={selectedHistoryUser.userId}
          userName={selectedHistoryUser.name}
          userPermission={permissions.getPermissionLevel() as 'manage' | 'part_manage' | 'staff'}
          currentUser={userInfo}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  // 搜索区域
  searchSection: {
    marginBottom: 16,
  },

  // 搜索输入容器
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  searchInputIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },

  searchLoadingIcon: {
    marginLeft: 8,
  },

  // 搜索错误提示
  searchErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },

  searchErrorText: {
    fontSize: 13,
    color: '#F59E0B',
    marginLeft: 4,
    fontWeight: '500',
  },

  // 搜索结果高亮
  searchHighlight: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },

  // 搜索结果信息
  searchResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },

  searchResultText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },

  clearSearchButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 4,
  },

  clearSearchText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
    flexWrap: 'wrap', // 允许换行
    gap: 8, // 按钮之间的间距
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

  resetBtn: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FF3B30',
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

  // 加载进度样式
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },

  loadingText: {
    fontSize: 16,
    color: Glass.textMain,
    textAlign: 'center',
    marginBottom: 8,
  },

  loadingProgress: {
    fontSize: 14,
    color: Glass.textWeak,
    textAlign: 'center',
    fontWeight: '600',
  },


  // 未登录状态样式
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },

  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  headerPlaceholder: {
    width: 44,
    height: 44,
  },

  // 历史记录按钮特殊样式 - 继承actionButton，只修改颜色
  historyBtn: {
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
  },

  // 补录工时按钮样式
  timeEntryBtn: {
    borderWidth: 1,
    borderColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
  },



});

export default VolunteerSchoolDetailScreen;