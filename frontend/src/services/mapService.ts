// Map Service - 支持多个地图应用
import { Linking, Platform, Alert } from 'react-native';

export interface MapApp {
  name: string;
  icon: string;
  id: string;
  canOpen: () => Promise<boolean>;
  open: (address: string, lat?: number, lon?: number) => Promise<void>;
}

class MapService {
  /**
   * 获取所有可用的地图应用
   */
  async getAvailableMaps(address: string): Promise<MapApp[]> {
    const maps: MapApp[] = [];

    // Apple Maps (iOS only)
    if (Platform.OS === 'ios') {
      maps.push({
        name: 'Apple Maps',
        icon: 'map',
        id: 'appleMaps',
        canOpen: async () => true, // iOS总是有Apple Maps
        open: async (address) => {
          const encodedAddress = encodeURIComponent(address);
          const url = `maps://?q=${encodedAddress}`;
          try {
            await Linking.openURL(url);
          } catch (error) {
            console.error('❌ 打开Apple Maps失败:', error);
            throw error;
          }
        },
      });
    }

    // Google Maps
    maps.push({
      name: 'Google Maps',
      icon: 'globe',
      id: 'googleMaps',
      canOpen: async () => {
        const scheme = Platform.OS === 'ios' ? 'comgooglemaps://' : 'geo:';
        try {
          const canOpen = await Linking.canOpenURL(
            Platform.OS === 'ios' ? 'comgooglemaps://' : 'geo:0,0'
          );
          return canOpen;
        } catch {
          return false;
        }
      },
      open: async (address, lat, lon) => {
        const encodedAddress = encodeURIComponent(address);

        if (Platform.OS === 'ios') {
          // iOS: Google Maps app
          const url = `comgooglemaps://?q=${encodedAddress}`;
          try {
            await Linking.openURL(url);
          } catch (error) {
            // Fallback to web Google Maps
            console.warn('⚠️ Google Maps应用未安装，使用Web版本');
            await Linking.openURL(
              `https://maps.google.com/?q=${encodedAddress}`
            );
          }
        } else {
          // Android: 使用geo scheme
          if (lat !== undefined && lon !== undefined) {
            const url = `geo:${lat},${lon}?q=${encodedAddress}`;
            await Linking.openURL(url);
          } else {
            // Fallback to web
            await Linking.openURL(
              `https://maps.google.com/?q=${encodedAddress}`
            );
          }
        }
      },
    });

    // Waze
    maps.push({
      name: 'Waze',
      icon: 'navigate',
      id: 'waze',
      canOpen: async () => {
        try {
          const canOpen = await Linking.canOpenURL('waze://');
          return canOpen;
        } catch {
          return false;
        }
      },
      open: async (address, lat, lon) => {
        const encodedAddress = encodeURIComponent(address);

        if (lat !== undefined && lon !== undefined) {
          // 使用坐标（更精确）
          const url = `waze://?navigate=yes&ll=${lat},${lon}&zoom=15`;
          try {
            await Linking.openURL(url);
          } catch (error) {
            console.error('❌ 打开Waze失败:', error);
            throw error;
          }
        } else {
          // 使用地址
          const url = `waze://?navigate=yes&q=${encodedAddress}`;
          try {
            await Linking.openURL(url);
          } catch (error) {
            console.error('❌ 打开Waze失败:', error);
            throw error;
          }
        }
      },
    });

    // 过滤出可用的地图应用
    const availableMaps: MapApp[] = [];
    for (const map of maps) {
      try {
        const available = await map.canOpen();
        if (available) {
          availableMaps.push(map);
        }
      } catch (error) {
        console.warn(`⚠️ 检查${map.name}可用性失败:`, error);
      }
    }

    // 如果没有可用的地图应用，至少返回网页版Google Maps
    if (availableMaps.length === 0) {
      availableMaps.push({
        name: 'Google Maps (Web)',
        icon: 'globe',
        id: 'googleMapsWeb',
        canOpen: async () => true,
        open: async (address) => {
          const encodedAddress = encodeURIComponent(address);
          await Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
        },
      });
    }

    return availableMaps;
  }

  /**
   * 打开默认地图应用
   */
  async openDefaultMap(address: string, lat?: number, lon?: number): Promise<void> {
    const maps = await this.getAvailableMaps(address);

    if (maps.length === 0) {
      throw new Error('没有可用的地图应用');
    }

    // 优先级: Apple Maps > Google Maps > Waze > Web
    let selectedMap = maps[0];

    if (Platform.OS === 'ios') {
      const appleMap = maps.find((m) => m.id === 'appleMaps');
      if (appleMap) {
        selectedMap = appleMap;
      }
    } else {
      const googleMap = maps.find((m) => m.id === 'googleMaps');
      if (googleMap) {
        selectedMap = googleMap;
      }
    }

    try {
      await selectedMap.open(address, lat, lon);
    } catch (error) {
      console.error('❌ 打开地图失败:', error);
      // Fallback to next available map
      if (maps.length > 1) {
        const fallback = maps.find((m) => m.id !== selectedMap.id);
        if (fallback) {
          await fallback.open(address, lat, lon);
        }
      }
    }
  }

  /**
   * 生成地图应用列表用于UI选择
   */
  async getMapListForUI(address: string): Promise<
    Array<{
      id: string;
      name: string;
      icon: string;
      onPress: () => Promise<void>;
    }>
  > {
    const maps = await this.getAvailableMaps(address);

    return maps.map((map) => ({
      id: map.id,
      name: map.name,
      icon: map.icon,
      onPress: () => map.open(address),
    }));
  }
}

export const mapService = new MapService();
