import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Glass } from '../../ui/glass/GlassTheme';
import { getSchoolLogo } from '../../utils/schoolLogos';
import { i18n } from '../../utils/i18n';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import { LinearGradient } from '../../components/web/WebLinearGradient';
import { BlurView } from '../../components/web/WebBlurView';

interface SchoolData {
  id: string;
  deptId: number;
  deptName: string;
  engName?: string;
  aprName?: string;
  volunteers: number;
  tint: string;
}

interface SchoolVolunteerCardProps {
  school: SchoolData;
  onPress: () => void;
  disabled?: boolean;
}

export const SchoolVolunteerCard: React.FC<SchoolVolunteerCardProps> = ({
  school,
  onPress,
  disabled = false,
}) => {
  const { t } = useTranslation();
  
  // 🌍 根据语言获取正确的学校名称
  const getSchoolDisplayInfo = () => {
    const isEnglish = i18n.language === 'en-US';
    
    if (isEnglish) {
      return {
        title: school.aprName || school.deptName,
        subtitle: school.engName || school.deptName
      };
    } else {
      return {
        title: school.deptName,
        subtitle: school.aprName || school.engName || ''
      };
    }
  };
  
  const displayInfo = getSchoolDisplayInfo();
  
  // 🚨 修复：使用 deptId 和学校名称映射获取正确的 logo
  const logoSource = getSchoolLogo(school.deptId.toString()) || getSchoolLogo(school.aprName || '') || getSchoolLogo(school.deptName || '');
  
  console.log(`🏫 [LOGO] ${school.deptName}:`, {
    deptId: school.deptId,
    aprName: school.aprName,
    logoSource: !!logoSource
  });

  const handlePress = () => {
    if (disabled) return;
    
    // Web 端触觉反馈
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  // 志愿者数量的颜色逻辑
  const getVolunteerCountStyle = () => {
    if (school.volunteers === 0) {
      return {
        backgroundColor: Glass.textWeak + '15',
        color: Glass.textWeak
      };
    } else if (school.volunteers >= 3) {
      return {
        backgroundColor: Glass.brandGreen + '20',
        color: Glass.brandGreen
      };
    } else {
      return {
        backgroundColor: school.tint + '20',
        color: Glass.textMain
      };
    }
  };

  const volunteerStyle = getVolunteerCountStyle();

  return (
    <View style={styles.cardContainer}>
      <BlurView intensity={15} tint="light" style={styles.blurBackground}>
        {/* 顶部高光线 */}
        <LinearGradient 
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.2)']}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }} 
          style={styles.topHighlight}
        />
        
        {/* 主要内容渐变层 */}
        <LinearGradient 
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          start={{ x: 0, y: 0 }} 
          end={{ x: 0, y: 1 }}
          style={styles.contentGradient}
        />

        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          style={[styles.touchableContent, disabled && styles.disabledContent]}
          activeOpacity={0.8}
        >
          {/* 左侧学校 logo 区域 - 白色背景 */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              {logoSource ? (
                <Image 
                  source={logoSource}
                  style={styles.schoolLogo}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.schoolInitials, { color: school.tint }]}>
                  {school.aprName ? school.aprName.substring(0, 2).toUpperCase() : school.deptName.charAt(0)}
                </Text>
              )}
            </View>
          </View>

          {/* 中间信息区域 - 简化信息 */}
          <View style={styles.infoSection}>
            {/* 学校名称 */}
            <Text style={styles.schoolTitle} numberOfLines={1}>
              {displayInfo.title}
            </Text>
            
            {/* 英文名称/缩写 */}
            {displayInfo.subtitle && (
              <Text style={styles.schoolSubtitle} numberOfLines={1}>
                {displayInfo.subtitle}
              </Text>
            )}
          </View>

          {/* 右侧箭头 - 移除数量徽章 */}
          <View style={styles.rightSection}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Glass.textWeak}
            />
          </View>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  // 主容器 - 玻璃材质卡片
  cardContainer: {
    borderRadius: 16,
    marginBottom: 8, // 减少间距，更紧凑
    marginHorizontal: 2, // 轻微外边距，避免阴影被裁切
    overflow: 'visible',
    // 玻璃阴影效果
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {
        elevation: 4,
      },
    }),
  },

  // 玻璃背景
  blurBackground: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  // 顶部高光线
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },

  // 主要内容渐变
  contentGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },

  // 可触摸内容区域
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 88,
  },

  disabledContent: {
    opacity: 0.6,
  },

  // 左侧 logo 区域 - 简化样式
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // 纯白色背景
    // 移除边框和阴影，纯净显示
  },

  schoolLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },

  schoolInitials: {
    fontSize: 14,
    fontWeight: '700',
    // 使用学校主题色作为文字颜色
  },

  // 中间信息区域
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },

  schoolTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Glass.textMain,
    marginBottom: 4,
    letterSpacing: -0.2,
  },

  schoolSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Glass.textWeak,
    marginBottom: 8,
    letterSpacing: -0.1,
  },

  // 右侧区域 - 仅显示箭头
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default SchoolVolunteerCard;