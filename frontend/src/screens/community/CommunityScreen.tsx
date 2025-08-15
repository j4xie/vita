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

export const CommunityScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
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

        {/* Empty State Card with Gradient - Shadow优化 */}
        <View style={styles.emptyStateContainer}>
          {/* Shadow容器 - 使用solid background优化阴影渲染 */}
          <View style={styles.emptyStateShadowContainer}>
            <LinearGradient
              colors={[
                'rgba(248, 250, 255, 0.95)', // 极浅的蓝灰色
                'rgba(255, 255, 255, 0.98)', // 几乎纯白
                'rgba(243, 244, 246, 0.92)', // 极浅的灰色
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyStateCard}
            >
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
            </LinearGradient>
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
  
  // Shadow容器 - 解决LinearGradient阴影冲突
  emptyStateShadowContainer: {
    borderRadius: 28, // 更圆润的28pt圆角
    backgroundColor: theme.colors.background.primary, // solid background用于阴影优化
    // 添加微妙的阴影增强层次感
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1, // Android阴影
  },
  
  // Empty State Card - 渐变背景（移除阴影）
  emptyStateCard: {
    borderRadius: 28, // 更圆润的28pt圆角
    paddingHorizontal: 28, // 稍微增加内边距
    paddingVertical: 40, // 增加垂直内边距
    alignItems: 'center',
    // 移除阴影，由emptyStateShadowContainer处理
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