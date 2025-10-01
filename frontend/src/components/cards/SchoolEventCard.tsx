import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OptimizedImage } from '../common/OptimizedImage';
import { LoaderOne } from '../ui/LoaderOne';

const { width: screenWidth } = Dimensions.get('window');
const CARD_HEIGHT = 240; // 精确匹配 Shangri-La 截图

interface SchoolEventCardProps {
  school: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    address?: string;
    city?: string;
    studentsCount?: number;
  };
  onPress: () => void;
}

export const SchoolEventCard: React.FC<SchoolEventCardProps> = ({
  school,
  onPress,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.98}
    >
      {/* 背景图片 - 学校 logo/照片 */}
      <View style={styles.imageContainer}>
        {school.logo && !imageError ? (
          <>
            <OptimizedImage
              source={{
                uri: school.logo,
                priority: 'normal'
              }}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            {imageLoading && (
              <View style={styles.loadingContainer}>
                <LoaderOne size="small" color="#FFFFFF" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="school-outline" size={64} color="rgba(255,255,255,0.5)" />
          </View>
        )}
      </View>

      {/* 底部深色渐变遮罩 - 精确匹配 Shangri-La */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(0, 0, 0, 0.2)',
          'rgba(0, 0, 0, 0.5)',
          'rgba(0, 0, 0, 0.75)',
          'rgba(0, 0, 0, 0.85)',
        ]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      {/* 左上角装饰图标 - 层叠效果 */}
      <View style={styles.decorIcon}>
        <Ionicons name="layers-outline" size={18} color="#FFFFFF" />
      </View>

      {/* 底部信息区 - 叠加在照片上 */}
      <View style={styles.infoOverlay} pointerEvents="none">
        {/* 学校简称徽章（如 JEN, UCB） */}
        {school.shortName && (
          <View style={styles.shortNameBadge}>
            <Text style={styles.shortNameText}>{school.shortName}</Text>
          </View>
        )}

        {/* 学校全称 - 大号粗体白字 */}
        <Text style={styles.title} numberOfLines={2}>
          {school.name}
        </Text>

        {/* 地址 - 小号白字 + 图标 */}
        {school.address && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color="#FFFFFF" />
            <Text style={styles.location} numberOfLines={1}>
              {school.address}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: CARD_HEIGHT,
    backgroundColor: '#2C2C2E',
    position: 'relative',
    marginBottom: 0, // 紧密堆叠，无间距
    borderRadius: 0, // 无圆角
  },

  // 图片容器 - 全屏
  imageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2C2C2E',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  loadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },

  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },

  // 底部深色渐变遮罩 - 精确匹配 Shangri-La
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.5, // 调整为卡片高度的一半
    zIndex: 1,
  },

  // 左上角装饰图标 - 层叠效果
  decorIcon: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  // 底部信息区 - 叠加在照片上（调整间距）
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 16,
    zIndex: 2,
  },

  // 学校简称徽章（如 JEN, UCB）
  shortNameBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },

  shortNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // 标题 - 调整为更小的尺寸
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // 地址行
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  location: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
