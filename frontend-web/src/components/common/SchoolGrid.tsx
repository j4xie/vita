import React, { useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { Glass } from '../../ui/glass/GlassTheme';
import { useTranslation } from 'react-i18next';
import { useCardPress } from '../../hooks/useCardPress';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';

const { width: screenWidth } = Dimensions.get('window');

interface School {
  id: string;
  name: string;
  shortName: string;
  deptId: number;
  deptName: string;
  engName?: string; // 🌍 英文名称
  aprName?: string; // 简称
}

interface SchoolGridProps {
  schools: School[];
  loading: boolean;
  onSchoolSelect: (schoolId: string) => void;
  onRetry?: () => void;
  isScrolling?: boolean;  // 🚀 新增：滚动状态，用于防止滚动时误触
}

// 小红书风格学校卡片组件
const XiaohongshuSchoolCard: React.FC<{ 
  school: School; 
  onPress: () => void; 
  getDisplayName: (school: School) => string;
  cardHeight: number;
  index: number;
  isScrolling?: boolean;  // 🚀 新增：滚动状态
}> = ({ school, onPress, getDisplayName, cardHeight, index, isScrolling }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // 🌙 Dark Mode Support
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles } = darkModeSystem;
  
  
  // 🚀 带详细调试的点击处理 - 只应该在TouchEnd时被调用
  const handleCardPress = () => {
    console.log('🔥 [CRITICAL-DEBUG] handleCardPress被调用 - 这应该只在TouchEnd时发生:', {
      schoolName: school.shortName,
      isScrolling,
      timestamp: new Date().toISOString(),
      callStack: new Error().stack?.split('\n').slice(1, 4)
    });
    
    // 🚨 额外验证：这个函数只应该在TouchEnd后被调用  
    if (__DEV__) {
      console.log('🔍 [TIMING-CHECK] handleCardPress调用时间验证');
    }
    
    // 🚨 滚动状态检查 - 如果正在滚动，完全拒绝点击
    if (isScrolling) {
      console.log('🚫 [SCROLL-GUARD] 滚动中拒绝点击:', school.shortName);
      return;
    }
    
    console.log('✅ [SCHOOL-CARD] 学校卡片确认打开:', school.shortName);
    onPress();
  };

  // 按压动画效果 - 只处理动画，不触发点击
  const handlePressIn = () => {
    console.log('🎨 [ANIMATION] PressIn - 开始按压动画，不触发点击');
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    console.log('🎨 [ANIMATION] PressOut - 结束按压动画，不触发点击');
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  // 🚀 启用调试模式追踪触摸事件
  const { touchHandlers } = useCardPress({
    onPress: handleCardPress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  }, {
    maxMoveThreshold: 15,      // 与ActivityCard完全相同：15px内移动视为点击
    maxTimeThreshold: 400,     // 与ActivityCard完全相同：400ms内视为点击
    enableHaptics: true,
    debug: true,              // 🚨 启用调试模式
  });

  return (
    <Animated.View 
      style={[
        styles.xiaohongshuCard,
        {
          height: cardHeight,
          transform: [{ scale: scaleAnim }]
        }
      ]}
      {...touchHandlers}  // 严格的卡片点击检测，防止滑动时误触
    >
      <View style={styles.xiaohongshuContent}>
        <View style={styles.logoSection}>
          {(() => {
            const logoSource = getSchoolLogo(school.id);
            return logoSource ? (
              <Image
                source={logoSource}
                style={styles.xiaohongshuLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.xiaohongshuFallback}>
                <Text style={styles.xiaohongshuFallbackText}>{school.shortName}</Text>
              </View>
            );
          })()}
        </View>
        
        {/* 学校信息 */}
        <View style={styles.schoolInfo}>
          <Text style={[
            styles.xiaohongshuSchoolName,
            { color: isDarkMode ? dmStyles.text.primary.color : '#1F2937' }
          ]} numberOfLines={2}>{getDisplayName(school)}</Text>
          <Text style={[
            styles.xiaohongshuSchoolCode,
            { color: isDarkMode ? dmStyles.text.secondary.color : '#6B7280' }
          ]}>{school.shortName}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const SchoolGrid: React.FC<SchoolGridProps> = ({
  schools,
  loading,
  onSchoolSelect,
  onRetry,
  isScrolling = false  // 🚀 接收滚动状态
}) => {
  const { t, i18n } = useTranslation();
  
  // 🌙 Dark Mode Support
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode, styles: dmStyles } = darkModeSystem;
  
  // 🌍 根据当前语言获取学校显示名称
  const getSchoolDisplayName = (school: School): string => {
    const currentLanguage = i18n.language;
    
    if (currentLanguage === 'en-US' && school.engName) {
      return school.engName;
    }
    
    return school.name || school.deptName; // fallback逻辑
  };
  

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

  // 小红书风格瀑布流布局计算
  const cardWidth = Math.floor((screenWidth - Glass.touch.spacing.sectionMargin * 2 - 12) / 2);
  
  // 统一卡片高度
  const cardHeight = 160;
  
  // 将学校分为两列
  const leftColumn = schools.filter((_, index) => index % 2 === 0);
  const rightColumn = schools.filter((_, index) => index % 2 === 1);

  return (
    <View style={styles.xiaohongshuGrid}>
      {/* 左列 */}
      <View style={[styles.gridColumn, { width: cardWidth }]}>
        {leftColumn.map((school, index) => (
          <XiaohongshuSchoolCard
            key={school.id}
            school={school}
            onPress={() => onSchoolSelect(school.id)}
            getDisplayName={getSchoolDisplayName}
            cardHeight={cardHeight}
            index={index * 2}
            isScrolling={isScrolling}  // 🚀 传递滚动状态
          />
        ))}
      </View>
      
      {/* 右列 */}
      <View style={[styles.gridColumn, { width: cardWidth }]}>
        {rightColumn.map((school, index) => (
          <XiaohongshuSchoolCard
            key={school.id}
            school={school}
            onPress={() => onSchoolSelect(school.id)}
            getDisplayName={getSchoolDisplayName}
            cardHeight={cardHeight}
            index={index * 2 + 1}
            isScrolling={isScrolling}  // 🚀 传递滚动状态
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 小红书风格瀑布流布局
  xiaohongshuGrid: {
    flexDirection: 'row',
    paddingHorizontal: Glass.touch.spacing.sectionMargin,
    alignItems: 'flex-start',
  },
  
  gridColumn: {
    flex: 1,
  },
  
  // 小红书风格卡片
  xiaohongshuCard: {
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  
  xiaohongshuContent: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  xiaohongshuLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  
  xiaohongshuFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  xiaohongshuFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  
  schoolInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  xiaohongshuSchoolName: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  
  xiaohongshuSchoolCode: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.8,
  },


  

  // 加载和空状态样式
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