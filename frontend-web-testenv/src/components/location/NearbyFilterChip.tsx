/* Web端特定版本 - 与App端隔离 */
/**
 * "附近"筛选Chip - 选中时使用L2玻璃效果
 * 用于在活动列表中筛选附近的活动
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LIQUID_GLASS_LAYERS } from '../../theme/core';
import { theme } from '../../theme';

interface NearbyFilterChipProps {
  isSelected: boolean;
  onPress: () => void;
  distance?: string; // 例如："2.5km"
  style?: ViewStyle;
}

export const NearbyFilterChip: React.FC<NearbyFilterChipProps> = ({
  isSelected,
  onPress,
  distance,
  style,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected ? styles.selectedContainer : styles.unselectedContainer,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="location" 
        size={14} 
        color={isSelected ? '#FFFFFF' : '#F9A889'} 
      />
      <Text style={[
        styles.text,
        isSelected ? styles.selectedText : styles.unselectedText,
      ]}>
        {distance 
          ? t('location.nearby_with_distance', '附近 {{distance}}', { distance }) 
          : t('location.nearby', '附近')
        }
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20, // 药丸形状
    minHeight: 44, // 满足最小触控区域44pt标准
    gap: 4,
  },
  // 未选中状态 - 透明背景
  unselectedContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 137, 0.3)',
  },
  // 选中状态 - L2玻璃效果
  selectedContainer: {
    backgroundColor: LIQUID_GLASS_LAYERS.L2.background.light,
    borderWidth: LIQUID_GLASS_LAYERS.L2.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
    // 微妙阴影
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  unselectedText: {
    color: '#F9A889',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});