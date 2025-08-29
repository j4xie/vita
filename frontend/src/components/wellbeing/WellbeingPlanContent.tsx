import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';

export const WellbeingPlanContent: React.FC = () => {
  const { t } = useTranslation();

  const handleEmergencyCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 欢迎标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('wellbeing.plan.welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('wellbeing.plan.welcome_subtitle')}</Text>
      </View>

      {/* 紧急联系 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('wellbeing.plan.emergency_contacts')}</Text>
        
        <TouchableOpacity 
          style={styles.emergencyCard}
          onPress={() => handleEmergencyCall('911')}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 71, 87, 0.1)' }]}>
            <Ionicons name="call" size={24} color="#FF4757" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('wellbeing.plan.emergency_911')}</Text>
            <Text style={styles.cardDescription}>{t('wellbeing.plan.emergency_911_desc')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.emergencyCard}
          onPress={() => handleEmergencyCall('988')}
        >
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(46, 213, 115, 0.1)' }]}>
            <Ionicons name="heart" size={24} color="#2ED573" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('wellbeing.plan.crisis_hotline')}</Text>
            <Text style={styles.cardDescription}>{t('wellbeing.plan.crisis_hotline_desc')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 开发中提示 */}
      <View style={styles.developingSection}>
        <View style={styles.developingCard}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
            <Ionicons name="construct-outline" size={24} color="#FF6B35" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('wellbeing.plan.developing')}</Text>
            <Text style={styles.cardDescription}>更多安心功能正在开发中，敬请期待</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Glass.textMain,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: Glass.textWeak,
    textAlign: 'center',
    lineHeight: 24,
  },

  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 16,
  },

  emergencyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  developingSection: {
    marginBottom: 40,
  },

  developingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },

  cardDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});