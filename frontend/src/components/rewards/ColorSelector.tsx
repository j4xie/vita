import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductVariant } from '../../types/pointsMall';

interface ColorSelectorProps {
  variants: ProductVariant[];
  selectedId?: string;
  onSelect: (variantId: string) => void;
}

/**
 * ColorSelector - 颜色/规格选择器
 *
 * 参考Apple Store的颜色选择设计：
 * - 圆形色块
 * - 选中外圈
 * - 缺货置灰
 * - 颜色名称显示
 */
export const ColorSelector: React.FC<ColorSelectorProps> = ({
  variants,
  selectedId,
  onSelect,
}) => {
  // 获取颜色对应的十六进制值
  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      // 常见颜色映射
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF3B30',
      'blue': '#007AFF',
      'green': '#34C759',
      'yellow': '#FFCC00',
      'orange': '#FF9500',
      'purple': '#AF52DE',
      'pink': '#FF2D55',
      'gray': '#8E8E93',
      'silver': '#C7C7CC',
      'gold': '#FFD700',
      // Apple特定颜色
      'midnight': '#1D1D1F',
      'starlight': '#F0E4D3',
      'pacific blue': '#4A5F7A',
      'light blue': '#A8DADC',
      'evergreen': '#2D5F4F',
    };

    const lowerName = colorName.toLowerCase();
    return colorMap[lowerName] || '#86868B';
  };

  const selectedVariant = variants.find(v => v.id === selectedId);

  return (
    <View style={styles.container}>
      {/* 选中的颜色名称 */}
      {selectedVariant && (
        <Text style={styles.selectedColorText}>
          {selectedVariant.name}
        </Text>
      )}

      {/* 颜色圆点选择器 */}
      <View style={styles.colorsContainer}>
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          const isOutOfStock = variant.stock === 0;
          const colorHex = getColorHex(variant.value);

          return (
            <TouchableOpacity
              key={variant.id}
              style={[
                styles.colorOption,
                isSelected && styles.colorOptionSelected,
              ]}
              onPress={() => !isOutOfStock && onSelect(variant.id)}
              disabled={isOutOfStock}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: colorHex },
                  colorHex === '#FFFFFF' && styles.whiteCircle,
                  isOutOfStock && styles.colorCircleDisabled,
                ]}
              >
                {isOutOfStock && (
                  <View style={styles.outOfStockLine} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 库存提示 */}
      {selectedVariant && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
        <Text style={styles.stockWarning}>
          Only {selectedVariant.stock} left in stock
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },

  selectedColorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },

  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  colorOption: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  colorOptionSelected: {
    borderColor: '#0071E3',
  },

  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  whiteCircle: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },

  colorCircleDisabled: {
    opacity: 0.3,
  },

  outOfStockLine: {
    position: 'absolute',
    width: 40,
    height: 1,
    backgroundColor: '#FF3B30',
    transform: [{ rotate: '-45deg' }],
  },

  stockWarning: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FF9500',
    marginTop: 8,
  },
});
