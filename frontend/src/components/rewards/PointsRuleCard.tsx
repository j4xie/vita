import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * PointsRuleCard - 积分规则说明卡片
 *
 * 1:1还原Shangri-La设计："1 USD Spent = 1.5 Points Earned"
 * - 居中对齐
 * - 使用 "=" 符号
 * - 简洁白色卡片
 */
export const PointsRuleCard: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 第一条规则 */}
      <View style={styles.ruleRow}>
        <View style={styles.leftValue}>
          <Text style={styles.numberText}>1</Text>
          <Text style={styles.unitText}>小时志愿</Text>
        </View>

        <Text style={styles.equalSign}>=</Text>

        <View style={styles.rightValue}>
          <Text style={styles.numberText}>100</Text>
          <Text style={styles.unitText}>积分</Text>
        </View>
      </View>

      {/* 分隔线 */}
      <View style={styles.divider} />

      {/* 第二条规则 */}
      <View style={styles.ruleRow}>
        <View style={styles.leftValue}>
          <Text style={styles.numberText}>1</Text>
          <Text style={styles.unitText}>个活动</Text>
        </View>

        <Text style={styles.equalSign}>=</Text>

        <View style={styles.rightValue}>
          <Text style={styles.numberText}>50</Text>
          <Text style={styles.unitText}>积分</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  leftValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  rightValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  numberText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  unitText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666666',
  },

  equalSign: {
    fontSize: 24,
    fontWeight: '400',
    color: '#CCCCCC',
    marginHorizontal: 16,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
    marginHorizontal: 20,
  },
});
