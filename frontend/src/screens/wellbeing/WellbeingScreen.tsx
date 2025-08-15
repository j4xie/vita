import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, BRAND_GLASS, BRAND_INTERACTIONS } from '../../theme/core';
import { usePerformanceDegradation } from '../../hooks/usePerformanceDegradation';
import { VolunteerListScreen } from './VolunteerListScreen';
import { SchoolSelectionScreen } from './SchoolSelectionScreen';
import { School } from '../../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

interface TabItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
}

// 将tabs定义移到组件内部以使用t()函数

export const WellbeingScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('volunteer'); // 默认选中启用的tab
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showSchoolSelection, setShowSchoolSelection] = useState(false);
  
  // V2.0 获取分层配置
  const { getLayerConfig } = usePerformanceDegradation();
  const L1Config = getLayerConfig('L1', false);
  const L2Config = getLayerConfig('L2', false);

  // 处理从其他页面传入的参数
  useEffect(() => {
    const params = route.params as any;
    if (params?.selectedSchool && params?.fromConsulting) {
      // 来自咨询页面的学校选择
      const schoolData = {
        id: params.selectedSchool.id,
        name: params.selectedSchool.name,
        shortName: params.selectedSchool.shortName,
      };
      
      console.log('Setting selected school from consulting:', schoolData);
      setSelectedSchool(schoolData);
      setShowSchoolSelection(false); // 强制不显示学校选择界面
      setActiveTab('volunteer'); // 确保在志愿者tab
      
      // 清除导航参数，避免重复处理
      navigation.setParams({ selectedSchool: undefined, fromConsulting: undefined });
    }
  }, [route.params, navigation]);
  
  const tabs: TabItem[] = [
    {
      id: 'wellbeing-plan',
      title: t('wellbeing.tabs.plan'),
      icon: 'shield-outline',
      enabled: true, // 启用Wellbeing Plan按钮
    },
    {
      id: 'volunteer',
      title: t('wellbeing.tabs.volunteer'),
      icon: 'people-outline',
      enabled: true,
    },
  ];

  const handleTabPress = (tabId: string, enabled: boolean) => {
    if (enabled) {
      setActiveTab(tabId);
      if (tabId === 'volunteer' && !selectedSchool) {
        setShowSchoolSelection(true);
      }
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setShowSchoolSelection(false);
  };

  const handleBackToSchoolSelection = () => {
    setShowSchoolSelection(true);
  };

  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      <View style={styles.tabBackground}>
        <View style={styles.tabsWrapper}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isEnabled = tab.enabled;
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && isEnabled && styles.tabActive,
                  !isEnabled && styles.tabDisabled,
                ]}
                onPress={() => handleTabPress(tab.id, isEnabled)}
                activeOpacity={isEnabled ? 0.7 : 1}
                disabled={!isEnabled}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={tab.icon}
                    size={20}
                    color={
                      !isEnabled
                        ? theme.colors.text.disabled
                        : isActive
                        ? theme.colors.primary
                        : theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      !isEnabled && styles.tabTextDisabled,
                      isActive && isEnabled && styles.tabTextActive,
                    ]}
                  >
                    {tab.title}
                  </Text>
                  {!isEnabled && (
                    <View style={styles.disabledBadge}>
                      <Text style={styles.disabledBadgeText}>{t('wellbeing.plan.developing')}</Text>
                    </View>
                  )}
                </View>
                {isActive && isEnabled && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderWellbeingPlan = () => (
    <View style={styles.disabledContent}>
      {/* Shadow容器 - 使用solid background优化阴影渲染 */}
      <View style={styles.disabledCardShadowContainer}>
        <LinearGradient
          colors={['rgba(248, 250, 255, 0.5)', 'rgba(240, 240, 240, 0.3)']}
          style={styles.disabledCard}
        >
        <View style={styles.disabledIconContainer}>
          <LinearGradient
            colors={[theme.colors.background.tertiary + '40', theme.colors.border.secondary + '20']}
            style={styles.disabledIconBackground}
          >
            <Ionicons name="shield-outline" size={48} color={theme.colors.text.disabled} />
          </LinearGradient>
        </View>
        
        <Text style={styles.disabledTitle}>{t('wellbeing.plan.title')}</Text>
        <Text style={styles.disabledSubtitle}>
          {t('wellbeing.plan.subtitle')}
        </Text>
        
        <View style={styles.featurePreview}>
          {[
            { icon: 'location-outline', text: t('wellbeing.plan.features.location') },
            { icon: 'call-outline', text: t('wellbeing.plan.features.emergency') },
            { icon: 'heart-outline', text: t('wellbeing.plan.features.mental') },
            { icon: 'medical-outline', text: t('wellbeing.plan.features.medical') },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={feature.icon as any} size={16} color={theme.colors.text.secondary} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.comingSoonBadge}>
          <LinearGradient
            colors={[theme.colors.border.secondary, theme.colors.text.disabled]}
            style={styles.badgeGradient}
          >
            <Ionicons name="construct-outline" size={14} color="white" />
            <Text style={styles.badgeText}>{t('wellbeing.plan.developing')}</Text>
          </LinearGradient>
        </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'wellbeing-plan':
        return renderWellbeingPlan();
      case 'volunteer':
        if (showSchoolSelection || !selectedSchool) {
          return (
            <View style={styles.volunteerContent}>
              <SchoolSelectionScreen onSchoolSelect={handleSchoolSelect} />
            </View>
          );
        }
        return (
          <View style={styles.volunteerContent}>
            <VolunteerListScreen 
              selectedSchool={selectedSchool}
              onBackToSchoolSelection={handleBackToSchoolSelection}
            />
          </View>
        );
      default:
        return renderWellbeingPlan();
    }
  };

  // 只在选择学校模式或未选中学校时显示tab header
  const shouldShowTabHeader = showSchoolSelection || !selectedSchool;

  return (
    <SafeAreaView style={styles.container}>
      {shouldShowTabHeader && renderTabHeader()}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },

  // Tab Header
  tabContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  tabBackground: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4, // 从8减少到4，缩小与下方内容的间距
    backgroundColor: theme.colors.background.secondary,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: LIQUID_GLASS_LAYERS.L1.background.light, // L1玻璃背景
    borderWidth: LIQUID_GLASS_LAYERS.L1.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L1.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L1.borderRadius.card, // 16pt圆角
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    // 移除重阴影，保持轻量设计
  },
  tab: {
    flex: 1,
    position: 'relative',
    overflow: 'visible',
  },
  tabActive: {
    backgroundColor: LIQUID_GLASS_LAYERS.L2.background.light, // L2品牌玻璃背景
    borderWidth: LIQUID_GLASS_LAYERS.L2.border.width,
    borderColor: LIQUID_GLASS_LAYERS.L2.border.color.light,
    borderRadius: LIQUID_GLASS_LAYERS.L2.borderRadius.compact, // 12pt圆角
    ...theme.shadows[LIQUID_GLASS_LAYERS.L2.shadow],
  },
  tabDisabled: {
    opacity: 0.6,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[2],
    position: 'relative',
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[2],
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tabTextDisabled: {
    color: theme.colors.text.disabled,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -theme.spacing[2],
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  disabledBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: theme.colors.text.disabled,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.xs,
  },
  disabledBadgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: theme.typography.fontWeight.semibold,
  },

  // Content Areas
  volunteerContent: {
    flex: 1,
    // 移除负边距，因为志愿者列表页面不显示tab header
  },

  // Disabled Content (Wellbeing Plan)
  disabledContent: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Shadow容器 - 解决LinearGradient阴影冲突
  disabledCardShadowContainer: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.primary, // solid background用于阴影优化
    maxWidth: screenWidth - theme.spacing[4] * 2,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    ...theme.shadows.md,
  },
  
  disabledCard: {
    padding: theme.spacing[6],
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    // 移除阴影，由disabledCardShadowContainer处理
  },
  disabledIconContainer: {
    marginBottom: theme.spacing[4],
  },
  disabledIconBackground: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.tertiary,
  },
  disabledTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  disabledSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.4,
    marginBottom: theme.spacing[4],
  },

  // Feature Preview
  featurePreview: {
    width: '100%',
    marginBottom: theme.spacing[4],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: theme.borderRadius.lg,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing[2],
  },

  // Coming Soon Badge
  comingSoonBadge: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: 'white',
    marginLeft: theme.spacing[1],
  },
});