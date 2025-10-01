import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { MerchantCard } from '../cards/MerchantCard';

interface CategoryRowProps {
  category: {
    id: string;
    name: string;
    icon?: string;
    iconColor?: string;
    merchants: any[];
  };
  onMerchantPress: (merchantId: string) => void;
  onViewMore?: () => void;
}

const CategoryRowComponent: React.FC<CategoryRowProps> = ({
  category,
  onMerchantPress,
  onViewMore,
}) => {
  const { t } = useTranslation();

  // 渲染商家卡片
  const renderMerchant = ({ item }: { item: any }) => (
    <MerchantCard
      merchant={item}
      onPress={() => onMerchantPress(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {/* 分类标题行 */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          {/* 图标 */}
          {category.icon && (
            <View style={[styles.iconContainer, { backgroundColor: category.iconColor || '#FF3B30' }]}>
              <Ionicons
                name={category.icon as any}
                size={18}
                color="#FFFFFF"
              />
            </View>
          )}

          {/* 分类名称 */}
          <Text style={styles.categoryTitle}>{category.name}</Text>
        </View>

        {/* View More 按钮 */}
        {onViewMore && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={onViewMore}
          >
            <Text style={styles.viewMoreText}>{t('community.viewMore', 'View More')}</Text>
            <Ionicons name="chevron-forward" size={18} color="#D4A054" />
          </TouchableOpacity>
        )}
      </View>

      {/* 横向滚动卡片列表 */}
      <FlatList
        data={category.merchants}
        renderItem={renderMerchant}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
};

export const CategoryRow = memo(CategoryRowComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },

  // 标题行
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // 图标容器
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  // 分类标题
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // View More 按钮
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },

  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4A054',
    marginRight: 4,
  },

  // 列表内容
  listContent: {
    paddingHorizontal: 16,
  },
});
