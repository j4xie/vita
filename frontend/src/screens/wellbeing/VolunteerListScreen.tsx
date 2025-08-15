import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  useColorScheme,
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
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, BRAND_GLASS, BRAND_GRADIENT } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { VolunteerCard, VolunteerRecord } from './components/VolunteerCard';
import { SearchBar } from './components/SearchBar';
import { SignOutBottomSheet } from './components/SignOutBottomSheet';
import { School } from '../../data/mockData';

const { height: screenHeight } = Dimensions.get('window');

// 操作状态枚举
type OperationState = 'idle' | 'searching' | 'signingIn' | 'signingOut' | 'success' | 'error';

// Mock数据
const mockVolunteers: VolunteerRecord[] = [
  // UCB志愿者
  {
    id: '1',
    phone: '15101234567',
    name: '陈志豪',
    school: 'UC Berkeley',
    status: 'checked_in',
    checkInTime: '2025-08-13T09:30:00',
    totalHours: 45.5,
    lastCheckInTime: '2025-08-12T08:15:00',
    lastCheckOutTime: '2025-08-12T16:30:00',
  },
  {
    id: '2',
    phone: '15101234568',
    name: '李思雨',
    school: 'UC Berkeley',
    status: 'not_checked_in',
    totalHours: 32.0,
    lastCheckInTime: '2025-08-11T13:20:00',
    lastCheckOutTime: '2025-08-11T17:45:00',
  },
  {
    id: '3',
    phone: '15101234569',
    name: '王建华',
    school: 'UC Berkeley',
    status: 'checked_in',
    checkInTime: '2025-08-13T10:15:00',
    totalHours: 28.5,
    lastCheckInTime: '2025-08-10T09:30:00',
    lastCheckOutTime: '2025-08-10T15:15:00',
  },
  // 其他学校志愿者
  {
    id: '4',
    phone: '13812345678',
    name: '张同学',
    school: 'UCLA',
    status: 'checked_in',
    checkInTime: '2025-08-13T14:30:00',
    totalHours: 25.5,
    lastCheckInTime: '2025-08-12T09:15:00',
    lastCheckOutTime: '2025-08-12T17:30:00',
  },
  {
    id: '5',
    phone: '13912345678',
    name: '李同学',
    school: 'University of Washington',
    status: 'not_checked_in',
    totalHours: 18.0,
    lastCheckInTime: '2025-08-11T14:20:00',
    lastCheckOutTime: '2025-08-11T18:45:00',
  },
  {
    id: '6',
    phone: '15012345678',
    name: '王同学',
    school: 'USC',
    status: 'not_checked_in',
    totalHours: 42.0,
    lastCheckInTime: '2025-08-10T08:30:00',
    lastCheckOutTime: '2025-08-10T16:15:00',
  },
  {
    id: '7',
    phone: '18612345678',
    name: '陈同学',
    school: 'UC San Diego',
    status: 'checked_in',
    checkInTime: '2025-08-13T13:00:00',
    totalHours: 15.5,
    lastCheckInTime: '2025-08-09T10:45:00',
    lastCheckOutTime: '2025-08-09T15:20:00',
  },
  {
    id: '8',
    phone: '17712345678',
    name: '刘同学',
    school: 'UC Irvine',
    status: 'not_checked_in',
    totalHours: 8.0,
    lastCheckInTime: '2025-08-08T13:10:00',
    lastCheckOutTime: '2025-08-08T17:00:00',
  },
];

interface VolunteerListScreenProps {
  selectedSchool?: School;
  onBackToSchoolSelection?: () => void;
}

export const VolunteerListScreen: React.FC<VolunteerListScreenProps> = ({ 
  selectedSchool, 
  onBackToSchoolSelection 
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', isDarkMode);
  
  // 状态管理
  const [searchPhone, setSearchPhone] = useState('');
  const [searchError, setSearchError] = useState('');
  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>(mockVolunteers);
  
  // 根据选中的学校过滤志愿者
  const schoolFilteredVolunteers = selectedSchool 
    ? mockVolunteers.filter(volunteer => volunteer.school === selectedSchool.englishName)
    : mockVolunteers;
    
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

  // 当选中学校变化时更新过滤的志愿者列表
  useEffect(() => {
    setFilteredVolunteers(schoolFilteredVolunteers);
    setSearchPhone('');
    setSearchError('');
  }, [selectedSchool]);

  // 搜索志愿者
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

    // 模拟API调用
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
    if (expandedVolunteerId === volunteerId) {
      // 如果点击已展开的卡片，收起它
      setExpandedVolunteerId(null);
      setSelectedVolunteerId(null);
    } else {
      // 展开新卡片，收起旧卡片
      setExpandedVolunteerId(volunteerId);
      setSelectedVolunteerId(volunteerId);
      
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

  // 处理签到
  const handleCheckIn = useCallback(async (volunteer: VolunteerRecord) => {
    setOperationState('signingIn');
    
    // 模拟API调用
    setTimeout(() => {
      const updatedVolunteer = {
        ...volunteer,
        status: 'checked_in' as const,
        checkInTime: new Date().toISOString(),
      };
      
      // 更新状态
      updateVolunteerRecord(updatedVolunteer);
      setOperationState('success');
      
      // 显示成功提示
      const timeString = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      showSuccessToast(`✓ ${timeString}`);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);
  }, []);

  // 处理签出（显示确认弹层）
  const handleCheckOut = useCallback((volunteer: VolunteerRecord) => {
    setPendingSignOutVolunteer(volunteer);
    setShowSignOutSheet(true);
  }, []);

  // 确认签出
  const confirmSignOut = useCallback(async () => {
    if (!pendingSignOutVolunteer) return;
    
    setOperationState('signingOut');
    
    // 模拟API调用
    setTimeout(() => {
      if (!pendingSignOutVolunteer.checkInTime) return;
      
      const checkInTime = new Date(pendingSignOutVolunteer.checkInTime);
      const checkOutTime = new Date();
      const duration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
      
      const updatedVolunteer = {
        ...pendingSignOutVolunteer,
        status: 'not_checked_in' as const,
        checkInTime: undefined, // 清除签到时间
        totalHours: (pendingSignOutVolunteer.totalHours || 0) + (duration / 60),
      };
      
      // 更新状态
      updateVolunteerRecord(updatedVolunteer);
      setOperationState('success');
      setShowSignOutSheet(false);
      setPendingSignOutVolunteer(null);
      
      // 显示成功提示
      const timeString = checkOutTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      showSuccessToast(`✓ ${timeString}`);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);
  }, [pendingSignOutVolunteer]);

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
              {i18n.language.startsWith('zh') ? selectedSchool.name : selectedSchool.englishName}
            </Text>
            <Text style={[styles.schoolSubtitle, { color: isDarkMode ? '#a1a1aa' : '#6b7280' }]}>
              {schoolFilteredVolunteers.length}{t('wellbeing.volunteer.volunteersCount')}
            </Text>
          </View>
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
          pointerEvents="none"
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
});

export default VolunteerListScreen;