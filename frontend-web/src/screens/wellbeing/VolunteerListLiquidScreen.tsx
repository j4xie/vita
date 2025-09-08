import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { fetchSchoolList } from '../../services/registrationAPI';
import { useUser } from '../../context/UserContext';
import { getSchoolVolunteerCount } from '../../services/userStatsAPI';
import { GlassSearchBar } from '../../ui/glass/GlassSearchBar';
import { Glass } from '../../ui/glass/GlassTheme';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';
import { SchoolVolunteerCard } from '../../components/volunteer/SchoolVolunteerCard';

// Mock schools data removed - using real API data only

export const VolunteerListLiquidScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { permissions, user } = useUser(); // 获取用户权限和用户信息
  
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients, blur: dmBlur, icons: dmIcons } = darkModeSystem;
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [schools, setSchools] = useState<any[]>([]); // 初始为空，避免显示Mock数据
  const [loading, setLoading] = useState(true); // 显示loading状态
  
  // 简化的状态管理 - Web 端优化
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 加载真实学校数据
  const loadSchoolData = useCallback(async () => {
    try {
      setLoading(true); // 显示loading状态
      const result = await fetchSchoolList();
      
      if (result.code === 200 && result.data) {
        // 根据用户权限过滤学校数据
        let filteredSchools = result.data.filter(school => school.deptId >= 210);
        
        // 分管理员：只能看到自己的学校
        if (permissions.getDataScope() === 'school') {
          const userDeptId = user?.deptId;
          if (userDeptId) {
            filteredSchools = filteredSchools.filter(school => school.deptId === userDeptId);
            console.log('📊 [SCHOOL-FILTER] 分管理员权限：只显示本校', { userDeptId, filteredCount: filteredSchools.length });
          }
        }
        
        // 🌍 FIXED: 将学校数据转换为组件需要的格式，保留API原始字段
        const realSchools = filteredSchools.map(school => ({
            id: school.deptId.toString(),
            // 🚨 FIX: 保留API原始字段，让接收组件根据语言选择显示
            deptId: school.deptId,
            deptName: school.deptName,      // 中文名称
            engName: school.engName,        // 英文名称  
            aprName: school.aprName,        // 缩写名称
            // 🔄 向后兼容：提供nameCN/nameEN字段
            nameCN: school.deptName,
            nameEN: school.engName || school.deptName,
            // 🗑️ 根据用户要求移除位置显示，但保留数据用于搜索
            city: getSchoolCity(school.deptName),
            state: getSchoolState(school.deptName),
            volunteers: 0, // 将通过API获取真实数据
            tint: getSchoolColor(school.deptName),
          }));
        
        // 🚀 性能优化：先显示学校列表，异步加载志愿者数量
        const schoolsWithoutStats = realSchools.map(school => ({
          ...school,
          volunteers: 0, // 初始显示0，避免等待
        }));
        
        // 立即设置学校列表，让用户先看到内容
        setSchools(schoolsWithoutStats);
        setLoading(false);
        
        // 异步加载志愿者统计，避免阻塞UI
        console.log(`📊 [ASYNC-LOADING] 异步获取${realSchools.length}个学校的志愿者统计...`);
        
        // 分批加载，避免一次性请求过多
        const batchSize = 3; // 每批处理3个学校
        const batches = [];
        for (let i = 0; i < realSchools.length; i += batchSize) {
          batches.push(realSchools.slice(i, i + batchSize));
        }
        
        // 逐批处理学校统计
        for (const batch of batches) {
          const batchResults = await Promise.all(
            batch.map(async (school) => {
              try {
                const volunteerCount = await getSchoolVolunteerCount(school.deptId);
                console.log(`✅ ${school.deptName}: ${volunteerCount}名志愿者`);
                return {
                  ...school,
                  volunteers: volunteerCount,
                };
              } catch (error) {
                console.warn(`⚠️ 获取${school.deptName}统计失败:`, error);
                return {
                  ...school,
                  volunteers: 0,
                };
              }
            })
          );
          
          // 更新这一批的数据
          setSchools(prevSchools => {
            const updatedSchools = [...prevSchools];
            batchResults.forEach(updatedSchool => {
              const index = updatedSchools.findIndex(s => s.deptId === updatedSchool.deptId);
              if (index !== -1) {
                updatedSchools[index] = updatedSchool;
              }
            });
            return updatedSchools;
          });
          
          // 批次之间添加小延迟，避免API压力
          if (batch !== batches[batches.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        console.log(`📈 [ASYNC-COMPLETED] 异步加载全部完成`);
      } else {
        // API失败时显示空状态
        console.warn('学校数据加载失败');
        setSchools([]);
      }
    } catch (error) {
      console.error('加载学校数据失败:', error);
      // API失败时显示空状态
      setSchools([]);
    } finally {
      setLoading(false); // 恢复loading状态管理
    }
  }, []);

  // 组件加载时立即获取数据 - 避免初始显示"没有学校"
  React.useEffect(() => {
    loadSchoolData();
  }, []); // 只在组件加载时执行一次

  // 学校显示名称映射
  const getSchoolDisplayName = (deptName: string): string => {
    const nameMap: Record<string, string> = {
      'UCD': '加州大学戴维斯分校',
      'UCB': '加州大学伯克利分校',
      'UCLA': '加州大学洛杉矶分校',
      'USC': '南加州大学',
      'UCI': '加州大学尔湾分校',
      'UCSD': '加州大学圣地亚哥分校',
      'UCSB': '加州大学圣芭芭拉分校',
      'UCSC': '加州大学圣克鲁兹分校',
      'UW': '华盛顿大学',
      'UMN': '明尼苏达大学',
      'U Berklee Music': '伯克利音乐学院',
    };
    return nameMap[deptName] || deptName;
  };

  // 学校城市映射
  const getSchoolCity = (deptName: string): string => {
    const cityMap: Record<string, string> = {
      'UCD': '戴维斯', 'UCB': '伯克利', 'UCLA': '洛杉矶', 'USC': '洛杉矶',
      'UCI': '尔湾', 'UCSD': '圣地亚哥', 'UCSB': '圣芭芭拉', 'UCSC': '圣克鲁兹',
      'UW': '西雅图', 'UMN': '明尼阿波利斯', 'U Berklee Music': '波士顿',
    };
    return cityMap[deptName] || '未知城市';
  };

  // 学校州映射
  const getSchoolState = (deptName: string): string => {
    const stateMap: Record<string, string> = {
      'UCD': 'CA', 'UCB': 'CA', 'UCLA': 'CA', 'USC': 'CA',
      'UCI': 'CA', 'UCSD': 'CA', 'UCSB': 'CA', 'UCSC': 'CA',
      'UW': 'WA', 'UMN': 'MN', 'U Berklee Music': 'MA',
    };
    return stateMap[deptName] || 'Unknown';
  };

  // 学校颜色映射
  const getSchoolColor = (deptName: string): string => {
    const colorMap: Record<string, string> = {
      'UCD': '#8F8CF0', 'UCB': '#F0A1A1', 'UCLA': '#A1E3F0', 'USC': '#F0E1A1',
      'UCI': '#F6E39B', 'UCSD': '#D1C4E9', 'UCSB': '#C8E6C9', 'UCSC': '#FFCDD2',
      'UW': '#E1BEE7', 'UMN': '#FFCDD2', 'U Berklee Music': '#FFE0B2',
    };
    return colorMap[deptName] || '#E0E0E0';
  };
  
  // 🌍 FIXED: 过滤学校数据 - 使用正确的字段名
  const filteredSchools = schools.filter(school => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      school.deptName?.toLowerCase().includes(query) ||
      school.engName?.toLowerCase().includes(query) ||
      school.aprName?.toLowerCase().includes(query) ||
      school.city?.toLowerCase().includes(query)
    );
  });

  // 下拉刷新 - 使用真实API
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSchoolData();
    setRefreshing(false);
  }, [loadSchoolData]);

  // 简化的学校点击处理 - Web 端优化
  const handleSchoolPress = useCallback((school: any) => {
    if (isTransitioning) return; // 防止重复点击
    
    setIsTransitioning(true);
    
    // Web 端触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // 简单导航，不使用复杂动画
    setTimeout(() => {
      navigation.navigate('SchoolDetail' as never, { school } as never);
      setIsTransitioning(false);
    }, 200);
  }, [isTransitioning, navigation]);


  // 🎨 使用新的更好看的学校卡片组件
  const renderSchoolItem = ({ item }: { item: any }) => {
    return (
      <SchoolVolunteerCard
        school={{
          id: item.id,
          deptId: item.deptId,
          deptName: item.deptName,
          engName: item.engName,
          aprName: item.aprName,
          volunteers: item.volunteers,
          tint: item.tint,
        }}
        onPress={() => handleSchoolPress(item)}
        disabled={isTransitioning}
      />
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('school.no_volunteers_found')}</Text>
      <Text style={styles.emptySubtext}>{t('explore.category_developing_message', { category: t('wellbeing.title') })}</Text>
    </View>
  );

  return (
    <View style={[styles.container, dmStyles.page.container]}>

      <View style={styles.content}>
        {/* 搜索框 - 直接显示，不需要Tab判断 */}
        <View style={styles.searchSection}>
          <GlassSearchBar
            placeholder={t('common.search_schools')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 志愿者学校列表 */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('common.loading')}</Text>
            </View>
          ) : filteredSchools.length > 0 ? (
            <ScrollView 
              style={styles.schoolsList}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredSchools.map((item, index) => (
                <View key={item.id}>
                  {renderSchoolItem({ item, index })}
                </View>
              ))}
            </ScrollView>
          ) : (
            renderEmptyState()
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  // 搜索区域
  searchSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    paddingTop: 16, // 顶部间距
    marginBottom: 16,
  },

  // 列表容器
  listContainer: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
  },

  // 学校列表容器 - ScrollView样式
  schoolsList: {
    flex: 1,
  },

  // ScrollView内容容器 - 更紧凑的间距
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
  },

  // 空状态
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    color: Glass.textWeak,
    textAlign: 'center',
  },
});

export default VolunteerListLiquidScreen;