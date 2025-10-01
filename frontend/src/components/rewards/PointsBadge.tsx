import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PointsBadgeProps {
  points: number;
  earnPercentage?: number; // "Earn 20%" style badge
  style?: any;
}

/**
 * PointsBadge - 积分徽章组件
 *
 * 显示商品积分价格或赚取百分比
 * 设计参考：Shopify "Earn 20%" 紫色徽章
 */
export const PointsBadge: React.FC<PointsBadgeProps> = ({
  points,
  earnPercentage,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        {earnPercentage
          ? `Earn ${earnPercentage}%`
          : `${points}积分`
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(126, 87, 194, 1)', // Purple from reference image
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },

  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
