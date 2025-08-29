import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { CommunityDevModal, SchoolInfo } from '../../components/modals/CommunityDevModal';
import { GlassCapsule } from '../../components/consulting/GlassCapsule';
import { SchoolGrid } from '../../components/common/SchoolGrid';
import { useSchoolData } from '../../hooks/useSchoolData';
import { Glass } from '../../ui/glass/GlassTheme';


export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const { schools, loading, loadSchools } = useSchoolData();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInfo | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);


  const handleSchoolSelect = (schoolId: string) => {
    // 触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // 找到选中的学校
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setSelectedSchoolId(schoolId);
      setSelectedSchool({
        id: schoolId,
        name: school.name,
        shortName: school.shortName,
      });
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSchool(null);
    setSelectedSchoolId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* iOS风格Header背景：增强对比的暖色渐变 */}
      <LinearGradient
        colors={[
          Glass.pageBgTop,     // 更深的暖色
          Glass.pageBgBottom,  // 明显对比
          '#F8F9FA',          // 渐变到浅灰
          '#F1F3F4'           // 底部中性灰
        ]}
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        locations={[0, 0.3, 0.7, 1]} // 上半部分暖色，下半部分中性
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingBottom: insets.bottom + 80 
          }
        ]}
      >
        {/* Header - iOS风格大标题 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('community.headerTitle')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('community.headerSubtitle')}
          </Text>
        </View>

        {/* 统计胶囊（玻璃） */}
        <View style={styles.statsSection}>
          <GlassCapsule
            items={[
              { value: '10+', label: t('consulting.stats.supported_schools') },
              { value: '50+', label: t('consulting.stats.professional_advisors') },
              { value: '24/7', label: t('consulting.stats.online_services') },
            ]}
          />
        </View>

        {/* Section 标题 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('consulting.selectSchool')}</Text>
          <Text style={styles.sectionDescription}>
            {t('consulting.selectDescription')}
          </Text>
        </View>

        {/* 学校网格 */}
        <SchoolGrid
          schools={schools}
          loading={loading}
          onSchoolSelect={handleSchoolSelect}
          onRetry={loadSchools}
        />
      </ScrollView>

      {/* Community Development Modal */}
      <CommunityDevModal
        visible={showModal}
        school={selectedSchool}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.001)',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Glass.textMain,
  },
  
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: Glass.textWeak,
  },

  statsSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 20,
  },

  sectionHeader: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 10,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Glass.textMain,
  },
  
  sectionDescription: {
    marginTop: 6,
    fontSize: 14,
    color: Glass.textWeak,
  },

});