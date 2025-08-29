import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { Glass } from '../../ui/glass/GlassTheme';
import { useTranslation } from 'react-i18next';

const { width: screenWidth } = Dimensions.get('window');

interface School {
  id: string;
  name: string;
  shortName: string;
  deptId: number;
  deptName: string;
}

interface SchoolGridProps {
  schools: School[];
  loading: boolean;
  onSchoolSelect: (schoolId: string) => void;
  onRetry?: () => void;
}

export const SchoolGrid: React.FC<SchoolGridProps> = ({
  schools,
  loading,
  onSchoolSelect,
  onRetry
}) => {
  const { t } = useTranslation();
  
  const gutter = Glass.touch.spacing.gridGutter;
  const cardWidth = Math.floor((screenWidth - gutter * 3) / 2);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (schools.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t('community.no_schools_available')}</Text>
        <Text style={styles.emptySubtext}>{t('community.check_connection')}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.schoolsGrid}>
      {schools.map((school) => (
        <TouchableOpacity 
          key={school.id}
          style={styles.schoolCard}
          onPress={() => onSchoolSelect(school.id)}
          activeOpacity={0.9}
        >
          <View style={styles.schoolContent}>
            <View style={styles.logoContainer}>
              {(() => {
                const logoSource = getSchoolLogo(school.id);
                return logoSource ? (
                  <Image
                    source={logoSource}
                    style={styles.schoolLogo}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.fallbackLogo}>
                    <Text style={styles.fallbackLogoText}>{school.shortName}</Text>
                  </View>
                );
              })()}
            </View>
            <Text style={styles.schoolName}>{school.name}</Text>
            <Text style={styles.schoolShortName}>{school.shortName}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  schoolsGrid: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  schoolCard: {
    width: '47%',
    marginBottom: Glass.touch.spacing.gridGutter,
  },

  schoolContent: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  logoContainer: {
    marginBottom: 8,
  },

  schoolLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  fallbackLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fallbackLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: Glass.textMain,
  },

  schoolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
  },

  schoolShortName: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },

  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: Glass.textWeak,
    textAlign: 'center',
  },

  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginHorizontal: Glass.touch.spacing.sectionMargin,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Glass.textMain,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtext: {
    fontSize: 14,
    color: Glass.textWeak,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },

  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});