import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 85;
const CARD_WIDTH = (screenWidth - SIDEBAR_WIDTH - 48) / 2; // 2列网格

export interface ActivityFilterOptions {
  searchText: string;
  activityTypes: string[];
  selectedSchools: string[];
  sortBy: 'newest' | 'upcoming' | 'popular';
}

interface ActivityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ActivityFilterOptions) => void;
  initialFilters?: ActivityFilterOptions;
  schools: Array<{ id: string; name: string }>;
}

export const ActivityFilterModal: React.FC<ActivityFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
  schools = [],
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // 当前选中的分类标签
  const [activeTab, setActiveTab] = useState('search');

  // 筛选状态
  const [searchText, setSearchText] = useState(initialFilters?.searchText || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters?.activityTypes || []
  );
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'newest');
  const [selectedSchools, setSelectedSchools] = useState<string[]>(
    initialFilters?.selectedSchools || []
  );

  // 左侧分类标签
  const tabs = [
    { id: 'search', label: t('common.search', 'Search'), icon: 'search', count: searchText.trim() ? 1 : 0 },
    { id: 'type', label: t('filters.type', 'Type'), icon: 'grid', count: selectedTypes.length },
    { id: 'school', label: t('filters.school', 'School'), icon: 'school', count: selectedSchools.length },
    { id: 'sort', label: t('filters.sort', 'Sort'), icon: 'swap-vertical', count: 0 },
  ];

  // 活动类型选项（带图片）
  const activityTypes = [
    {
      id: 'social',
      label: t('activityTypes.social', 'Social'),
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400',
    },
    {
      id: 'academic',
      label: t('activityTypes.academic', 'Academic'),
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
    },
    {
      id: 'sports',
      label: t('activityTypes.sports', 'Sports'),
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
    },
    {
      id: 'arts',
      label: t('activityTypes.arts', 'Arts'),
      image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    },
    {
      id: 'volunteer',
      label: t('activityTypes.volunteer', 'Volunteer'),
      image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400',
    },
    {
      id: 'career',
      label: t('activityTypes.career', 'Career'),
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
    },
  ];

  // 排序选项
  const sortOptions = [
    { id: 'newest', label: t('filters.newest', 'Newest') },
    { id: 'upcoming', label: t('filters.upcoming', 'Upcoming') },
    { id: 'popular', label: t('filters.popular', 'Popular') },
  ];

  // 切换类型选择
  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  // 切换学校选择
  const toggleSchool = (schoolId: string) => {
    setSelectedSchools(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  // 清空筛选
  const handleClearAll = () => {
    setSearchText('');
    setSelectedTypes([]);
    setSortBy('newest');
    setSelectedSchools([]);
  };

  // 应用筛选
  const handleApply = () => {
    onApply({
      searchText,
      activityTypes: selectedTypes,
      selectedSchools,
      sortBy,
    });
    onClose();
  };

  // 渲染右侧内容
  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <View style={styles.searchContainer}>
            <Text style={styles.sectionTitle}>Search</Text>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('placeholders.searchActivities', 'Search activities...')}
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'type':
        return (
          <View>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeGrid}>
              {activityTypes.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.imageCard,
                    selectedTypes.includes(type.id) && styles.imageCardSelected
                  ]}
                  onPress={() => toggleType(type.id)}
                >
                  <Image source={{ uri: type.image }} style={styles.cardImage} />
                  <Text style={styles.cardLabel}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'school':
        return (
          <View>
            <Text style={styles.sectionTitle}>Schools</Text>
            {schools.map(school => (
              <TouchableOpacity
                key={school.id}
                style={styles.optionItem}
                onPress={() => toggleSchool(school.id)}
              >
                <Text style={styles.optionLabel}>{school.name}</Text>
                {selectedSchools.includes(school.id) && (
                  <Ionicons name="checkmark" size={24} color="#FF3B30" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'sort':
        return (
          <View>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => setSortBy(option.id as any)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                {sortBy === option.id && (
                  <Ionicons name="checkmark" size={24} color="#FF3B30" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 顶部栏 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('filters.title', 'Filters and sorting')}</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>{t('filters.clearAll', 'Clear All')}</Text>
          </TouchableOpacity>
        </View>

        {/* 主内容区 - 左右分栏 */}
        <View style={styles.content}>
          {/* 左侧分类导航栏 */}
          <View style={styles.sidebar}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.sidebarTab,
                  activeTab === tab.id && styles.sidebarTabActive
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                {/* 左侧红色指示条 */}
                {activeTab === tab.id && <View style={styles.activeIndicator} />}

                {/* 图标 + 数字徽章 */}
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={tab.icon as any}
                    size={24}
                    color={activeTab === tab.id ? '#FF3B30' : '#999'}
                  />
                  {tab.count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{tab.count}</Text>
                    </View>
                  )}
                </View>

                {/* 标签文字 */}
                <Text style={[
                  styles.sidebarLabel,
                  activeTab === tab.id && styles.sidebarLabelActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 右侧内容区 */}
          <ScrollView
            style={styles.rightContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.rightContentInner}
          >
            {renderContent()}
          </ScrollView>
        </View>

        {/* 底部按钮 - 固定在底部 */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('filters.close', 'Close')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>{t('filters.showResults', 'Show results')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 顶部栏
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  clearText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },

  // 主内容区
  content: {
    flex: 1,
    flexDirection: 'row',
  },

  // 左侧分类导航栏
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#F8F8F8',
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },

  sidebarTab: {
    paddingVertical: 20,
    alignItems: 'center',
    position: 'relative',
  },

  sidebarTabActive: {
    backgroundColor: '#FFFFFF',
  },

  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#FF3B30',
  },

  iconContainer: {
    position: 'relative',
    marginBottom: 6,
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  sidebarLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  sidebarLabelActive: {
    color: '#1A1A1A',
    fontWeight: '600',
  },

  // 右侧内容区
  rightContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  rightContentInner: {
    padding: 16,
  },
  // Section title
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },

  // 搜索容器
  searchContainer: {
    flex: 1,
  },

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },

  clearButton: {
    padding: 4,
  },

  // 图片网格
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // 图片卡片
  imageCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  imageCardSelected: {
    borderColor: '#FF3B30',
  },

  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingVertical: 12,
  },

  // 列表容器
  optionsList: {
    flex: 1,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },

  optionItemSelected: {
    backgroundColor: '#FFFFFF',
  },

  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  optionLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },

  optionLabelSelected: {
    color: '#1A1A1A',
  },

  // 底部按钮 - 优化版
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 32,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },

  closeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },

  applyButton: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
