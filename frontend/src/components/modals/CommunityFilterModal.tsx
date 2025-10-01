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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../../theme';

const { height: screenHeight } = Dimensions.get('window');

export interface FilterOptions {
  sortBy: 'date' | 'newest' | 'price-low' | 'price-high';
  priceRange: 'all' | 'under-100' | '100-250' | '250-plus' | 'custom';
  category: string | null;
  location: string | null;
  dateRange: string | null;
}

interface CommunityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  resultCount?: number;
}

export const CommunityFilterModal: React.FC<CommunityFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
  resultCount = 0,
}) => {
  const { t } = useTranslation();

  // 筛选状态
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>(
    initialFilters?.sortBy || 'date'
  );
  const [priceRange, setPriceRange] = useState<FilterOptions['priceRange']>(
    initialFilters?.priceRange || 'all'
  );
  const [category, setCategory] = useState<string | null>(
    initialFilters?.category || null
  );
  const [location, setLocation] = useState<string | null>(
    initialFilters?.location || null
  );
  const [dateRange, setDateRange] = useState<string | null>(
    initialFilters?.dateRange || null
  );

  // 展开状态
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 排序选项
  const sortOptions = [
    { id: 'date', label: t('community.filter.sort.date', 'Show date') },
    { id: 'newest', label: t('community.filter.sort.newest', 'Newest') },
    { id: 'price-low', label: t('community.filter.sort.priceLow', '$ Low - High') },
    { id: 'price-high', label: t('community.filter.sort.priceHigh', '$ High - Low') },
  ];

  // 价格区间选项
  const priceOptions = [
    { id: 'all', label: t('community.filter.price.all', 'All Prices') },
    { id: 'under-100', label: t('community.filter.price.under100', 'Under $100') },
    { id: '100-250', label: t('community.filter.price.range1', '$100 - $250') },
    { id: '250-plus', label: t('community.filter.price.over250', '$250+') },
  ];

  // 类别选项（示例）
  const categoryOptions = [
    { id: 'social', label: t('community.filter.category.social', 'Social Events') },
    { id: 'sports', label: t('community.filter.category.sports', 'Sports') },
    { id: 'culture', label: t('community.filter.category.culture', 'Culture') },
    { id: 'career', label: t('community.filter.category.career', 'Career') },
  ];

  // 清空筛选
  const handleClear = () => {
    setSortBy('date');
    setPriceRange('all');
    setCategory(null);
    setLocation(null);
    setDateRange(null);
    setExpandedSection(null);
  };

  // 应用筛选
  const handleApply = () => {
    onApply({
      sortBy,
      priceRange,
      category,
      location,
      dateRange,
    });
    onClose();
  };

  // 切换展开状态
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('community.filter.title', 'Sort & Filter')}
          </Text>
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>
              {t('community.filter.clear', 'Clear')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sort by 区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('community.filter.sortBy', 'Sort by')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.chip,
                    sortBy === option.id && styles.chipSelected,
                  ]}
                  onPress={() => setSortBy(option.id as FilterOptions['sortBy'])}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sortBy === option.id && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Price 区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('community.filter.priceTitle', 'Price')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {priceOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.chip,
                    priceRange === option.id && styles.chipSelected,
                  ]}
                  onPress={() => setPriceRange(option.id as FilterOptions['priceRange'])}
                >
                  {priceRange === option.id && (
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={theme.colors.primary}
                      style={styles.chipCloseIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.chipText,
                      priceRange === option.id && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category 可展开区域 */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.expandableHeader}
              onPress={() => toggleSection('category')}
            >
              <Text style={styles.sectionTitle}>
                {t('community.filter.categoryTitle', 'Category')}
              </Text>
              <View style={styles.expandableRight}>
                {category && (
                  <Text style={styles.selectedCount}>
                    {categoryOptions.find(c => c.id === category)?.label}
                  </Text>
                )}
                <Ionicons
                  name={expandedSection === 'category' ? 'chevron-up' : 'chevron-forward'}
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </View>
            </TouchableOpacity>

            {expandedSection === 'category' && (
              <View style={styles.expandableContent}>
                {categoryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.optionRow}
                    onPress={() => setCategory(category === option.id ? null : option.id)}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                    {category === option.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Location 可展开区域 */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.expandableHeader}
              onPress={() => toggleSection('location')}
            >
              <Text style={styles.sectionTitle}>
                {t('community.filter.locationTitle', 'Location')}
              </Text>
              <View style={styles.expandableRight}>
                {location && (
                  <Text style={styles.selectedCount}>{location}</Text>
                )}
                <Ionicons
                  name={expandedSection === 'location' ? 'chevron-up' : 'chevron-forward'}
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </View>
            </TouchableOpacity>

            {expandedSection === 'location' && (
              <View style={styles.expandableContent}>
                <Text style={styles.placeholderText}>
                  {t('community.filter.locationPlaceholder', 'Select location')}
                </Text>
              </View>
            )}
          </View>

          {/* Date Range 可展开区域 */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.expandableHeader}
              onPress={() => toggleSection('dateRange')}
            >
              <Text style={styles.sectionTitle}>
                {t('community.filter.dateRangeTitle', 'Date Range')}
              </Text>
              <View style={styles.expandableRight}>
                {dateRange && (
                  <Text style={styles.selectedCount}>{dateRange}</Text>
                )}
                <Ionicons
                  name={expandedSection === 'dateRange' ? 'chevron-up' : 'chevron-forward'}
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </View>
            </TouchableOpacity>

            {expandedSection === 'dateRange' && (
              <View style={styles.expandableContent}>
                <Text style={styles.placeholderText}>
                  {t('community.filter.dateRangePlaceholder', 'Select date range')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 底部应用按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>
              {t('community.filter.showResults', { count: resultCount })}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // 顶部栏
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },

  closeButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },

  clearButton: {
    padding: 4,
  },

  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // 滚动区域
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.secondary,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },

  // 横向滚动容器
  horizontalScroll: {
    paddingRight: 16,
    gap: 8,
  },

  // Chip 按钮
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },

  chipSelected: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  chipTextSelected: {
    color: theme.colors.primary,
  },

  chipCloseIcon: {
    marginRight: 4,
  },

  // 可展开区域
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  expandableRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  selectedCount: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  expandableContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.secondary,
  },

  // 选项行
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  optionText: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },

  placeholderText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // 底部按钮
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
    backgroundColor: theme.colors.background.primary,
  },

  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
