import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface SchoolInfo {
  id: string;
  name: string;
  shortName: string;
}

interface CommunityDevModalProps {
  visible: boolean;
  school: SchoolInfo | null;
  onClose: () => void;
}

export const CommunityDevModal: React.FC<CommunityDevModalProps> = ({
  visible,
  school,
  onClose,
}) => {
  const { t } = useTranslation();
  
  // 🌙 Dark Mode Support
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, blur: dmBlur } = darkModeSystem;

  if (!school) return null;

  const logoSource = getSchoolLogo(school.id);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={dmBlur.intensity} tint={dmBlur.tint} style={[styles.backdrop, dmStyles.modal.overlay]}>
        <SafeAreaView style={styles.container}>
          <View style={dmStyles.modal.container}>
            <LinearGradient
              colors={isDarkMode 
                ? ['rgba(44, 44, 46, 0.95)', 'rgba(28, 28, 30, 0.85)']  // 深色模式渐变
                : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'] // 浅色模式渐变
              }
              style={styles.modalContent}
            >
              {/* Header with close button */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={isDarkMode ? dmStyles.text.secondary.color : "#666666"} />
                </TouchableOpacity>
              </View>

              {/* School logo and name */}
              <View style={styles.schoolInfo}>
                <View style={styles.logoContainer}>
                  {logoSource ? (
                    <Image source={logoSource} style={styles.schoolLogo} resizeMode="cover" />
                  ) : (
                    <View style={styles.fallbackLogo}>
                      <Text style={styles.fallbackLogoText}>{school.shortName}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.schoolName}>{school.name}</Text>
                <Text style={styles.schoolShortName}>{school.shortName}</Text>
              </View>

              {/* Development status */}
              <View style={styles.statusSection}>
                <View style={styles.statusBadge}>
                  <Ionicons name="construct-outline" size={20} color="#FF6B35" />
                  <Text style={styles.statusText}>{t('community.developing')}</Text>
                </View>
                <Text style={styles.developmentMessage}>
                  {t('community.developingDescription')}
                </Text>
              </View>

              {/* Upcoming features */}
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>{t('community.upcomingFeatures')}</Text>
                <View style={styles.featuresList}>
                  <FeatureItem
                    icon="storefront-outline"
                    title={t('community.features.merchantOffers')}
                    description={t('community.features.merchantOffersDescription')}
                  />
                  <FeatureItem
                    icon="swap-horizontal-outline"
                    title={t('community.features.secondHand')}
                    description={t('community.features.secondHandDescription')}
                  />
                  <FeatureItem
                    icon="briefcase-outline"
                    title={t('community.features.career')}
                    description={t('community.features.careerDescription')}
                  />
                  <FeatureItem
                    icon="people-circle-outline"
                    title={t('community.features.alumni')}
                    description={t('community.features.alumniDescription')}
                  />
                </View>
              </View>

              {/* Close button */}
              <TouchableOpacity style={styles.closeActionButton} onPress={onClose}>
                <Text style={styles.closeActionText}>{t('common.iKnow')}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};

const FeatureItem: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={20} color="#FF6B35" />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContainer: {
    width: screenWidth - 40,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  modalContent: {
    padding: 24,
  },

  header: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  schoolInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoContainer: {
    marginBottom: 12,
  },

  schoolLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  fallbackLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallbackLogoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },

  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
  },

  schoolShortName: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },

  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },

  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 6,
  },

  developmentMessage: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },

  featuresSection: {
    marginBottom: 24,
  },

  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },

  featuresList: {
    // gap not supported in RN, using marginBottom instead
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },

  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },

  featureDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },

  closeActionButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },

  closeActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});