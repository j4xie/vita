import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Benefit {
  id: string;
  icon: string;
  title: string;
}

interface BenefitsCarouselProps {
  benefits: Benefit[];
}

/**
 * BenefitsCarousel - 会员权益横向轮播
 *
 * 参考截图中的Member Benefits横向滚动卡片
 * - 圆形图标
 * - 黑色线条图标
 * - 标题在下方
 * - 白色卡片背景
 */
export const BenefitsCarousel: React.FC<BenefitsCarouselProps> = ({ benefits }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {benefits.map((benefit) => (
          <View key={benefit.id} style={styles.benefitCard}>
            <View style={styles.iconCircle}>
              <Ionicons name={benefit.icon as any} size={20} color="#1A1A1A" />
            </View>
            <Text style={styles.benefitTitle} numberOfLines={2}>
              {benefit.title}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  benefitCard: {
    width: 70,
    alignItems: 'center',
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  benefitTitle: {
    fontSize: 9,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 12,
  },
});
