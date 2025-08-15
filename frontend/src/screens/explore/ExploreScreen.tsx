import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { ActivityCard } from '../../components/cards/ActivityCard';
import { useUnimplementedFeature } from '../../components/common/UnimplementedFeature';

const { width: screenWidth } = Dimensions.get('window');

// Mock data for schools
const mockSchools = [
  { id: 'cu', name: 'Columbia University', shortName: 'CU', color: '#4285F4', activities: 12 },
  { id: 'nyu', name: 'New York University', shortName: 'NYU', color: '#8E24AA', activities: 8 },
  { id: 'fordham', name: 'Fordham University', shortName: 'Fordham', color: '#FF7043', activities: 6 },
  { id: 'pace', name: 'Pace University', shortName: 'Pace', color: '#26A69A', activities: 4 },
  { id: 'all', name: '全部学校', shortName: '全部', color: theme.colors.primary, activities: 30 },
];

// Mock data for featured activities
const mockFeaturedActivities = [
  {
    id: '1',
    title: 'NYU春季音乐会',
    subtitle: '古典音乐欣赏会',
    location: 'NYU Skirball Center',
    date: '2025-03-15',
    time: '19:30',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    attendees: 45,
    maxAttendees: 120,
    status: 'upcoming',
    isFree: true,
    organizer: { name: 'NYU中国学生学者联合会', verified: true }
  },
  {
    id: '2', 
    title: 'Fordham职业发展讲座',
    subtitle: 'Tech行业求职指南',
    location: 'Fordham Business School',
    date: '2025-03-20',
    time: '14:00',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    attendees: 28,
    maxAttendees: 50,
    status: 'upcoming',
    price: 15,
    organizer: { name: 'Fordham商学院中国学生会', verified: true }
  },
];

const mockCategories = [
  { id: 'academic', name: '学术讲座', icon: 'library-outline', count: 8 },
  { id: 'social', name: '社交聚会', icon: 'people-outline', count: 12 },
  { id: 'career', name: '职业发展', icon: 'briefcase-outline', count: 6 },
  { id: 'culture', name: '文化活动', icon: 'color-palette-outline', count: 9 },
  { id: 'sports', name: '体育运动', icon: 'fitness-outline', count: 5 },
];

export const ExploreScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // 功能未实现提示
  const { showFeature, FeatureModal } = useUnimplementedFeature();

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Handle school selection
  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchool(schoolId);
  };

  // Handle category press
  const handleCategoryPress = (categoryId: string) => {
    // 显示功能未实现提示
    const categoryName = mockCategories.find(c => c.id === categoryId)?.name || '该分类';
    showFeature(categoryName, `${categoryName}功能正在开发中，将支持按分类浏览活动。`);
  };

  // Handle activity press
  const handleActivityPress = (activity: any) => {
    navigation.navigate('ActivityDetail', { activity });
  };

  const selectedSchoolData = mockSchools.find(s => s.id === selectedSchool);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.95)', 'rgba(240, 247, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('explore.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('explore.subtitle')}</Text>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.text.disabled} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('placeholders.searchSchoolsAndActivities')}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={theme.colors.text.disabled}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.text.disabled} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* School Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('explore.choose_school')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.schoolsContainer}
          >
            {mockSchools.map((school) => (
              // Shadow容器 - 使用solid background优化阴影渲染
              <View
                key={school.id}
                style={[
                  styles.schoolCardShadowContainer,
                  selectedSchool === school.id && styles.schoolCardSelected
                ]}
              >
                <TouchableOpacity
                  style={styles.schoolCard}
                  onPress={() => handleSchoolSelect(school.id)}
                >
                  <LinearGradient
                    colors={selectedSchool === school.id 
                      ? [school.color, school.color + 'DD'] 
                      : ['rgba(248, 250, 255, 0.8)', 'rgba(248, 250, 255, 0.4)']
                    }
                    style={styles.schoolCardGradient}
                  >
                  <View style={[
                    styles.schoolIcon,
                    { backgroundColor: selectedSchool === school.id ? 'rgba(255,255,255,0.2)' : school.color + '20' }
                  ]}>
                    <Text style={[
                      styles.schoolIconText,
                      { color: selectedSchool === school.id ? 'white' : school.color }
                    ]}>
                      {school.shortName.substring(0, 2)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.schoolName,
                    { color: selectedSchool === school.id ? 'white' : theme.colors.text.primary }
                  ]}>
                    {school.shortName}
                  </Text>
                  <Text style={[
                    styles.schoolActivities,
                    { color: selectedSchool === school.id ? 'rgba(255,255,255,0.9)' : theme.colors.text.secondary }
                  ]}>
                    {t('explore.activities_count', { count: school.activities })}
                  </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Activity Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('explore.activity_categories')}</Text>
          <View style={styles.categoriesGrid}>
            {mockCategories.map((category) => (
              // Shadow容器 - 使用solid background优化阴影渲染
              <View
                key={category.id}
                style={styles.categoryCardShadowContainer}
              >
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <LinearGradient
                    colors={['rgba(255, 107, 53, 0.1)', 'rgba(255, 71, 87, 0.05)']} // VitaGlobal 橙红渐变
                    style={styles.categoryCardGradient}
                  >
                  <View style={styles.categoryIcon}>
                    <Ionicons 
                      name={category.icon as any} 
                      size={24} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{t('explore.activities_count', { count: category.count })}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Featured Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('explore.recommended_activities')}</Text>
            <TouchableOpacity onPress={() => showFeature(t('explore.recommended_activities'), t('explore.features.recommendations_developing'))}>
              <Text style={styles.seeMoreText}>{t('explore.view_more')}</Text>
            </TouchableOpacity>
          </View>
          
          {mockFeaturedActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => handleActivityPress(activity)}
            />
          ))}
        </View>
      </ScrollView>
      
      {/* 功能未实现提示组件 */}
      <FeatureModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
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
    marginBottom: theme.spacing[4],
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg + 2,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 255, 0.8)',
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing[2],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },

  // Sections
  section: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  seeMoreText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Schools
  schoolsContainer: {
    marginTop: theme.spacing[3],
  },
  
  // Shadow容器 - 解决LinearGradient阴影冲突 (Schools)
  schoolCardShadowContainer: {
    width: 120,
    height: 120,
    marginRight: theme.spacing[3],
    borderRadius: theme.borderRadius.lg + 2,
    backgroundColor: theme.colors.background.primary, // solid background用于阴影优化
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
  },
  schoolCardSelected: {
    ...theme.shadows.md,
  },
  
  schoolCard: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg + 2,
    overflow: 'hidden',
    // 移除阴影，由schoolCardShadowContainer处理
  },
  schoolCardGradient: {
    flex: 1,
    padding: theme.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  schoolIconText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  schoolName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  schoolActivities: {
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing[3],
  },
  
  // Shadow容器 - 解决LinearGradient阴影冲突 (Categories)
  categoryCardShadowContainer: {
    width: (screenWidth - theme.spacing[4] * 2 - theme.spacing[3]) / 2,
    marginBottom: theme.spacing[3],
    borderRadius: theme.borderRadius.lg + 2,
    backgroundColor: theme.liquidGlass.card.background, // solid background用于阴影优化
    ...theme.shadows.xs,
    borderWidth: 1,
    borderColor: theme.liquidGlass.card.border,
  },
  
  categoryCard: {
    width: '100%',
    borderRadius: theme.borderRadius.lg + 2,
    overflow: 'hidden',
    // 移除阴影，由categoryCardShadowContainer处理
  },
  categoryCardGradient: {
    padding: theme.spacing[4],
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 107, 53, 0.1)', // VitaGlobal 橙色
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  categoryName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});