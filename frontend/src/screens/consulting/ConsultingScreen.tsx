import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { SchoolLogo } from '../../components/common/SchoolLogo';
import { ConsultingDevModal, SchoolInfo } from '../../components/modals/ConsultingDevModal';
import { GlassCapsule } from '../../components/consulting/GlassCapsule';
import { LiquidGlassCard } from '../../components/consulting/LiquidGlassCard';
import { Glass } from '../../ui/glass/GlassTheme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  SlideInUp,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

// School consulting data will be loaded from real API when implemented

export const ConsultingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // V2.0 简化升级，直接使用硬编码样式
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInfo | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  
  // Animation state
  const scrollY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  
  // 简单的深色模式检测（可以后续扩展）
  const isDarkMode = false; // 暂时设为false，后续可接入系统设置

  const handleSchoolSelect = (schoolId: string) => {
    // 触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Consulting service feature developing - show placeholder modal
    setSelectedSchoolId(schoolId);
    setSelectedSchool({
      id: schoolId,
      name: 'Consulting Service Developing',
      shortName: 'DEV',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSchool(null);
    setSelectedSchoolId(null);
  };


  // 计算卡片尺寸 - 使用Glass主题规格
  const gutter = Glass.touch.spacing.gridGutter;
  const cardWidth = Math.floor((screenWidth - gutter * 3) / 2); // 2列布局

  const renderSchoolGrid = () => {
    return (
      <View style={styles.schoolsGrid}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('consulting.service_developing') || '咨询服务开发中'}</Text>
          <Text style={styles.emptySubtext}>{t('consulting.contact_admin') || '如有需要请联系管理员'}</Text>
        </View>
      </View>
    );
  };

  // 移除renderNotDevelopedMessage函数，不再需要单独的页面

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
          <Text style={styles.headerTitle}>{t('consulting.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('consulting.subtitle')}
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
        {renderSchoolGrid()}
      </ScrollView>

      {/* Custom Consulting Development Modal */}
      <ConsultingDevModal
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
    backgroundColor: 'rgba(255, 255, 255, 0.001)', // Nearly invisible but solid for shadow calculation
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
  },

  // Header - iOS风格
  header: {
    paddingHorizontal: 20, // 系统标准边距，与Community一致
    paddingTop: 16, // 与Community一致的顶部间距
    paddingBottom: 12, // 保持底部间距
  },
  
  headerTitle: {
    fontSize: 28, // iOS Large Title
    fontWeight: '700',
    color: Glass.textMain,
  },
  
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: Glass.textWeak,
  },

  // 统计胶囊区域
  statsSection: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    marginBottom: 20,
  },

  // Section标题区域
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

  // 学校网格
  schoolsGrid: {
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    rowGap: Glass.touch.spacing.gridGutter,
  },

  schoolRow: {
    flexDirection: 'row',
    columnGap: Glass.touch.spacing.gridGutter,
  },

  // Empty state
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
});