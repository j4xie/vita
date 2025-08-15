import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

// 深色模式rgba适配函数
const adaptRgbaForTheme = (rgba: string, darkMode = false) => {
  if (!darkMode) return rgba;
  
  // 提取rgba值
  const match = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!match) return rgba;
  
  const [, r, g, b, alpha] = match;
  
  // 深色模式下调整alpha值
  if (parseInt(r) === 255 && parseInt(g) === 255 && parseInt(b) === 255) {
    // 白色背景在深色模式下转换为深色
    return `rgba(28, 28, 30, ${alpha})`;
  } else if (parseInt(r) === 0 && parseInt(g) === 0 && parseInt(b) === 0) {
    // 黑色在深色模式下调整alpha
    return `rgba(255, 255, 255, ${parseFloat(alpha) * 0.8})`;
  }
  
  return rgba;
};
import { ConsultingDevModal, SchoolInfo } from '../../components/modals/ConsultingDevModal';
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

// Selected Schools (10 schools as requested)
const mockSchools = [
  { id: 'uw', name: 'University of Washington', shortName: 'UW', color: '#4B2E83' },
  { id: 'usc', name: 'University of Southern California', shortName: 'USC', color: '#990000' },
  { id: 'ucd', name: 'UC Davis', shortName: 'UCD', color: '#022851' },
  { id: 'ucsc', name: 'UC Santa Cruz', shortName: 'UCSC', color: '#003C6C' },
  { id: 'ucla', name: 'UC Los Angeles', shortName: 'UCLA', color: '#2774AE' },
  { id: 'uci', name: 'UC Irvine', shortName: 'UCI', color: '#FFD700' },
  { id: 'ucsb', name: 'UC Santa Barbara', shortName: 'UCSB', color: '#003660' },
  { id: 'umn', name: 'University of Minnesota', shortName: 'UMN', color: '#7A0019' },
  { id: 'ucsd', name: 'UC San Diego', shortName: 'UCSD', color: '#182B49' },
  { id: 'ucb', name: 'UC Berkeley', shortName: 'UCB', color: '#003262' },
];

export const ConsultingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInfo | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  
  // Animation state
  const scrollY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  
  // 简单的深色模式检测（可以后续扩展）
  const isDarkMode = false; // 暂时设为false，后续可接入系统设置

  const handleSchoolSelect = (schoolId: string, schoolName: string) => {
    // 触觉反馈
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Find the school info for the modal
    const school = mockSchools.find(s => s.id === schoolId);
    if (school) {
      setSelectedSchoolId(schoolId);
      setSelectedSchool(school);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSchool(null);
    setSelectedSchoolId(null);
  };


  const renderSchoolGrid = () => (
    <View style={styles.schoolsGrid}>
      {mockSchools.map((school, index) => (
        <Animated.View
          key={school.id}
          entering={FadeIn.delay(400 + index * 50).duration(300).springify()}
        >
          <TouchableOpacity
            style={[
              styles.schoolCard,
              selectedSchoolId === school.id && styles.schoolCardSelected
            ]}
            onPress={() => handleSchoolSelect(school.id, school.name)}
            activeOpacity={1}
            onPressIn={() => {
              cardScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              cardScale.value = withSpring(1, { damping: 15, stiffness: 300 });
            }}
          >
            <Animated.View style={[{ transform: [{ scale: index < 2 ? cardScale : 1 }] }]}>
              <View style={styles.schoolCardContent}>
                <View style={[styles.schoolIcon, { backgroundColor: school.color + '20' }]}>
                  <Text style={[styles.schoolShortName, { color: school.color }]}>
                    {school.shortName}
                  </Text>
                </View>
                <Text style={styles.schoolName} numberOfLines={2}>
                  {school.name}
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  // 移除renderNotDevelopedMessage函数，不再需要单独的页面

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 72 }]} // 为底部导航栏预留空间
      >
        {/* Header */}
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.95)', 'rgba(240, 247, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>{t('consulting.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('consulting.subtitle')}</Text>
            </View>
          </View>
          {/* 渐隐分隔 */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.08)', 'rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0)']}
            style={styles.headerDivider}
          />
        </LinearGradient>

        {/* Service Overview - 过渡区域 */}
        <Animated.View 
          style={styles.serviceOverview}
          entering={FadeIn.delay(200).duration(400).springify()}
        >
          <BlurView intensity={20} style={styles.overviewCard}>
            <View style={[styles.overviewCardBackground, { 
              backgroundColor: adaptRgbaForTheme('rgba(255, 255, 255, 0.65)', isDarkMode) 
            }]} />
            <View style={styles.overviewContent}>
              <Text style={styles.overviewTitle}>{t('consulting.serviceOverview')}</Text>
              
              {/* 服务统计 */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>10+</Text>
                  <Text style={styles.statLabel}>{t('consulting.supportedSchools')}</Text>
                </View>
                <View style={styles.statDot} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>50+</Text>
                  <Text style={styles.statLabel}>{t('consulting.professionalTeam')}</Text>
                </View>
                <View style={styles.statDot} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>{t('consulting.onlineServices')}</Text>
                </View>
              </View>

            </View>
          </BlurView>
        </Animated.View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t('consulting.selectSchool')}</Text>
          <Text style={styles.sectionDescription}>
            {t('consulting.selectDescription')}
          </Text>
          {renderSchoolGrid()}
        </View>
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
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1, // 确保内容可以正常滚动
  },

  // Header
  header: {
    paddingHorizontal: 16, // theme.spacing[4]
    paddingTop: 12, // theme.spacing[3] 
    paddingBottom: 16, // theme.spacing[4]
    position: 'relative',
  },
  headerContent: {
    marginBottom: 12, // theme.spacing[3]
  },
  headerTitle: {
    fontSize: 20, // 20px/semibold
    fontWeight: '600', // semibold
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13, // 13px
    color: theme.colors.text.secondary,
    opacity: 0.72,
    marginTop: 6, // 6px 间距
  },
  headerDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12, // 12px 渐隐分隔
  },

  // Service Overview - 过渡区域
  serviceOverview: {
    paddingHorizontal: 16, // theme.spacing[4]
    paddingTop: 12, // 8/12/16 节拍
    paddingBottom: 8, // 8/12/16 节拍
  },
  overviewCard: {
    borderRadius: 16, // theme.borderRadius.xl
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)', // 边框色（可后续用adaptRgbaForTheme适配）
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  overviewCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overviewContent: {
    alignItems: 'center',
    padding: 16, // theme.spacing[4]
  },
  overviewTitle: {
    fontSize: 16, // theme.typography.fontSize.base
    fontWeight: '500', // medium
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 16, // theme.spacing[4]
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // theme.spacing[3]
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20, // 20px/semibold
    fontWeight: '600', // semibold
    color: theme.colors.primary,
    marginBottom: 4, // theme.spacing[1]
  },
  statLabel: {
    fontSize: 12, // 12px
    color: theme.colors.text.secondary,
    opacity: 0.6, // opacity 0.6
    textAlign: 'center',
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.secondary,
    opacity: 0.3,
    marginHorizontal: 12, // 12px 间距
  },

  // Content
  content: {
    paddingHorizontal: 16, // theme.spacing[4]
    paddingVertical: 8, // 8/12/16 节拍
  },
  sectionTitle: {
    fontSize: 18, // theme.typography.fontSize.lg
    fontWeight: '600', // semibold
    color: theme.colors.text.primary,
    marginBottom: 8, // 8/12/16 节拍
  },
  sectionDescription: {
    fontSize: 16, // theme.typography.fontSize.base
    color: theme.colors.text.secondary,
    marginBottom: 16, // 8/12/16 节拍
    lineHeight: 16 * 1.4,
  },

  // Schools Grid
  schoolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  schoolCard: {
    width: (screenWidth - 16 * 2 - 12) / 2, // 计算宽度
    marginBottom: 12, // 8/12/16 节拍
    borderRadius: 14, // 14px 圆角
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)', // 更淡的边框
    backgroundColor: 'rgba(255, 255, 255, 0.72)', // 背景色
    ...theme.shadows.sm, // 更轻的阴影
  },
  schoolCardSelected: {
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.24)', // 选中外描边
  },
  schoolCardContent: {
    padding: 16, // theme.spacing[4]
    alignItems: 'center',
    minHeight: 132, // 132px 最小高度
    justifyContent: 'center',
  },
  schoolIcon: {
    width: 52,
    height: 52,
    borderRadius: 26, // 全圆角
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, // theme.spacing[2]
  },
  schoolShortName: {
    fontSize: 14, // 14px/medium
    fontWeight: '500', // medium
  },
  schoolName: {
    fontSize: 12, // 12px
    fontWeight: '400', // regular
    color: theme.colors.text.primary,
    opacity: 0.8, // opacity 0.8
    textAlign: 'center',
    marginBottom: 8, // theme.spacing[2]
    minHeight: 36, // 36px 最小高度
  },
  schoolStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolStudentCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },

  // 移除不再需要的样式
});