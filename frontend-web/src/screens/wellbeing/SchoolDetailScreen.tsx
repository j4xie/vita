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
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { BlurView } from '../../components/web/WebBlurView';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';
import { GlassCapsule } from '../../components/consulting/GlassCapsule';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { getVolunteerRecords, getVolunteerHours, performVolunteerCheckIn, performVolunteerCheckOut, getLastVolunteerRecord, getVolunteerStatus } from '../../services/volunteerAPI';
import { VolunteerStateService, VolunteerInfo } from '../../services/volunteerStateService';
import { getUserList } from '../../services/userStatsAPI';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { getUserPermissionLevel } from '../../types/userPermissions';
import { useUser } from '../../context/UserContext';
import { 
  VolunteerRecord, 
  VolunteerHours, 
  UserData, 
  VolunteerStatusUpdate,
  APIResponse 
} from '../../types/volunteer';
import { getCurrentToken } from '../../services/authAPI';
import { getFrontendTimeFormat } from '../../services/timeManager';
import { apiCache, CacheTTL } from '../../services/apiCache';
import { i18n } from '../../utils/i18n';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import VolunteerHistoryBottomSheet from '../../components/volunteer/VolunteerHistoryBottomSheet';
// 移除SearchBar导入，改为使用内置搜索组件


// 移除重复的持久化键定义 - 统一使用VolunteerStateService

export const SchoolDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  
  const school = (route.params as any)?.school;
  const { permissions, user: userInfo, isAuthenticated } = useUser(); // 获取用户权限和用户信息
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('正在加载...');
  
  // 历史记录弹窗状态
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState<{userId: number, name: string} | null>(null);
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
    console.log('🔄 [INIT] 志愿者状态服务已重置');
    
    return () => {
      // 🧹 统一内存清理，避免内存泄漏
      VolunteerStateService.cleanup();
      screenStateRef.current.operationLocks.clear();
      screenStateRef.current.pendingOperations.clear();
      screenStateRef.current.recordCache.clear();
      screenStateRef.current.flatList = null;
      console.log('🧹 [CLEANUP] 所有内存引用已清理');
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
          console.log(`📋 [CACHE-HIT] 用户${v.name}记录已缓存，跳过重新获取`);
          return;
        }
        
        console.log(`🔍 [EXPAND-SYNC] 开始为用户${v.name}(${v.userId})获取最新记录`);
        const last = await getLastVolunteerRecord(v.userId);
        
        if (last?.code === 200 && last?.data) {
          screenStateRef.current.recordCache.set(v.userId, last.data);
          
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
              
              const updates: Partial<VolunteerStatusUpdate> = { checkInStatus: expectedStatus };
              
              if (currentStatus === 'signed_in') {
                updates.checkInTime = backendRecord.startTime;
                updates.checkOutTime = null;
                // 移除持久化逻辑
              } else {
                updates.checkInTime = null;
                updates.checkOutTime = backendRecord.endTime;
                // 移除持久化逻辑
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
  const getCurrentDurationMinutes = (vol: VolunteerInfo) => {
    return VolunteerStateService.getCurrentDurationMinutes(vol as VolunteerInfo, new Date());
  };

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
        console.log('🔍 [SEARCH-SUCCESS] 找到志愿者:', {
          index: matchedIndex,
          name: foundVolunteer.name,
          userId: foundVolunteer.userId,
          searchQuery: query
        });
        
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
      
      console.log(`📍 [SCROLL-TO] 已跳转到志愿者 ${volunteerId}，索引 ${index}`);
    } catch (error) {
      console.error('跳转到志愿者位置失败:', error);
      // 降级处理：直接展开，不滚动
      setExpandedVolunteer(volunteerId);
    }
  };

  // 处理扫码功能 - 暂时禁用
  const handleScanQR = () => {
    // 二维码功能暂时禁用
    console.log('QR扫码功能已禁用');
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
  

  // 加载志愿者数据和活动统计
  React.useEffect(() => {
    loadVolunteerData();
    loadSchoolActivitiesCount();
  }, [school]);

  const loadVolunteerData = async (forceClearCache = false) => {
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
      setLoadingMessage('正在加载志愿者数据...');
      
      if (forceClearCache) {
        console.log('🧹 [CACHE-CLEAR] 强制清理API缓存...');
        try {
          // 清理API缓存
          if (typeof (apiCache as any)?.clearAll === 'function') {
            (apiCache as any).clearAll();
          }
        } catch (e) {
          console.warn('缓存清理失败:', e);
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
      
      console.log('🔍 SchoolDetailScreen权限和数据加载:', permissionInfo);
      
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
        filters = { userId: userInfo?.userId };
      } else {
        console.log('📊 无数据访问权限');
        setVolunteers([]);
        setLoading(false);
        return;
      }
      
      setLoadingMessage('正在获取基础数据...');
      setLoadingProgress(20);
      
      
      let recordsResult, hoursResult, userListResult;
      
      try {
        recordsResult = await getVolunteerRecords(filters);
      } catch (error) {
        recordsResult = { code: 500, msg: 'API调用失败', rows: [] };
      }
      
      try {
        hoursResult = await getVolunteerHours(filters);
      } catch (error) {
        hoursResult = { code: 500, msg: 'API调用失败', rows: [] };
      }
      
      try {
        // 🚨 直接API调用，避免getUserList函数的复杂逻辑
        const token = await getCurrentToken();
        if (!token) {
          throw new Error('未获取到token');
        }
        
        // 根据权限级别决定API调用方式
        const dataScope = permissions.getDataScope();
        if (dataScope === 'all') {
          // 总管理员：需要动态pageSize获取完整数据
          const initialResponse = await fetch(`https://www.vitaglobal.icu/system/user/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const initialData = await initialResponse.json();
          
          if (initialData.code === 200 && initialData.rows?.length < initialData.total) {
            const fullResponse = await fetch(`https://www.vitaglobal.icu/system/user/list?pageSize=${initialData.total}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const fullData = await fullResponse.json();
            userListResult = { code: fullData.code, msg: fullData.msg, data: fullData.rows };
          } else {
            userListResult = { code: initialData.code, msg: initialData.msg, data: initialData.rows };
          }
        } else {
          // 分管理员：直接使用默认API（后端已过滤）
          const response = await fetch(`https://www.vitaglobal.icu/system/user/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          userListResult = { code: data.code, msg: data.msg, data: data.rows };
        }
        
        console.log(`📊 [DIRECT-API] ${dataScope}权限用户获取: ${userListResult.data?.length || 0}个用户`);
        
      } catch (error) {
        console.error('直接API调用失败:', error);
        userListResult = { code: 500, msg: 'API调用失败', data: [] };
      }
      
      setLoadingProgress(40);
      setLoadingMessage('正在处理志愿者信息...');

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
          total: (userListResult as any)?.total || 0,
          dataLength: userListResult?.data?.length || 0
        },
      });

      // 🚀 性能优化：基于用户列表获取学校管理员和内部员工，使用并行处理
      if (userListResult?.code === 200 && userListResult?.data) {
        console.log('📊 从用户列表获取学校管理员和内部员工 (优化版本)');
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
            console.log(`🔍 [FILTER] Staff权限过滤: 用户${user.userName}不是当前用户，已过滤`);
            return false;
          }
          
          // 🚨 CRITICAL FIX: 所有权限级别都必须按学校过滤
          // 即使是总管理员，在查看特定学校时也只显示该学校的志愿者
          if (user.deptId !== school?.deptId) {
            console.log(`🔍 [FILTER] 学校过滤: 用户${user.userName}(deptId:${user.deptId})不属于当前学校${getSchoolDisplayInfo().title}(deptId:${school?.deptId})，已过滤`);
            return false;
          }
          
          console.log(`✅ [FILTER] 用户${user.userName}(deptId:${user.deptId})属于学校${getSchoolDisplayInfo().title}，通过过滤`);
          return true; // 只有属于当前学校的用户才显示
        });
        
        console.log(`🚀 [PERFORMANCE] 过滤后的用户数量: ${eligibleUsers.length} (原始: ${allUsers.length})`);
        
        
        // 第二步：并行处理所有API调用
        console.time('⚡ 并行API处理时间');
        setLoadingProgress(60);
        setLoadingMessage(`正在并行处理 ${eligibleUsers.length} 个志愿者信息...`);
        
        const userProcessingPromises = eligibleUsers.map(async (user, index) => {
          try {
            
            // 🚨 HERMES FIX: 顺序执行API调用，避免Promise.all兼容性问题
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
              console.warn(`⚠️ 无法获取用户${user.userName}的完整信息`);
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
              console.log(`🔄 [PARALLEL] 用户${user.userName}实时记录获取成功`);
            } else {
              userRecord = cachedRecord;
              console.log(`📋 [PARALLEL] 用户${user.userName}使用缓存记录`);
            }
            
            // 🎯 HERMES FIX: 极简化权限判断，避免复杂对象操作
            let positionInfo = null;
            
            try {
              // 🚨 修复：使用权限系统统一判断，而不是直接检查roles数组
              // 因为API返回的管理员用户roles为空数组，但有posts信息
              
              console.log(`🔍 [USER-ANALYSIS] 分析用户${user.userName}的权限信息:`, {
                userId: user.userId,
                userName: user.userName,
                legalName: userData.legalName,
                admin: userData.admin,
                rolesCount: userData.roles?.length || 0,
                postsCount: userData.posts?.length || 0,
                posts: userData.posts?.map((p: UserPost) => p.postCode) || []
              });
              
              // 🚨 使用统一的权限判断逻辑
              const userPermissionLevel = getUserPermissionLevel(userData);
              
              console.log(`🔍 [PERMISSION-RESULT] 用户${user.userName}权限级别:`, userPermissionLevel);
              
              // 只有管理员、分管理员、内部员工才显示在志愿者列表中
              const isVolunteerRole = ['manage', 'part_manage', 'staff'].includes(userPermissionLevel);
              
              if (!isVolunteerRole) {
                console.log(`⚠️ 用户${user.userName}权限级别为${userPermissionLevel}，不显示在志愿者列表中`);
                return null;
              }
              
              // 根据权限级别确定显示信息
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
              console.log(`✅ 用户${user.userName}岗位信息:`, positionInfo);
              
            } catch (error) {
              console.error(`❌ 用户${user.userName}权限分析失败:`, error);
              return null;
            }
            
            console.log(`🔍 [POSITION-CHECK] 用户${user.userName}岗位检查:`, {
              userId: user.userId,
              userName: user.userName,
              legalName: userData.legalName,
              hasPosition: !!positionInfo,
              positionLevel: positionInfo?.level,
              positionMajor: positionInfo?.major,
              roles: userData.roles?.map((r: UserRole) => `${r.key || r.roleKey}(${r.roleName || r.name})`) || [],
              isCurrentUser: user.userId === userInfo?.userId,
              currentUserId: userInfo?.userId,
              result: positionInfo ? '显示在列表中' : '不显示'
            });
            
            // 🚨 NEW: 如果没有岗位信息，不显示在志愿者列表中
            if (!positionInfo) {
              console.log(`⚠️ 用户${user.userName}无岗位分配，不显示在志愿者列表中`);
              return null;
            }
            
            return { user, userData, userRecord, hourRecord, positionInfo };
            
          } catch (error) {
            console.error(`❌ [CRITICAL-ERROR] 用户${user.userName}处理完全崩溃:`, error);
            return null;
          }
        });
        
        
        // 等待所有用户数据并行处理完成
        const processedUsers = await Promise.all(userProcessingPromises);
        console.timeEnd('⚡ 并行API处理时间');
        
        
        const processingResults = {
          totalUsers: eligibleUsers.length,
          processedCount: processedUsers.length,
          validResults: processedUsers.filter(r => r !== null).length,
          processedDetails: processedUsers.map((result, index) => ({
            index,
            user: eligibleUsers[index]?.userName,
            userId: eligibleUsers[index]?.userId,
            hasResult: !!result,
            positionLevel: result?.positionInfo?.level,
            roleKey: result?.userData?.roles?.[0]?.roleKey || 'none',
            reason: result ? '有岗位信息' : '被过滤'
          }))
        };
        
        console.log('🔍 [PROCESSING-RESULTS] 用户处理结果分析:', processingResults);
        
        
        setLoadingProgress(80);
        setLoadingMessage('正在构建志愿者列表...');
        
        // 第三步：构建志愿者对象（快速同步处理）
        const schoolStaff = processedUsers
          .filter(result => result !== null) // 过滤失败的处理结果
          .map(({ user, userData, userRecord, hourRecord, positionInfo }) => {
            
            // 详细检测用户的签到记录状态
            // 🚨 修复：正确处理userRecord可能是数组或单个记录的情况
            const actualRecord = Array.isArray(userRecord) ? userRecord[0] : userRecord;
            console.log(`🔍 [DATA-CHECK] 用户${user.userName}的最终记录详情:`, {
              userId: user.userId,
              hasHourRecord: !!hourRecord,
              hasUserRecord: !!actualRecord,
              isRealtimeData: !!actualRecord && actualRecord.id,
              userRecord: actualRecord ? {
                startTime: actualRecord.startTime,
                endTime: actualRecord.endTime,
                recordId: actualRecord.id
              } : null
            });
            
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
            
            console.log(`🔍 [INITIAL-STATE] 用户${user.userName}初始状态设置:`, {
              hasRecord: !!actualRecord,
              recordStatus: actualRecord ? getVolunteerStatus(actualRecord) : 'no_record',
              finalStatus: initialCheckInStatus,
              startTime: actualRecord?.startTime,
              endTime: actualRecord?.endTime
            });
            
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
              checkInTime: (initialCheckInStatus === 'checked_in' && actualRecord?.startTime) ? actualRecord.startTime : null,
              checkOutTime: (initialCheckInStatus === 'not_checked_in' && actualRecord?.endTime) ? actualRecord.endTime : null,
              totalHours: volunteerHours,
              // 🚀 正确设置历史时间：如果当前已签退，显示最后一次的签到和签退时间
              lastCheckInTime: actualRecord?.startTime || null,
              lastCheckOutTime: (actualRecord?.endTime && initialCheckInStatus === 'not_checked_in') ? actualRecord.endTime : null,
              userId: user.userId,
            };
            
            return volunteer;
          });
        
        setLoadingProgress(100);
        setLoadingMessage('加载完成');
        
        console.log(`🚀 [PERFORMANCE] 志愿者数据构建完成，总数: ${schoolStaff.length}`);
        
        
        
        
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

  
  if (!school) {
    console.error('❌ 学校信息缺失');
    
    return (
      <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
        <Text style={dmStyles.text.primary}>{t('school.not_found_message')}</Text>
      </SafeAreaView>
    );
  }

  const logoSource = getSchoolLogo(school.id);

  // 处理查看志愿者历史记录
  const handleViewVolunteerHistory = (volunteer: any) => {
    console.log('🔍 [HISTORY] 查看志愿者历史记录:', {
      志愿者: volunteer.name,
      userId: volunteer.userId,
      权限级别: permissions.getPermissionLevel()
    });
    
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
      console.warn('[DUPLICATE-CLICK] 签到操作进行中，忽略重复点击');
      return;
    }
    
    const validation = VolunteerStateService.validateCheckInConditions(volunteer as VolunteerInfo);
    if (!validation.isValid) {
      console.error('❌ [CHECKIN-VALIDATION] 验证失败:', validation.error);
      Alert.alert('签到失败', validation.error || '签到条件不满足');
      return;
    }
    
    console.log('✅ [CHECKIN-VALIDATION] 签到验证通过');
    
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
        Alert.alert('错误', '无法识别用户身份，请重试或联系管理员');
        return;
      }
      
      // 获取当前操作用户信息
      const currentUser = userInfo;
      const operateUserId = currentUser?.userId;
      const operateLegalName = currentUser?.legalName;
      
      // 🚨 关键修复：参数验证防止undefined错误
      if (!operateUserId || !operateLegalName) {
        console.error('❌ [VALIDATION] 操作用户信息缺失:', {
          hasCurrentUser: !!currentUser,
          operateUserId,
          operateLegalName,
          userInfoLoaded: !!userInfo
        });
        Alert.alert('签到失败', '无法获取操作用户信息，请重新登录或刷新页面');
        return;
      }
      
      console.log('✅ [VALIDATION] 操作用户信息验证通过:', {
        operateUserId,
        operateLegalName,
        targetUserId: userId
      });

      // 生产环境简化参数日志
      if (__DEV__) {
        console.log('🧪 [PARAMS] API调用参数:', { userId, operateUserId, operateLegalName });
      }

      // 🎉 JSC引擎下直接使用JavaScript实现
      let apiResult;
      try {
        console.log('📱 [JSC-API] 使用JavaScript签到 (JSC引擎)');
        apiResult = await performVolunteerCheckIn(
          userId,
          operateUserId,
          operateLegalName
        );
      } catch (apiError) {
        console.error('🚨 [API-ERROR] JavaScript签到失败:', apiError);
        Alert.alert('签到失败', '网络错误，请稍后重试');
        return;
      }

      if (apiResult && (apiResult.code === 200 || (apiResult as any).success === true)) {
        const newState = {
          checkInStatus: 'checked_in',
          checkInTime: getFrontendTimeFormat(),
          checkOutTime: null,
          lastCheckInTime: getFrontendTimeFormat(), // 更新上次签到时间
          // 签到时不清除上次签退时间，保持历史记录
        };
        
        setVolunteers(prev => prev.map(v => 
          v.userId === userId
            ? { ...v, ...newState }
            : v
        ));

        // 清理缓存，强制下次重新获取
        screenStateRef.current.recordCache.delete(userId);
        
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
            const lastData: VolunteerRecord = last?.data;
            
            if (last?.code === 200 && lastData && lastData.startTime && !lastData.endTime) {
              // 后端确实处于签到状态，同步到前端
              setVolunteers(prev => prev.map(v => 
                v.userId === userId
                  ? { ...v, checkInStatus: 'checked_in', checkInTime: lastData.startTime, checkOutTime: null }
                  : v
              ));
              // 移除持久化逻辑
              console.log('[AUTO-SYNC] 已自动同步为签到状态，用户现在可以点击签退');
              
              Alert.alert('状态已同步', '检测到您已处于签到状态，现在可以进行签退操作');
            } else {
              Alert.alert('状态异常', '后端数据异常，请联系管理员');
            }
          } catch (e) {
            Alert.alert('状态同步失败', '无法同步后端状态，请重新加载页面');
          }
        } else {
          // 其他错误的正常处理 - 改进用户体验
          try {
            const last = await getLastVolunteerRecord(userId);
            const lastData: VolunteerRecord = last?.data;
            const isActuallyCheckedIn = last?.code === 200 && lastData && lastData.userId === userId && lastData.startTime && !lastData.endTime;
            if (isActuallyCheckedIn) {
              setVolunteers(prev => prev.map(v => 
                v.userId === userId
                  ? { ...v, checkInStatus: 'checked_in', checkInTime: lastData.startTime, checkOutTime: null }
                  : v
              ));
              console.log('[RECOVERY] 后端返回失败但状态为已签到，已根据最后记录修复');
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
            Alert.alert('签到失败', '操作异常，请刷新页面后重试');
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
      console.warn('[DUPLICATE-CLICK] 签退操作进行中，忽略重复点击');
      return;
    }
    
    const validation = VolunteerStateService.validateCheckOutConditions(volunteer as VolunteerInfo);
    if (!validation.isValid) {
      console.error('❌ [CHECKOUT-VALIDATION] 验证失败:', validation.error);
      Alert.alert('签退失败', validation.error || '签退条件不满足');
      return;
    }
    
    console.log('✅ [CHECKOUT-VALIDATION] 签退验证通过');
    
    // 设置操作状态和锁
    setOperationInProgress(prev => ({ ...prev, [volunteerId]: true }));
    screenStateRef.current.operationLocks.add(volunteer.userId);
    
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
      
      // 获取当前操作用户信息
      const currentUser = userInfo;
      const operateUserId = currentUser?.userId;
      const operateLegalName = currentUser?.legalName;

      // 🚨 关键修复：参数验证防止undefined错误
      if (!operateUserId || !operateLegalName) {
        console.error('❌ [VALIDATION] 操作用户信息缺失:', {
          hasCurrentUser: !!currentUser,
          operateUserId,
          operateLegalName,
          userInfoLoaded: !!userInfo
        });
        Alert.alert('签退失败', '无法获取操作用户信息，请重新登录或刷新页面');
        return;
      }
      
      console.log('✅ [VALIDATION] 操作用户信息验证通过:', {
        operateUserId,
        operateLegalName,
        targetUserId: userId
      });

      // 生产环境简化参数日志
      if (__DEV__) {
        console.log('🧪 [PARAMS] API调用参数:', { userId, operateUserId, operateLegalName });
      }

      // 🎉 JSC引擎下直接使用JavaScript实现
      let apiResult;
      try {
        console.log('📱 [JSC-API] 使用JavaScript签退 (JSC引擎)');
        apiResult = await performVolunteerCheckOut(
          userId,
          operateUserId,
          operateLegalName
        );
      } catch (apiError) {
        console.error('🚨 [API-ERROR] JavaScript签退失败:', apiError);
        Alert.alert('签退失败', '网络错误，请稍后重试');
        return;
      }
      
      console.log(`🔍 [CHECKOUT-API] 签退API响应:`, {
        user: volunteerName,
        result: apiResult,
        success: apiResult?.code === 200,
        errorMsg: apiResult?.msg || (apiResult as any)?.message
      });

      if (apiResult && (apiResult.code === 200 || (apiResult as any).success === true)) {
        // 🚀 签退成功：计算工作时长并发送通知
        const currentVolunteer = volunteers.find(v => v.userId === userId);
        const actualStartTime = currentVolunteer?.checkInTime;
        
        if (actualStartTime) {
          // 计算实际工作时长用于通知
          const startDate = new Date(actualStartTime);
          const endDate = new Date();
          const durationMs = endDate.getTime() - startDate.getTime();
          
          if (durationMs > 0) {
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            const durationText = hours > 0 
              ? (minutes > 0 ? 
                  (i18n.language === 'en-US' ? `${hours} hours ${minutes} minutes` : `${hours}小时${minutes}分钟`) :
                  (i18n.language === 'en-US' ? `${hours} hours` : `${hours}小时`))
              : (i18n.language === 'en-US' ? `${Math.max(1, minutes)} minutes` : `${Math.max(1, minutes)}分钟`);
            
            console.log('🕐 [LOCAL-DURATION] 计算本地工作时长:', {
              startTime: actualStartTime,
              endTime: endDate.toISOString(),
              duration: durationText
            });
            
            // 简化通知处理
            console.log('✅ 签退成功，工作时长:', durationText);
          }
        }
        
        // 更新前端状态 - 添加上次签到和签退时间
        const newState = {
          checkInStatus: 'not_checked_in',
          checkInTime: null,
          checkOutTime: getFrontendTimeFormat(),
          lastCheckInTime: currentVolunteer?.checkInTime, // 保存当前签到时间作为上次签到
          lastCheckOutTime: getFrontendTimeFormat(), // 设置当前时间为上次签退时间
        };
        
        setVolunteers(prev => prev.map(v => 
          v.userId === userId
            ? { ...v, ...newState }
            : v
        ));

        // 移除持久化逻辑
        
        // 🔄 更新历史记录缓存 - 签退成功后更新记录缓存
        const cachedRecord = screenStateRef.current.recordCache.get(userId);
        if (cachedRecord) {
          const updatedRecord = {
            ...cachedRecord,
            id: userId, // 使用userId作为标识
            endTime: getFrontendTimeFormat(),
            type: 2 // 标记为签退记录
          };
          screenStateRef.current.recordCache.set(userId, updatedRecord);
          console.log(`🔄 [CACHE-UPDATE] 签退成功后更新用户${userId}历史记录缓存，结束时间: ${getFrontendTimeFormat()}`);
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
        
        // 🚀 改进错误处理：提供更用户友好的错误信息
        let userFriendlyMessage = '操作失败，请稍后重试';
        
        if (errorMsg.includes('12小时') || errorMsg.includes('超时')) {
          userFriendlyMessage = '工作时间过长，请联系管理员处理签退';
        } else if (errorMsg.includes('权限') || errorMsg.includes('permission')) {
          userFriendlyMessage = '权限不足，请联系管理员';
        } else if (errorMsg.includes('网络') || errorMsg.includes('timeout')) {
          userFriendlyMessage = '网络连接异常，请检查网络后重试';
        } else if (errorMsg.includes('记录') || errorMsg.includes('record')) {
          userFriendlyMessage = '签到记录异常，请刷新页面后重试';
        }
        
        Alert.alert(
          '签退失败',
          userFriendlyMessage,
          [
            { text: '刷新页面', onPress: () => loadVolunteerData(true) },
            { text: '确定', style: 'cancel' }
          ]
        );
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
      screenStateRef.current.operationLocks.delete(volunteer.userId);
      screenStateRef.current.pendingOperations.delete(operationKey);
    }
    })();
    
    // 缓存操作promise
    screenStateRef.current.pendingOperations.set(operationKey, operationPromise);
    await operationPromise;
  };

  // 简单的时间格式化函数
  const formatChineseDateTime = (timeString: string) => {
    try {
      if (!timeString) return '--:--';
      
      // 简单解析，保持原始时区信息
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '--:--';
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      // 使用设备本地时区显示时间
      const time = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      return isToday ? 
        (i18n.language === 'en-US' ? `Today ${time}` : `今日 ${time}`) : 
        `${date.getMonth() + 1}/${date.getDate()} ${time}`;
    } catch (error) {
      console.warn('时间格式化失败:', error);
      return '--:--';
    }
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
      
      console.log('🏫 学校活动统计模式:', {
        mode: isLoggedIn ? '个性化统计' : '基础统计'
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
              console.log('[VOLUNTEER-CLICK] 点击志愿者:', String(item.name || '未知'));
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
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.checkInTime)}</Text>
                    </View>
                  )}

                  {/* 5. 今日签退时间 */}
                  {!!item.checkOutTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.check_out_time_label') || '签退时间:'}</Text>
                      <Text style={styles.statusValue}>{formatChineseDateTime(item.checkOutTime)}</Text>
                    </View>
                  )}

                  {/* 6. 上次签到时间 - 仅当用户未签到且有历史签到记录时显示 */}
                  {item.checkInStatus === 'not_checked_in' && item.lastCheckInTime && !item.checkInTime && (
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusLabel, { color: '#666' }]}>
                        {t('volunteer_status.last_check_in_label') || '上次签到:'}
                      </Text>
                      <Text style={[styles.statusValue, { color: '#666' }]}>
                        {formatChineseDateTime(item.lastCheckInTime)}
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
                        {formatChineseDateTime(item.lastCheckOutTime)}
                      </Text>
                    </View>
                  )}

                  {/* 8. 当前工作时长 - 仅在已签到时显示 */}
                  {item.checkInStatus === 'checked_in' && item.checkInTime && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>{t('volunteer_status.current_duration_label') || '当前工作时长:'}</Text>
                      <Text style={[styles.statusValue, { color: '#059669', fontWeight: '700' }]}>
                        {formatDuration(getCurrentDurationMinutes(item))}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 签到签退按钮 - 根据权限显示 */}
                <View style={styles.actionButtons}>
                  {/* 权限检查：简单的roleKey权限控制 */}
                  {permissions.canCheckInOut() && (
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
                          accessibilityLabel={`为志愿者${item.name}签到`}
                          accessibilityHint="点击为此志愿者执行签到操作"
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
                        <TouchableOpacity 
                          style={[
                            styles.actionButton, 
                            styles.checkOutBtn,
                            operationInProgress[item?.id] && styles.disabledButton
                          ]}
                          onPress={() => handleCheckOut(item?.id)}
                          disabled={operationInProgress[item?.id]}
                          accessibilityRole="button"
                          accessibilityLabel={`为志愿者${item.name}签退`}
                          accessibilityHint="点击为此志愿者执行签退操作"
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
                      )}
                    </>
                  )}

                  {/* 历史记录按钮 - 管理员可查看志愿者历史，与签到按钮同行 */}
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
            onPress={() => navigation.navigate('Login')}
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
              console.warn('滚动到索引失败:', info);
              // 降级处理：等待渲染完成后重试
              setTimeout(() => {
                try {
                  screenStateRef.current.flatList?.scrollToIndex({
                    index: Math.min(info.index, volunteers.length - 1),
                    animated: true,
                  });
                } catch (e) {
                  console.warn('重试滚动也失败:', e);
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
                  <Text style={styles.emptyText}>{t('volunteer.empty_state.title') || '该学校暂无活跃志愿者'}</Text>
                  <Text style={styles.emptySubtext}>{t('volunteer.empty_state.subtitle') || '只有进行过志愿活动的用户才会显示在这里'}</Text>
                  
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
          userPermission={permissions.getPermissionLevel()}
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

});

export default SchoolDetailScreen;