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
 * BenefitsCarousel - Member Benefits Horizontal Scroll
 * 
 * Updated for Dark Luxury Theme:
 * - High contrast Gold on Dark icons
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
              <Ionicons name={benefit.icon as any} size={24} color="#D4AF37" />
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
    // Removed bottom margin to let parent control spacing
  },

  scrollContent: {
    paddingHorizontal: 16, // Consistent padding
    gap: 16,
  },

  benefitCard: {
    width: 72,
    alignItems: 'center',
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A', // Dark circle for high contrast
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  benefitTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 14,
  },
});
