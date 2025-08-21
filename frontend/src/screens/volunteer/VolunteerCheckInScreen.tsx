import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useUser } from '../../context/UserContext';
import { UserInfo } from '../../components/common/UserInfo';

interface VolunteerRecord {
  id: string;
  phone: string;
  name: string;
  school: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
  duration?: number; // 分钟
  totalHours?: number; // 总志愿时长（小时）
}

// Mock data for demonstration - UCB志愿者
const mockVolunteers: VolunteerRecord[] = [
  {
    id: '1',
    phone: '15101234567',
    name: '陈志豪',
    school: 'UC Berkeley',
    status: 'checked_in',
    checkInTime: '2025-08-13T09:30:00',
    totalHours: 45.5,
  },
  {
    id: '2',
    phone: '15101234568',
    name: '李思雨', 
    school: 'UC Berkeley',
    status: 'not_checked_in',
    totalHours: 32.0,
  },
  {
    id: '3',
    phone: '15101234569',
    name: '王建华',
    school: 'UC Berkeley', 
    status: 'checked_out',
    checkInTime: '2025-08-13T08:00:00',
    checkOutTime: '2025-08-13T12:00:00',
    duration: 240,
    totalHours: 28.5,
  },
  // 其他学校志愿者用于搜索测试
  {
    id: '4',
    phone: '13812345678',
    name: '张同学',
    school: 'UCLA',
    status: 'checked_in',
    checkInTime: '2025-08-13T14:30:00',
    totalHours: 25.5,
  },
  {
    id: '5',
    phone: '13912345678',
    name: '李同学', 
    school: 'University of Washington',
    status: 'not_checked_in',
    totalHours: 18.0,
  },
];

export const VolunteerCheckInScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, hasPermission } = useUser();
  
  const [searchPhone, setSearchPhone] = useState('');
  const [currentUser, setCurrentUser] = useState<VolunteerRecord | null>(null);
  const [todayRecords, setTodayRecords] = useState<VolunteerRecord[]>(mockVolunteers);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 搜索志愿者
  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      Alert.alert(t('volunteerCheckIn.alerts.hint'), t('volunteerCheckIn.alerts.phoneRequired'));
      return;
    }

    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      const user = mockVolunteers.find(v => v.phone === searchPhone.trim());
      setCurrentUser(user || null);
      setLoading(false);
      
      if (!user) {
        Alert.alert(t('volunteerCheckIn.alerts.notFound'), t('volunteerCheckIn.alerts.userNotFound'));
      }
    }, 500);
  };

  // 签到
  const handleCheckIn = () => {
    if (!currentUser) return;

    Alert.alert(
      t('volunteerCheckIn.alerts.confirmCheckIn'),
      t('volunteerCheckIn.alerts.confirmCheckInMessage', { name: currentUser.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            const updatedUser = {
              ...currentUser,
              status: 'checked_in' as const,
              checkInTime: new Date().toISOString(),
            };
            setCurrentUser(updatedUser);
            
            // 更新记录列表
            setTodayRecords(prev => 
              prev.map(v => v.id === currentUser.id ? updatedUser : v)
            );
            
            Alert.alert(
              t('volunteerCheckIn.alerts.checkInSuccess'), 
              t('volunteerCheckIn.alerts.checkInSuccessMessage', { name: currentUser.name })
            );
          },
        },
      ]
    );
  };

  // 签出
  const handleCheckOut = () => {
    if (!currentUser || !currentUser.checkInTime) return;

    const checkInTime = new Date(currentUser.checkInTime);
    const checkOutTime = new Date();
    const duration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

    Alert.alert(
      t('volunteerCheckIn.alerts.confirmCheckOut'),
      t('volunteerCheckIn.alerts.confirmCheckOutMessage', { 
        name: currentUser.name,
        hours: Math.floor(duration / 60),
        minutes: duration % 60
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            const updatedUser = {
              ...currentUser,
              status: 'checked_out' as const,
              checkOutTime: checkOutTime.toISOString(),
              duration,
              totalHours: (currentUser.totalHours || 0) + (duration / 60),
            };
            setCurrentUser(updatedUser);
            
            // 更新记录列表
            setTodayRecords(prev => 
              prev.map(v => v.id === currentUser.id ? updatedUser : v)
            );
            
            Alert.alert(
              t('volunteerCheckIn.alerts.checkOutSuccess'), 
              t('volunteerCheckIn.alerts.checkOutSuccessMessage', { 
                name: currentUser.name,
                hours: Math.floor(duration / 60),
                minutes: duration % 60
              })
            );
          },
        },
      ]
    );
  };

  // 扫码功能
  const handleScanQR = () => {
    // 跳转到扫码页面或实现扫码逻辑
    Alert.alert(t('volunteerCheckIn.alerts.scanFunction'), t('volunteerCheckIn.alerts.scanComingSoon'));
  };

  // 计算签到时长
  const getCheckInDuration = (checkInTime: string) => {
    const start = new Date(checkInTime);
    const now = currentTime;
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours} ${t('volunteerCheckIn.time.hours')} ${minutes} ${t('volunteerCheckIn.time.minutes')}`;
  };

  // 渲染记录项
  const renderRecord = ({ item }: { item: VolunteerRecord }) => {
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
            <Text style={styles.recordName}>{item.name}</Text>
            <Text style={styles.recordPhone}>{item.phone}</Text>
            <Text style={styles.recordSchool}>{item.school}</Text>
          </View>
          
          <View style={styles.recordStatus}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            {item.status === 'checked_in' && item.checkInTime && (
              <Text style={styles.durationText}>
                {getCheckInDuration(item.checkInTime)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 权限检查 - 只有管理员可以访问志愿者管理功能
  if (!hasPermission('canManageVolunteers')) {
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

        {/* Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('volunteerCheckIn.searchVolunteer')}</Text>
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

        {/* User Info and Actions */}
        {currentUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('volunteerCheckIn.userInfo')}</Text>
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{currentUser.name}</Text>
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
                
                <Text style={styles.userPhone}>{currentUser.phone}</Text>
                <Text style={styles.userSchool}>{currentUser.school}</Text>
                
                {/* 时间信息 */}
                <View style={styles.timeInfo}>
                  {currentUser.checkInTime && (
                    <View style={styles.timeItem}>
                      <Ionicons name="log-in-outline" size={16} color={theme.colors.success} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.checkInTime')}</Text>
                      <Text style={styles.timeValue}>
                        {new Date(currentUser.checkInTime).toLocaleTimeString('zh-CN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  )}
                  
                  {currentUser.checkOutTime && (
                    <View style={styles.timeItem}>
                      <Ionicons name="log-out-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.checkOutTime')}</Text>
                      <Text style={styles.timeValue}>
                        {new Date(currentUser.checkOutTime).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  )}
                  
                  {currentUser.status === 'checked_in' && currentUser.checkInTime && (
                    <View style={styles.timeItem}>
                      <Ionicons name="timer-outline" size={16} color={theme.colors.warning} />
                      <Text style={styles.timeLabel}>{t('volunteerCheckIn.time.worked')}</Text>
                      <Text style={styles.timeValue}>
                        {getCheckInDuration(currentUser.checkInTime)}
                      </Text>
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
              
              {/* Action Buttons - Shadow优化 */}
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
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
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
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
    ...theme.shadows.card,
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
    backgroundColor: theme.liquidGlass.card.background,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
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
});