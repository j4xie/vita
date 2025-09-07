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
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';


export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const { schools, loading, loadSchools } = useSchoolData();
  
  // 🌙 Dark Mode Support
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles, gradients: dmGradients } = darkModeSystem;
  
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolInfo | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  
  // 🚀 滚动状态追踪 - 防止滚动时误触卡片
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);


  const handleSchoolSelect = (schoolId: string) => {
    // 🚨 关键修复：如果正在滚动，忽略点击事件
    if (isScrolling) {
      console.log('🚫 [SCROLL-PROTECTION] 正在滚动，忽略学校卡片点击');
      return;
    }
    
    console.log('✅ [SCHOOL-CLICK] 学校点击有效:', schoolId);
    
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

  // 🚀 滚动状态处理函数 - 更激进的保护
  const handleScrollBegin = () => {
    setIsScrolling(true);
    console.log('📜 [SCROLL-START] 开始滚动，禁用卡片点击，时间:', new Date().toISOString());
    
    // 清除之前的计时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleScrollEnd = () => {
    // 滚动结束后等待更长时间再启用点击，确保用户手指完全离开
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      console.log('📜 [SCROLL-END] 滚动结束，重新启用卡片点击');
    }, 800); // 延长到800ms，与卡片延迟时间匹配
  };

  // 🚀 即时滚动检测 - 监听任何滚动变化
  const handleScroll = () => {
    // 立即设置滚动状态，不等待
    if (!isScrolling) {
      console.log('📜 [SCROLL-DETECT] 检测到滚动，立即禁用点击，时间:', new Date().toISOString());
    }
    setIsScrolling(true);
    
    // 清除并重新设置计时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 滚动停止后等待更长时间
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      console.log('📜 [SCROLL-IDLE] 滚动完全停止，重新启用点击，时间:', new Date().toISOString());
    }, 800);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSchool(null);
    setSelectedSchoolId(null);
  };

  // 🧹 清理定时器
  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, dmStyles.page.safeArea]}>
      {/* iOS风格Header背景：增强对比的暖色渐变 - 🌙 Dark Mode适配 */}
      <LinearGradient
        colors={isDarkMode ? [
          '#000000',   // 纯黑顶部
          '#1C1C1E',   // Apple系统深灰  
          '#2C2C2E',   // 渐变到更浅深灰
          '#1C1C1E'    // 底部回到系统深灰
        ] : [
          '#FFE4C4',    // 恢复原来的暖色
          '#FFF0E6',    // 恢复原来的浅桃色
          '#F8F9FA',    // 渐变到浅灰
          '#F1F3F4'     // 底部中性灰
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
        onScrollBeginDrag={handleScrollBegin}         // 开始拖动滚动
        onScrollEndDrag={handleScrollEnd}             // 拖动结束
        onMomentumScrollBegin={handleScrollBegin}     // 惯性滚动开始
        onMomentumScrollEnd={handleScrollEnd}         // 惯性滚动结束
        onScroll={handleScroll}                       // 任何滚动变化
        scrollEventThrottle={1}                       // 更高频率的滚动检测
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
          isScrolling={isScrolling}  // 🚀 传递滚动状态给SchoolGrid
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
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