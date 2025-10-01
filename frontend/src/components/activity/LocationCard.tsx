import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';

interface LocationCardProps {
  location: string;
  // 未来API扩展字段（暂时未使用）
  latitude?: number;
  longitude?: number;
  doorCode?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  latitude,
  longitude,
  doorCode,
}) => {
  const { t } = useTranslation();

  // Mock天气数据 - 等待后端API
  const mockWeather = {
    temperature: 22,
    condition: 'sunny',
    icon: 'sunny' as const,
  };

  // 打开外部地图应用
  const openMap = async () => {
    try {
      const encodedLocation = encodeURIComponent(location);

      let url: string;

      // 如果有经纬度，使用精确坐标
      if (latitude && longitude) {
        url = Platform.select({
          ios: `maps:${latitude},${longitude}?q=${encodedLocation}`,
          android: `geo:${latitude},${longitude}?q=${encodedLocation}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      } else {
        // 否则使用地址搜索
        url = Platform.select({
          ios: `maps:0,0?q=${encodedLocation}`,
          android: `geo:0,0?q=${encodedLocation}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
      }

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        // 备用方案：在浏览器中打开Google Maps
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open map:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('activityDetail.map_open_failed') || 'Failed to open map'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text style={styles.sectionTitle}>
        {t('activityDetail.location') || 'Location'}
      </Text>

      {/* Location Info */}
      <View style={styles.locationRow}>
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{location}</Text>
          {doorCode && (
            <Text style={styles.doorCodeText}>
              {t('activityDetail.door_code') || 'Door code'}: {doorCode}
            </Text>
          )}
        </View>

        {/* Mock Weather Display */}
        <View style={styles.weatherContainer}>
          <Ionicons name={mockWeather.icon} size={20} color="#FFA500" />
          <Text style={styles.weatherText}>{mockWeather.temperature}°C</Text>
        </View>
      </View>

      {/* Map Preview / Open Button */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={openMap}
        activeOpacity={0.8}
      >
        <Ionicons name="map-outline" size={20} color="#FFFFFF" />
        <Text style={styles.mapButtonText}>
          {t('activityDetail.open_map') || 'Open in Maps'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 可选：静态地图预览占位符 */}
      {/* 等待后端提供经纬度后可以集成 react-native-maps 或显示静态地图图片 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing[3],
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  addressContainer: {
    flex: 1,
    marginRight: theme.spacing[3],
  },
  addressText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#FFFFFF',
    lineHeight: theme.typography.fontSize.base * 1.4,
  },
  doorCodeText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: theme.spacing[1],
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.md,
  },
  weatherText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: theme.spacing[2],
  },
  mapButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
});
