import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { LIQUID_GLASS_LAYERS, DAWN_GRADIENTS } from '../../theme/core';

export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      {/* 极淡绿色渐变背景 - 上半部分微弱薄荷调 */}
      <LinearGradient 
        colors={[
          '#F0FDF4', // 上部分：极极淡的薄荷绿，几乎看不出来
          '#F7FEF9', // 渐变到更淡的绿白
          '#F8F9FA', // 下部分：中性灰
          '#F1F3F4'  // 底部：灰色
        ]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.3, 0.6, 1]} // 上半部分极淡绿调
      />
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Large Title Header */}
        <View style={styles.headerSection}>
          <Text style={styles.largeTitle}>{t('community.headerTitle')}</Text>
          <Text style={styles.subtitle}>{t('community.headerSubtitle')}</Text>
        </View>

        {/* Empty State Card with L1 Glass */}
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateCard}>
            {/* SF Symbol Icon */}
            <View style={styles.iconContainer}>
              <Ionicons 
                name="person-add-outline" 
                size={36} 
                color={theme.colors.text.tertiary}
              />
            </View>

            {/* Main Text */}
            <Text style={styles.emptyStateTitle}>{t('community.developing')}</Text>
            <Text style={styles.emptyStateDescription}>
              {t('community.developingDescription')}
            </Text>

            {/* Feature Points - Centered */}
            <View style={styles.featurePoints}>
              <View style={styles.featurePoint}>
                <View style={styles.bulletPoint} />
                <Text style={styles.featureText}>{t('community.features.discussionsDescription')}</Text>
              </View>
              <View style={styles.featurePoint}>
                <View style={styles.bulletPoint} />
                <Text style={styles.featureText}>{t('community.features.eventsDescription')}</Text>
              </View>
              <View style={styles.featurePoint}>
                <View style={styles.bulletPoint} />
                <Text style={styles.featureText}>{t('community.features.achievementsDescription')}</Text>
              </View>
              <View style={styles.featurePoint}>
                <View style={styles.bulletPoint} />
                <Text style={styles.featureText}>{t('community.features.supportDescription')}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Container - 系统背景
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary, // systemBackground
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  
  // Large Title Header - iOS原生大标题风格
  headerSection: {
    paddingHorizontal: 20, // 系统标准边距
    paddingTop: 16,
    paddingBottom: 32,
  },
  largeTitle: {
    fontSize: 28, // SF Pro Display Large Title
    fontWeight: '700', // Bold
    color: theme.colors.text.primary, // label
    letterSpacing: 0.35,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15, // SF Pro Text 次要文字
    color: theme.colors.text.secondary, // secondaryLabel
    lineHeight: 20,
    maxWidth: '85%', // 确保不超过屏幕宽度
  },
  
  // Empty State Container
  emptyStateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    minHeight: 400, // 确保卡片有足够高度
  },
  
  // Empty State Card - V2.0 中性玻璃卡片
  emptyStateCard: {
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 纯净白玻璃
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // 中性白边框
    borderTopColor: 'rgba(255, 255, 255, 0.6)', // 顶部白色高光
    ...theme.shadows.xs,
  },
  
  // Icon Container
  iconContainer: {
    marginBottom: 20, // 图标与文字间距
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background.tertiary, // 浅色图标背景
  },
  
  // Main Text
  emptyStateTitle: {
    fontSize: 22, // Title 2级别
    fontWeight: '600', // Semibold
    color: theme.colors.text.primary, // label
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  emptyStateDescription: {
    fontSize: 17, // 正文字体
    color: theme.colors.text.secondary, // secondaryLabel
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  
  // Feature Points List - 居中对齐
  featurePoints: {
    alignItems: 'center', // 整个列表居中
    marginBottom: 16, // 减少底部边距，因为没有按钮了
  },
  featurePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // 稍微增加行距
    paddingHorizontal: 12, // 增加左右内边距
    justifyContent: 'center', // 每个点也居中
    maxWidth: 280, // 限制最大宽度确保美观
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.tertiary, // tertiaryLabel
    marginRight: 12,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 15, // 次要文字大小
    color: theme.colors.text.secondary, // secondaryLabel
    lineHeight: 20,
    flex: 1,
  },
});