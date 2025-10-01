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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 85;
const CARD_WIDTH = (screenWidth - SIDEBAR_WIDTH - 48) / 2; // 2列网格

export interface MerchantFilterOptions {
  category: string | null;
  priceRange: 'all' | 'free' | 'under-10' | '10-30' | '30-50' | '50-plus';
  sortBy: 'points-high' | 'points-low' | 'price-low' | 'price-high' | 'newest';
  selectedSchools: string[];
  selectedMerchantTypes: string[]; // 选中的商家类型
}

interface CommunityMerchantFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: MerchantFilterOptions) => void;
  initialFilters?: MerchantFilterOptions;
  schools: Array<{ id: string; name: string }>;
}

export const CommunityMerchantFilterModal: React.FC<CommunityMerchantFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
  schools = [],
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // 当前选中的分类标签
  const [activeTab, setActiveTab] = useState('type');

  // 筛选状态
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters?.selectedMerchantTypes || []
  );
  const [priceRange, setPriceRange] = useState(initialFilters?.priceRange || 'all');
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'points-high');
  const [selectedSchools, setSelectedSchools] = useState<string[]>(
    initialFilters?.selectedSchools || []
  );

  // 左侧分类标签
  const tabs = [
    { id: 'type', label: 'Type', icon: 'grid', count: selectedTypes.length },
    { id: 'price', label: 'Price', icon: 'cash', count: priceRange !== 'all' ? 1 : 0 },
    { id: 'sort', label: 'Sort', icon: 'swap-vertical', count: 0 },
    { id: 'schools', label: 'Schools', icon: 'school', count: selectedSchools.length },
  ];

  // 商家类型选项（带图片）
  const merchantTypes = [
    {
      id: 'restaurant',
      label: 'Restaurant',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      icon: '🍽️',
    },
    {
      id: 'cafe',
      label: 'Café',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      icon: '☕',
    },
    {
      id: 'bar',
      label: 'Bar',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400',
      icon: '🍺',
    },
    {
      id: 'shopping',
      label: 'Shopping',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      icon: '🛍️',
    },
    {
      id: 'fitness',
      label: 'Fitness',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      icon: '🏋️',
    },
    {
      id: 'study',
      label: 'Study Space',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      icon: '📚',
    },
  ];

  // 价格选项
  const priceOptions = [
    { id: 'all', label: 'All Prices' },
    { id: 'free', label: 'Free' },
    { id: 'under-10', label: 'Under $10' },
    { id: '10-30', label: '$10 - $30' },
    { id: '30-50', label: '$30 - $50' },
    { id: '50-plus', label: '$50+' },
  ];

  // 排序选项
  const sortOptions = [
    { id: 'points-high', label: 'Highest Points' },
    { id: 'points-low', label: 'Lowest Points' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'newest', label: 'Newest' },
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
    setSelectedTypes([]);
    setPriceRange('all');
    setSortBy('points-high');
    setSelectedSchools([]);
  };

  // 应用筛选
  const handleApply = () => {
    onApply({
      category: selectedTypes[0] || null,
      priceRange,
      sortBy,
      selectedSchools,
      selectedMerchantTypes: selectedTypes,
    });
    onClose();
  };

  // 渲染右侧内容
  const renderContent = () => {
    switch (activeTab) {
      case 'type':
        return (
          <View style={styles.gridContainer}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.grid}>
              {merchantTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.imageCard,
                    selectedTypes.includes(type.id) && styles.imageCardSelected,
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

      case 'price':
        return (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            {priceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.listItem}
                onPress={() => setPriceRange(option.id as MerchantFilterOptions['priceRange'])}
              >
                <Text style={styles.listItemText}>{option.label}</Text>
                {priceRange === option.id && (
                  <Ionicons name="checkmark" size={24} color="#FF3B30" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'sort':
        return (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.listItem}
                onPress={() => setSortBy(option.id as MerchantFilterOptions['sortBy'])}
              >
                <Text style={styles.listItemText}>{option.label}</Text>
                {sortBy === option.id && (
                  <Ionicons name="checkmark" size={24} color="#FF3B30" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'schools':
        return (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Schools</Text>
            {schools.map((school) => (
              <TouchableOpacity
                key={school.id}
                style={styles.listItem}
                onPress={() => toggleSchool(school.id)}
              >
                <Text style={styles.listItemText}>{school.name}</Text>
                {selectedSchools.includes(school.id) && (
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
          <Text style={styles.headerTitle}>Filters and sorting</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* 主内容区 - 左右分栏 */}
        <View style={styles.content}>
          {/* 左侧分类导航栏 */}
          <View style={styles.sidebar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.sidebarTab,
                  activeTab === tab.id && styles.sidebarTabActive,
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
                  activeTab === tab.id && styles.sidebarLabelActive,
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
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Show results</Text>
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

  // 图片网格
  gridContainer: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },

  grid: {
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

  // 列表容器（价格、排序、学校）
  listContainer: {
    flex: 1,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },

  listItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },

  // 底部按钮 - 优化版
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 32, // 增大顶部间距，让按钮下移
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    // paddingBottom 通过内联样式动态设置（包含安全区域）
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
    flex: 1.5, // 稍微更宽
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
