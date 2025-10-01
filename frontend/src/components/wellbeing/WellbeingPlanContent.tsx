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

  // Enhanced card styles with better visual design
  const staticCardStyles = StyleSheet.create({
    emergencyCard: {
      borderRadius: 20,
      padding: 24,
      marginBottom: 16,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      borderWidth: 1,
      minHeight: 88,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginBottom: 4,
      letterSpacing: 0.2,
      lineHeight: 21,
      opacity: 0.9,
    },

    cardDescription: {
      fontSize: 14,
      lineHeight: 19,
      opacity: 0.75,
      letterSpacing: 0.1,
      marginTop: 2,
    },

    phoneNumber: {
      fontSize: 20,
      fontWeight: '800' as const,
      letterSpacing: 1.0,
      textAlign: 'center' as const,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      marginBottom: 20,
      letterSpacing: 0.3,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 欢迎标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('wellbeing.plan.welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('wellbeing.plan.welcome_subtitle')}</Text>
      </View>

      {/* 重要提示卡片 */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={20} color="#4285F4" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('wellbeing.plan.emergency_warning')}</Text>
            <Text style={styles.infoText}>{t('wellbeing.plan.emergency_warning_text')}</Text>
          </View>
        </View>
        <Text style={styles.serviceDescription}>{t('wellbeing.plan.service_description')}</Text>
      </View>

      {/* 紧急联系 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('wellbeing.plan.emergency_contacts')}</Text>
        
        <TouchableOpacity
          style={[staticCardStyles.emergencyCard, styles.emergencyCard911]}
          onPress={() => handleEmergencyCall('911')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, {
            backgroundColor: 'rgba(255, 71, 87, 0.15)',
            borderWidth: 2,
            borderColor: 'rgba(255, 71, 87, 0.2)',
          }]}>
            <Ionicons name="call" size={26} color="#FF4757" />
          </View>
          <View style={styles.cardContent}>
            <Text style={[staticCardStyles.cardTitle, styles.cardTitle911]}>Emergency</Text>
            <View style={[styles.phoneNumberContainer, styles.phoneContainer911]}>
              <Text style={[staticCardStyles.phoneNumber, styles.phoneNumber911]}>9-1-1</Text>
            </View>
            <Text style={[staticCardStyles.cardDescription, styles.cardDescription911]}>{t('wellbeing.plan.emergency_911_desc')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[staticCardStyles.emergencyCard, styles.emergencyCard988]}
          onPress={() => handleEmergencyCall('988')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, {
            backgroundColor: 'rgba(46, 213, 115, 0.15)',
            borderWidth: 2,
            borderColor: 'rgba(46, 213, 115, 0.2)',
          }]}>
            <Ionicons name="heart" size={26} color="#2ED573" />
          </View>
          <View style={styles.cardContent}>
            <Text style={[staticCardStyles.cardTitle, styles.cardTitle988]}>Crisis Hotline</Text>
            <View style={[styles.phoneNumberContainer, styles.phoneContainer988]}>
              <Text style={[staticCardStyles.phoneNumber, styles.phoneNumber988]}>9-8-8</Text>
            </View>
            <Text style={[staticCardStyles.cardDescription, styles.cardDescription988]}>{t('wellbeing.plan.crisis_hotline_desc')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 开发中提示已隐藏以通过App Store审核 */}
      {/* <View style={styles.developingSection}>
        <View style={styles.developingCard}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.1)' }]}>
            <Ionicons name="construct-outline" size={24} color="#FF6B35" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('wellbeing.plan.developing')}</Text>
            <Text style={styles.cardDescription}>{t('wellbeing.plan.developing_subtitle')}</Text>
          </View>
        </View>
      </View> */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },

  header: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Glass.textMain,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 8,
    lineHeight: 28,
    letterSpacing: 0.3,
  },

  subtitle: {
    fontSize: 14,
    color: Glass.textWeak,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 4,
    opacity: 0.75,
    letterSpacing: 0.1,
  },

  section: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Glass.textMain,
    marginBottom: 16,
    letterSpacing: 0.3,
    textAlign: 'left',
  },

  emergencyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },

  phoneNumberContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },

  infoSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  infoCard: {
    backgroundColor: 'rgba(66, 133, 244, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.15)',
  },

  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(66, 133, 244, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
    marginBottom: 4,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 17,
    color: '#5F6368',
    fontWeight: '400',
  },

  serviceDescription: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    color: '#9AA0A6',
    fontStyle: 'italic',
  },

  // 911紧急卡片样式
  emergencyCard911: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: 'rgba(255, 71, 87, 0.3)',
    shadowOpacity: 0.2,
    elevation: 8,
    borderColor: 'rgba(255, 71, 87, 0.15)',
    borderWidth: 1,
  },

  cardTitle911: {
    color: '#1F2937',
  },

  phoneContainer911: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },

  phoneNumber911: {
    color: '#FF4757',
  },

  cardDescription911: {
    color: '#6B7280',
  },

  // 988危机热线卡片样式
  emergencyCard988: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: 'rgba(46, 213, 115, 0.3)',
    shadowOpacity: 0.2,
    elevation: 8,
    borderColor: 'rgba(46, 213, 115, 0.15)',
    borderWidth: 1,
  },

  cardTitle988: {
    color: '#1F2937',
  },

  phoneContainer988: {
    backgroundColor: 'rgba(46, 213, 115, 0.1)',
  },

  phoneNumber988: {
    color: '#2ED573',
  },

  cardDescription988: {
    color: '#6B7280',
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
    lineHeight: 19,
  },
});