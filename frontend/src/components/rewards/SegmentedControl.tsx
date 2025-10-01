import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

/**
 * SegmentedControl - iOS风格分段控制器
 *
 * 参考截图中的 "Nights | Tier Points" 切换
 * - 灰色背景
 * - 白色选中状态
 * - 圆角胶囊形状
 */
export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onSelectIndex,
}) => {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.segment,
              isSelected && styles.segmentSelected,
            ]}
            onPress={() => onSelectIndex(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.segmentTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA', // iOS灰色
    borderRadius: 9,
    padding: 2,
    alignSelf: 'center',
  },

  segment: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 7,
    minWidth: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },

  segmentTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
});
