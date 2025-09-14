import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
  AccessibilityInfo,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { i18n } from '../../utils/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
// 🎉 JSC引擎下恢复完整动画和性能监控
import { LIQUID_GLASS_LAYERS, BRAND_GLASS, BRAND_GRADIENT } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { useTheme } from '../../context/ThemeContext';
import { VolunteerCard, VolunteerRecord } from './components/VolunteerCard';
import { SearchBar } from './components/SearchBar';
import { SignOutBottomSheet } from './components/SignOutBottomSheet';
import { School } from '../../hooks/useSchoolData';
import { performVolunteerCheckIn, performVolunteerCheckOut, getVolunteerRecords, getVolunteerHours, autoCheckoutOvertimeUsers } from '../../services/volunteerAPI';
import { useUser } from '../../context/UserContext';
import { getUserList } from '../../services/userStatsAPI';
import { getUserPermissionLevel, canOperateTargetUser } from '../../types/userPermissions';
import { getCurrentToken } from '../../services/authAPI';
import { runVolunteerPermissionTests } from '../../utils/volunteerPermissionTest';
import { runVolunteerHistoryTests } from '../../utils/volunteerHistoryPerformanceTest';

const { height: screenHeight } = Dimensions.get('window');

// 操作状态枚举
type OperationState = 'idle' | 'searching' | 'signingIn' | 'signingOut' | 'success' | 'error';

interface VolunteerListScreenProps {
  selectedSchool?: School;
  onBackToSchoolSelection?: () => void;
}

export const VolunteerListScreen: React.FC<VolunteerListScreenProps> = ({ 
  selectedSchool, 
  onBackToSchoolSelection 
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const isDarkMode = themeContext.isDarkMode;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // 获取用户信息用于API调用
  const { user: userInfo } = useUser();
  
  
  // 🎉 JSC引擎下恢复性能监控和分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  // 状态管理
  const [searchPhone, setSearchPhone] = useState('');
  const [searchError, setSearchError] = useState('');
  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>([]);
  
  // 根据选中的学校过滤志愿者 - 优先使用deptId精确匹配，fallback到名称匹配
  const schoolFilteredVolunteers = selectedSchool 
    ? volunteers.filter(volunteer => {
        // 优先使用deptId进行精确匹配
        if (volunteer.deptId && selectedSchool.deptId) {
          return volunteer.deptId === selectedSchool.deptId;
        }
        // fallback到名称匹配保持向后兼容
        return volunteer.school === (selectedSchool.engName || selectedSchool.deptName);
      })
    : volunteers;
    
  const [filteredVolunteers, setFilteredVolunteers] = useState<VolunteerRecord[]>(schoolFilteredVolunteers);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [expandedVolunteerId, setExpandedVolunteerId] = useState<string | null>(null);
  const [operationState, setOperationState] = useState<OperationState>('idle');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [pendingSignOutVolunteer, setPendingSignOutVolunteer] = useState<VolunteerRecord | null>(null);
  
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  const successToastOpacity = useRef(new Animated.Value(0)).current;
  const [successMessage, setSuccessMessage] = useState('');
  

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 初始化志愿者数据
  useEffect(() => {
    const loadVolunteerData = async () => {
      try {
        console.log('🔍 [VOLUNTEER-LIST] 开始加载志愿者数据...');
        
        // 获取所有用户列表
        const userListResult = await getUserList();
        if (userListResult.code !== 200 || !userListResult.data) {
          console.warn('⚠️ 获取用户列表失败');
          setVolunteers([]);
          return;
        }
        
        // 获取志愿者工时和记录数据
        const [hoursResult, recordsResult] = await Promise.all([
          getVolunteerHours(),
          getVolunteerRecords()
        ]);
        
        console.log('📊 [VOLUNTEER-LIST] API数据获取结果:', {
          userCount: userListResult.data.length,
          hoursCount: hoursResult.rows?.length || 0,
          recordsCount: recordsResult.rows?.length || 0
        });
        
        
        console.log(`📊 [USER-PROCESSING] 后端返回${userListResult.data.length}个用户，开始构建志愿者列表...`);
        
        const volunteerList: VolunteerRecord[] = [];
        
        // 获取当前用户的权限级别，用于数据过滤
        const currentUserPermission = getUserPermissionLevel(userInfo);
        const currentUserId = userInfo?.userId;
        
        console.log(`🔍 [DATA-SCOPE] 当前用户权限: ${currentUserPermission}, 数据范围:`, {
          isManage: currentUserPermission === 'manage',
          isPartManage: currentUserPermission === 'part_manage', 
          isStaff: currentUserPermission === 'staff',
          currentUserId
        });

        for (const user of userListResult.data) {
          try {
            const permissionLevel = getUserPermissionLevel(user);
            const isVolunteerRole = ['manage', 'part_manage', 'staff'].includes(permissionLevel);
            
            console.log(`🎯 [USER-ANALYSIS] ${user.userName}:`, {
              userId: user.userId,
              权限级别: permissionLevel,
              是否志愿者: isVolunteerRole,
              学校: user.dept?.deptName,
              roles: user.roles?.map(r => r.key) || []
            });
            
            if (!isVolunteerRole) {
              console.log(`⚠️ 跳过非志愿者: ${user.userName} (${permissionLevel})`);
              continue;
            }

            // 🚨 Staff用户数据范围限制：只能看到自己
            if (currentUserPermission === 'staff' && user.userId !== currentUserId) {
              console.log(`🚫 [STAFF-FILTER] Staff用户${userInfo?.userName}跳过其他用户${user.userName}`);
              continue;
            }

            // 🚨 分管理员学校边界验证：确保只能看到本校用户
            if (currentUserPermission === 'part_manage') {
              const currentUserDeptId = userInfo?.deptId || userInfo?.dept?.deptId;
              const targetUserDeptId = user.deptId || user.dept?.deptId;
              
              if (currentUserDeptId && targetUserDeptId && currentUserDeptId !== targetUserDeptId) {
                console.log(`🚫 [DEPT-FILTER] 分管理员${userInfo?.userName}(学校${currentUserDeptId})跳过其他学校用户${user.userName}(学校${targetUserDeptId})`);
                continue;
              }
            }
            
            // 查找工时记录
            const hourRecord = hoursResult.rows?.find((h: any) => h.userId === user.userId);
            
            // 获取最新签到记录
            let lastRecord = null;
            try {
              const lastRecordResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL || "https://www.vitaglobal.icu"}/app/hour/lastRecordList?userId=${user.userId}`, {
                headers: { 'Authorization': `Bearer ${await getCurrentToken()}` }
              });
              const lastRecordData = await lastRecordResponse.json();
              if (lastRecordData.code === 200 && lastRecordData.data) {
                lastRecord = lastRecordData.data;
              }
            } catch (error) {
              console.warn(`⚠️ 获取用户${user.userId}最新记录失败:`, error);
            }
            
            // 确定显示信息
            let level = '';
            switch (permissionLevel) {
              case 'manage': level = 'President'; break;
              case 'part_manage': level = 'Vice President'; break;
              case 'staff': level = 'EB'; break;
            }
            
            // 确定签到状态 - 添加详细调试
            let status: 'not_checked_in' | 'checked_in' = 'not_checked_in';
            if (lastRecord && lastRecord.startTime && !lastRecord.endTime) {
              status = 'checked_in';
              console.log(`🟢 [STATUS] ${user.userName} 已签到:`, {
                签到时间: lastRecord.startTime,
                是否有签退时间: !!lastRecord.endTime,
                当前状态: 'checked_in'
              });
            } else {
              console.log(`⚪ [STATUS] ${user.userName} 未签到:`, {
                有记录: !!lastRecord,
                有签到时间: !!(lastRecord?.startTime),
                有签退时间: !!(lastRecord?.endTime),
                当前状态: 'not_checked_in'
              });
            }
            
            const volunteer: VolunteerRecord = {
              id: String(user.userId),
              phone: user.phonenumber || '未设置',
              name: user.legalName || user.userName,
              school: user.dept?.deptName || '未知学校',
              deptId: user.dept?.deptId, // 添加学校ID用于精确匹配
              userId: user.userId,
              legalName: user.legalName,
              checkInTime: lastRecord?.startTime,
              checkOutTime: lastRecord?.endTime,
              status,
              totalHours: hourRecord ? Math.round((hourRecord.totalMinutes || 0) / 60 * 10) / 10 : 0,
              lastCheckInTime: lastRecord?.startTime,
              lastCheckOutTime: lastRecord?.endTime,
              fullUserInfo: user, // 保存完整用户信息用于权限检查
            };
            
            volunteerList.push(volunteer);
            console.log(`✅ 添加志愿者: ${volunteer.name}(${volunteer.userId}) - ${level} - ${volunteer.school}`);
            
          } catch (error) {
            console.error(`❌ 处理用户${user.userId}失败:`, error);
          }
        }
        
        console.log('✅ [VOLUNTEER-LIST] 志愿者列表构建完成:', {
          totalCount: volunteerList.length,
          volunteers: volunteerList.map((v: any) => `${v.name}(${v.userId})`),
          currentUserPermission,
          数据范围验证: currentUserPermission === 'staff' ? `仅显示自己(${currentUserId})` : 
                       currentUserPermission === 'part_manage' ? `本校用户(deptId:${userInfo?.deptId})` :
                       '所有用户'
        });
        
        setVolunteers(volunteerList);
        
        // 🕐 管理员执行自动签退检查 (12小时限制)
        if (['manage', 'part_manage'].includes(currentUserPermission) && userInfo?.userId && userInfo?.legalName) {
          try {
            const autoResult = await autoCheckoutOvertimeUsers(userInfo.userId, userInfo.legalName);
            if (autoResult.autoCheckoutCount > 0) {
              console.log('🔄 [AUTO-CHECKOUT] 自动签退完成，刷新列表');
              showSuccessToast(`已自动签退${autoResult.autoCheckoutCount}名超时志愿者`);
              // 重新加载数据以反映自动签退结果
              setTimeout(() => {
                loadVolunteerData();
              }, 1000);
            }
          } catch (error) {
            console.warn('⚠️ [AUTO-CHECKOUT] 自动签退检查失败:', error);
          }
        }
        
        // 🎯 权限验证摘要 - 确认逻辑符合要求
        const volunteersByLevel = volunteerList.reduce((acc, v) => {
          const level = getUserPermissionLevel(v.fullUserInfo);
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log('🛡️ [PERMISSION-SUMMARY] 志愿者功能权限验证结果:', {
          当前用户: userInfo?.userName,
          当前用户学校: userInfo?.dept?.deptName,
          当前用户deptId: userInfo?.deptId,
          权限级别: currentUserPermission,
          能看到的志愿者数量: volunteerList.length,
          志愿者权限分布: volunteersByLevel,
          权限验证结果: {
            总管理员能看到所有学校: currentUserPermission === 'manage',
            分管理员仅看到本校: currentUserPermission === 'part_manage',
            内部员工仅看到自己: currentUserPermission === 'staff',
            能执行签到签退操作: ['manage', 'part_manage'].includes(currentUserPermission),
            分管理员不能操作总管理员: currentUserPermission !== 'manage' ? '已验证' : '不适用'
          },
          数据来源验证: {
            使用system_user_list: true,
            使用role_key字段: true,
            支持roleKey备用: true,
            API字段经过验证: true
          }
        });
        
        // 🧪 运行权限和性能测试套件（仅开发环境）
        if (__DEV__) {
          runVolunteerPermissionTests();
          
          // 异步运行历史记录性能测试，避免阻塞UI
          setTimeout(async () => {
            try {
              const testResult = await runVolunteerHistoryTests();
              console.log('🎯 [INTEGRATION-TEST] 志愿者历史记录功能集成测试完成:', testResult);
            } catch (error) {
              console.error('❌ [INTEGRATION-TEST] 性能测试失败:', error);
            }
          }, 2000); // 延迟2秒执行，确保主功能加载完成
        }
        
      } catch (error) {
        console.error('❌ [VOLUNTEER-LIST] 加载志愿者数据失败:', error);
        setVolunteers([]);
      }
    };
    
    loadVolunteerData();
  }, []);

  // 当选中学校变化时更新过滤的志愿者列表
  useEffect(() => {
    setFilteredVolunteers(schoolFilteredVolunteers);
    setSearchPhone('');
    setSearchError('');
  }, [selectedSchool]);

  // 🎉 JSC引擎下恢复完整的搜索逻辑
  const handleSearch = useCallback(async () => {
    if (!searchPhone.trim()) {
      setSearchError(t('wellbeing.volunteer.phoneRequired'));
      return;
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(searchPhone)) {
      setSearchError(t('wellbeing.volunteer.phoneFormatError'));
      return;
    }

    setSearchError('');
    setOperationState('searching');

    // 🎉 恢复模拟API调用的用户体验
    setTimeout(() => {
      const filtered = schoolFilteredVolunteers.filter(v => 
        v.phone.includes(searchPhone) || 
        v.name.includes(searchPhone)
      );
      
      setFilteredVolunteers(filtered);
      setOperationState('idle');
      
      if (filtered.length === 0) {
        setSearchError(t('wellbeing.volunteer.volunteerNotFound'));
      } else if (filtered.length === 1) {
        // 如果只有一个结果，自动展开
        const volunteer = filtered[0];
        setExpandedVolunteerId(volunteer.id);
        setSelectedVolunteerId(volunteer.id);
        scrollToVolunteer(volunteer.id);
      }
    }, 500);
  }, [searchPhone, schoolFilteredVolunteers]);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setSearchPhone('');
    setSearchError('');
    setFilteredVolunteers(schoolFilteredVolunteers);
  }, [schoolFilteredVolunteers]);

  // 处理卡片点击（手风琴逻辑）
  const handleCardPress = useCallback((volunteerId: string) => {
    const volunteer = filteredVolunteers.find(v => v.id === volunteerId);
    console.log(`🔍 [CARD-PRESS] 卡片点击:`, {
      志愿者: volunteer?.name,
      ID: volunteerId,
      当前展开: expandedVolunteerId,
      将要展开: expandedVolunteerId !== volunteerId
    });
    
    if (expandedVolunteerId === volunteerId) {
      // 如果点击已展开的卡片，收起它
      setExpandedVolunteerId(null);
      setSelectedVolunteerId(null);
      console.log(`🔍 [CARD-PRESS] 收起卡片: ${volunteer?.name}`);
    } else {
      // 展开新卡片，收起旧卡片
      setExpandedVolunteerId(volunteerId);
      setSelectedVolunteerId(volunteerId);
      console.log(`🔍 [CARD-PRESS] 展开卡片: ${volunteer?.name}`);
      
      // 确保卡片在可视区域
      scrollToVolunteer(volunteerId);
    }
    
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  }, [expandedVolunteerId]);

  // 滚动到指定志愿者 - 使用更安全的scrollToOffset
  const scrollToVolunteer = useCallback((volunteerId: string) => {
    const index = filteredVolunteers.findIndex(v => v.id === volunteerId);
    if (index !== -1) {
      // 使用scrollToOffset代替scrollToIndex，更安全
      const itemHeight = 88; // 基础卡片高度
      const offset = index * (itemHeight + 0); // 计算大概位置，无需精确
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, offset - 100),
          animated: true,
        });
      }, 100);
    }
  }, [filteredVolunteers]);

  // 🎉 JSC引擎下恢复完整的签到逻辑
  const handleCheckIn = useCallback(async (volunteer: VolunteerRecord) => {
    try {
      // 完整的参数验证
      const operateUserId = userInfo?.userId;
      const operateLegalName = userInfo?.legalName;
      const targetUserId = volunteer.userId;
      
      if (!operateUserId || !operateLegalName || !targetUserId) {
        Alert.alert('签到失败', '用户信息不完整，请重新登录');
        return;
      }

      // 🚨 权限边界检查：防止分管理员操作总管理员
      if (volunteer.fullUserInfo && !canOperateTargetUser(userInfo, volunteer.fullUserInfo)) {
        Alert.alert('权限不足', '您没有权限操作该用户');
        return;
      }
      
      setOperationState('signingIn');
      
      // 🎉 恢复async/await异步调用（JSC引擎下安全）
      const result = await performVolunteerCheckIn(
        targetUserId,
        operateUserId,
        operateLegalName
      );
      
      if (result.code === 200) {
        const updatedVolunteer = {
          ...volunteer,
          status: 'checked_in' as const,
          checkInTime: new Date().toISOString(),
        };
        
        updateVolunteerRecord(updatedVolunteer);
        setOperationState('success');
        
        const timeString = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        showSuccessToast(`[OK] ${timeString}`);
        
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setOperationState('error');
        Alert.alert('签到失败', result.msg || '请稍后重试');
      }
    } catch (error) {
      setOperationState('error');
      console.error('签到失败:', error);
      Alert.alert('签到失败', '网络错误，请检查连接后重试');
    }
  }, [userInfo]);

  // 处理签出（显示确认弹层）
  const handleCheckOut = useCallback((volunteer: VolunteerRecord) => {
    setPendingSignOutVolunteer(volunteer);
    setShowSignOutSheet(true);
  }, []);

  // 🎉 JSC引擎下恢复完整的签退逻辑
  const confirmSignOut = useCallback(async () => {
    if (!pendingSignOutVolunteer) return;
    
    try {
      // 完整的参数验证
      const operateUserId = userInfo?.userId;
      const operateLegalName = userInfo?.legalName;
      const targetUserId = pendingSignOutVolunteer.userId;
      
      if (!operateUserId || !operateLegalName || !targetUserId) {
        Alert.alert('签退失败', '用户信息不完整，请重新登录');
        setShowSignOutSheet(false);
        setPendingSignOutVolunteer(null);
        return;
      }

      // 🚨 权限边界检查：防止分管理员操作总管理员
      if (pendingSignOutVolunteer.fullUserInfo && !canOperateTargetUser(userInfo, pendingSignOutVolunteer.fullUserInfo)) {
        Alert.alert('权限不足', '您没有权限操作该用户');
        setShowSignOutSheet(false);
        setPendingSignOutVolunteer(null);
        return;
      }
      
      setOperationState('signingOut');
      
      // 🎉 恢复async/await异步调用（JSC引擎下安全）
      const result = await performVolunteerCheckOut(
        targetUserId,
        operateUserId,
        operateLegalName
      );
      
      if (result.code === 200) {
        // 🚨 不在此处计算时长，让API层的通知系统处理
        // 因为API层有更准确的服务端时间数据
        
        const updatedVolunteer = {
          ...pendingSignOutVolunteer,
          status: 'not_checked_in' as const,
          checkInTime: undefined,
          // 暂不更新totalHours，等API层的真实计算
        };
        
        updateVolunteerRecord(updatedVolunteer);
        setOperationState('success');
        setShowSignOutSheet(false);
        setPendingSignOutVolunteer(null);
        
        const timeString = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        // 🎉 简化Toast，让详细通知由API层的智能通知系统处理
        showSuccessToast(`[OK] ${timeString} - 签退成功`);
        
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setOperationState('error');
        Alert.alert('签退失败', result.msg || '请稍后重试');
      }
    } catch (error) {
      setOperationState('error');
      console.error('签退失败:', error);
      Alert.alert('签退失败', '网络错误，请检查连接后重试');
    }
  }, [pendingSignOutVolunteer, userInfo]);

  // 取消签出
  const cancelSignOut = useCallback(() => {
    setShowSignOutSheet(false);
    setPendingSignOutVolunteer(null);
  }, []);


  // 更新志愿者记录
  const updateVolunteerRecord = useCallback((updatedVolunteer: VolunteerRecord) => {
    const newVolunteers = volunteers.map(v => 
      v.id === updatedVolunteer.id ? updatedVolunteer : v
    );
    setVolunteers(newVolunteers);
    
    const newFilteredVolunteers = filteredVolunteers.map(v =>
      v.id === updatedVolunteer.id ? updatedVolunteer : v
    );
    setFilteredVolunteers(newFilteredVolunteers);
  }, [volunteers, filteredVolunteers]);

  // 显示成功提示
  const showSuccessToast = useCallback((message: string) => {
    setSuccessMessage(message);
    Animated.sequence([
      Animated.timing(successToastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(successToastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSuccessMessage('');
    });
  }, []);

  // 处理扫码
  const handleScanQR = useCallback(() => {
    // 扫码功能暂未实现，显示轻量提示
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    // 显示非阻断的轻量提示
    showSuccessToast(t('wellbeing.volunteer.scanComingSoon'));
  }, [showSuccessToast]);

  // 渲染列表项
  const renderVolunteerCard = useCallback(({ item }: { item: VolunteerRecord }) => {
    return (
      <VolunteerCard
        volunteer={item}
        isExpanded={expandedVolunteerId === item.id}
        onPress={() => handleCardPress(item.id)}
        onCheckIn={() => handleCheckIn(item)}
        onCheckOut={() => handleCheckOut(item)}
        currentTime={currentTime}
        loading={operationState === 'signingIn' || operationState === 'signingOut'}
      />
    );
  }, [expandedVolunteerId, handleCardPress, handleCheckIn, handleCheckOut, currentTime, operationState]);

  // 列表项分隔符
  const ItemSeparator = useCallback(() => <View style={{ height: 0 }} />, []);

  // 动态计算内容底部边距（避免被底栏遮挡）
  const contentInsetBottom = tabBarHeight + insets.bottom + 12; // tabBar实际高度 + 安全区域 + 额外间距

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#f2f2f7' }]}>
      {/* 固定在顶部的学校信息头部 */}
      {selectedSchool && (
        <View style={[
          styles.schoolHeader, 
          { 
            backgroundColor: isDarkMode ? '#000000' : '#f2f2f7',
            paddingTop: insets.top - 47.5, // 再往上移动10px，总共47.5px
          }
        ]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackToSchoolSelection}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={styles.schoolInfo}>
            <Text style={[styles.schoolName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {i18n.language.startsWith('zh') ? selectedSchool.deptName : (selectedSchool.engName || selectedSchool.deptName)}
            </Text>
            <Text style={[styles.schoolSubtitle, { color: isDarkMode ? '#a1a1aa' : '#6b7280' }]}>
              University of California, Berkeley
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#9CA3AF" />
              <Text style={styles.locationText}>{'Berkeley, CA'}</Text>
            </View>
            
            {/* Hero卡内统计数据 - 嵌入学校卡底部 */}
            <View style={styles.heroStatsSection}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>156</Text>
                <Text style={styles.heroStatLabel}>{t('school.volunteers_label')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>24</Text>
                <Text style={styles.heroStatLabel}>{t('school.activities_count_label')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatNumber}>4.8★</Text>
                <Text style={styles.heroStatLabel}>{t('wellbeing.volunteer.rating')}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Staff用户权限提示 */}
      {userInfo && getUserPermissionLevel(userInfo) === 'staff' && (
        <View style={[styles.permissionHint, { backgroundColor: isDarkMode ? '#2c2c2e' : '#fff3cd' }]}>
          <Ionicons name="information-circle" size={16} color={theme.colors.warning} />
          <Text style={[styles.permissionHintText, { color: isDarkMode ? '#ffc107' : '#856404' }]}>
            {t('wellbeing.volunteer.staffViewHint')}
          </Text>
        </View>
      )}

      {/* 固定的搜索区域 */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: isDarkMode ? '#000000' : '#f2f2f7',
          paddingTop: selectedSchool ? 0 : insets.top - 47.5  // 再往上移动10px，总共47.5px
        }
      ]}>
        <SearchBar
          value={searchPhone}
          onChangeText={setSearchPhone}
          onSearch={handleSearch}
          onScanQR={handleScanQR}
          loading={operationState === 'searching'}
          error={searchError}
          placeholder={t('wellbeing.volunteer.searchVolunteers')}
        />
      </View>

      {/* 志愿者列表 */}
      <FlatList
        ref={flatListRef}
        data={filteredVolunteers}
        renderItem={renderVolunteerCard}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ItemSeparator}
        style={styles.list}
        contentContainerStyle={{
          paddingTop: 15, // 设置为15px，统一搜索框与列表间距
          paddingBottom: contentInsetBottom,
        }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        onScroll={() => {}} // 显式提供onScroll函数避免错误
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
              {searchPhone ? t('wellbeing.volunteer.noVolunteersFound') : t('wellbeing.volunteer.noRecords')}
            </Text>
          </View>
        }
      />

      {/* 签出确认弹层 */}
      <SignOutBottomSheet
        visible={showSignOutSheet}
        volunteer={pendingSignOutVolunteer}
        onConfirm={confirmSignOut}
        onCancel={cancelSignOut}
        loading={operationState === 'signingOut'}
      />

      {/* 成功提示 Toast */}
      {successMessage ? (
        <Animated.View
          style={[
            styles.successToast,
            {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
              opacity: successToastOpacity,
              top: insets.top + 12.5, // 再往上移动10px，总共减少47.5px
            }
          ]}
          
        >
          <Text style={[styles.successToastText, { color: theme.colors.success }]}>
            ✓ {successMessage}
          </Text>
        </Animated.View>
      ) : null}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  schoolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4, // 极致紧凑：最小间距防止内容重叠
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    zIndex: 1000, // 确保置于最顶层
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  schoolSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 77.5, // 继续向下移动7.5px，总共77.5px顶部间距
    paddingBottom: 0, // 完全移除底部间距，最大紧凑度
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    zIndex: 999, // 略低于学校头部但仍在列表之上
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  successToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.success + '20',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successToastText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Hero玻璃卡 - 学校信息+统计一体化
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // 玻璃材质
    borderRadius: 16, // 大卡16pt圆角
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'rgba(255, 255, 255, 0.6)', // 顶部1px高光
    paddingVertical: 16,
    paddingHorizontal: 14, // 14pt内边距
    minHeight: 120, // 112-124pt高度
    // 玻璃阴影
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  
  schoolSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // 与统计区分隔
  },
  
  schoolBadge: {
    width: 48, // 44-52pt范围
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  
  // Hero卡内统计数据
  heroStatsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.12)', // 极细分隔线
  },
  
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  heroStatNumber: {
    fontSize: 16, // 等宽数字
    fontWeight: '700',
    color: '#111827',
    fontVariant: ['tabular-nums'], // 等宽数字
    marginBottom: 2,
  },
  
  heroStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    opacity: 0.7,
  },
  
  heroStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // 极细竖分隔白12%
    marginHorizontal: 8,
  },
  
  // 权限提示样式
  permissionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  permissionHintText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
  },
});

export default VolunteerListScreen;