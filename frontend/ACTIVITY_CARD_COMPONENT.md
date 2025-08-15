# VitaGlobal活动卡片组件实现

## 核心组件代码

### EventCard.tsx - 主要活动卡片组件

```tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../design-system';

const { width: screenWidth } = Dimensions.get('window');

interface EventCardProps {
  event: {
    id: string;
    title: string;
    subtitle: string;
    cover_image: {
      url: string;
      gradient_colors: string[];
      primary_color: string;
    };
    organizer: {
      name: string;
      avatar: string;
      verified: boolean;
    };
    schedule: {
      display_date: string;
      display_time: string;
    };
    location: {
      name: string;
      distance_from_user?: string;
    };
    capacity: {
      current_participants: number;
      max_participants: number;
      available_spots: number;
    };
    status: 'open' | 'filling_fast' | 'almost_full' | 'full';
    category: string;
    pricing: {
      is_free: boolean;
      price?: number;
    };
  };
  onPress: (eventId: string) => void;
  onFavorite?: (eventId: string) => void;
  onRegister?: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onPress, 
  onFavorite, 
  onRegister 
}) => {
  const handleCardPress = () => {
    onPress(event.id);
  };

  const handleFavoritePress = () => {
    onFavorite?.(event.id);
  };

  const handleRegisterPress = (e: any) => {
    e.stopPropagation(); // 防止触发卡片点击
    onRegister?.(event.id);
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={handleCardPress}
      activeOpacity={0.95}
    >
      {/* 主要图片区域 */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: event.cover_image.url }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        
        {/* 渐变覆盖层 - 使用学术友好色调 */}
        <LinearGradient
          colors={[
            `${event.cover_image.gradient_colors[0]}30`, // 30% opacity
            `${event.cover_image.gradient_colors[1]}CC`   // 80% opacity
          ]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {/* 顶部状态和收藏 */}
          <View style={styles.topRow}>
            <StatusBadge status={event.status} />
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
            >
              <Icon name="heart-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* 底部信息区域 */}
          <View style={styles.bottomInfo}>
            {/* 组织者信息 */}
            <View style={styles.organizerRow}>
              <Image 
                source={{ uri: event.organizer.avatar }} 
                style={styles.orgAvatar} 
              />
              <Text style={styles.organizerName}>
                {event.organizer.name}
              </Text>
              {event.organizer.verified && (
                <Icon name="checkmark-circle" size={14} color={Colors.success} />
              )}
            </View>
            
            {/* 活动标题 */}
            <Text style={styles.eventTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.eventSubtitle} numberOfLines={1}>
              {event.subtitle}
            </Text>
            
            {/* 元数据行 */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="calendar-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.metaText}>{event.schedule.display_date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="time-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.metaText}>{event.schedule.display_time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="location-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.location.name}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 底部行动区域 */}
      <View style={styles.actionRow}>
        <View style={styles.capacityInfo}>
          <View style={styles.capacityRow}>
            <Icon name="people-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.capacityText}>
              {event.capacity.current_participants}/{event.capacity.max_participants}人
            </Text>
            {event.pricing.is_free && (
              <View style={styles.freeTag}>
                <Text style={styles.freeText}>免费</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.availableText,
            event.capacity.available_spots <= 5 && styles.urgentText
          ]}>
            {event.capacity.available_spots > 0 
              ? `还剩${event.capacity.available_spots}个名额`
              : '已满员'
            }
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.registerButton,
            { 
              backgroundColor: event.capacity.available_spots > 0 
                ? event.cover_image.primary_color 
                : Colors.neutral[400]
            }
          ]}
          onPress={handleRegisterPress}
          disabled={event.capacity.available_spots === 0}
        >
          <Text style={styles.registerText}>
            {event.capacity.available_spots > 0 ? '立即报名' : '已满员'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// 状态标签组件
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return { text: '开放报名', color: Colors.success };
      case 'filling_fast':
        return { text: '报名火热', color: Colors.warning };
      case 'almost_full':
        return { text: '名额紧张', color: '#FF5722' };
      case 'full':
        return { text: '已满员', color: Colors.neutral[500] };
      default:
        return { text: '开放报名', color: Colors.success };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
      <Text style={styles.statusText}>{config.text}</Text>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.primary,
    ...Shadows.md,
  },
  
  imageContainer: {
    height: 180, // 减小高度，更适合学术活动
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  
  coverImage: {
    width: '100%',
    height: '100%',
  },
  
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  bottomInfo: {
    alignItems: 'flex-start',
  },
  
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  
  orgAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: Spacing.xs,
  },
  
  organizerName: {
    ...Typography.styles.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.xs,
  },
  
  eventTitle: {
    ...Typography.styles.h3,
    fontSize: Typography.fontSize.lg,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs / 2,
  },
  
  eventSubtitle: {
    ...Typography.styles.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: Spacing.sm,
  },
  
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    maxWidth: '45%',
  },
  
  metaText: {
    ...Typography.styles.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
  },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  
  capacityInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs / 2,
  },
  
  capacityText: {
    ...Typography.styles.body,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  
  freeTag: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  
  freeText: {
    ...Typography.styles.caption,
    fontSize: 9,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  
  availableText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  
  urgentText: {
    color: '#FF5722',
    fontWeight: Typography.fontWeight.semibold,
  },
  
  registerButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
  },
  
  registerText: {
    ...Typography.styles.button,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  
  statusText: {
    ...Typography.styles.caption,
    fontSize: 9,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semibold,
  },
  
  favoriteButton: {
    padding: Spacing.xs,
  },
});

export default EventCard;
```

## 使用示例

### EventList.tsx - 活动列表页面

```tsx
import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import EventCard from './EventCard';
import { Spacing } from '../design-system';

interface EventListProps {
  events: Event[];
  onEventPress: (eventId: string) => void;
  onFavorite: (eventId: string) => void;
  onRegister: (eventId: string) => void;
}

const EventList: React.FC<EventListProps> = ({
  events,
  onEventPress,
  onFavorite,
  onRegister,
}) => {
  const renderEventCard = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={onEventPress}
      onFavorite={onFavorite}
      onRegister={onRegister}
    />
  );

  return (
    <FlatList
      data={events}
      renderItem={renderEventCard}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
});

export default EventList;
```

## 性能优化

### 图片优化策略

```tsx
// ImageOptimizer.tsx - 优化的图片组件
import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';

interface OptimizedImageProps {
  source: { uri: string };
  style: any;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  placeholder?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  placeholder
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      <FastImage
        source={{
          uri: source.uri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.web,
        }}
        style={StyleSheet.absoluteFillObject}
        resizeMode={FastImage.resizeMode[resizeMode]}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#667eea" />
        </View>
      )}
      
      {error && placeholder && (
        <Image 
          source={{ uri: placeholder }}
          style={StyleSheet.absoluteFillObject}
          resizeMode={resizeMode}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default OptimizedImage;
```

这个重新设计的活动卡片组件借鉴了夜生活app的现代设计理念，但调整为更适合学术活动的友好风格。主要特点包括：

1. **视觉层次清晰** - 大图背景 + 渐变覆盖层
2. **信息架构合理** - 组织者、标题、时间地点、报名状态
3. **交互友好** - 清晰的CTA按钮和状态反馈
4. **学术风格适配** - 温暖色调而非夜店霓虹色
5. **性能优化** - 图片缓存和懒加载
