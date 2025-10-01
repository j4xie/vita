import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export interface Category {
  id: string;
  name: string;
  count?: number;
}

interface CategoryTabBarProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * CategoryTabBar - 分类标签栏
 *
 * 参考Apple Store的Products分类设计：
 * - 横向滚动
 * - 简洁标签
 * - 选中下划线动画
 * - 自动滚动到选中项
 */
export const CategoryTabBar: React.FC<CategoryTabBarProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category, index) => {
          const isSelected = category.id === selectedId;

          return (
            <TouchableOpacity
              key={category.id}
              style={styles.tab}
              onPress={() => onSelect(category.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isSelected && styles.tabTextSelected,
                ]}
              >
                {category.name}
              </Text>
              {category.count !== undefined && (
                <Text
                  style={[
                    styles.tabCount,
                    isSelected && styles.tabCountSelected,
                  ]}
                >
                  {' '}({category.count})
                </Text>
              )}
              {/* 选中下划线 */}
              {isSelected && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 24,
    paddingVertical: 12,
  },

  tab: {
    position: 'relative',
    paddingBottom: 8,
  },

  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#86868B',
  },

  tabTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },

  tabCount: {
    fontSize: 13,
    fontWeight: '400',
    color: '#86868B',
  },

  tabCountSelected: {
    color: '#000000',
  },

  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
});
