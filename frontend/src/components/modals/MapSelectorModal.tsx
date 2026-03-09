import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mapService } from '../../services/mapService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MapSelectorModalProps {
  visible: boolean;
  address: string;
  onClose: () => void;
  onMapSelected?: (mapId: string) => void;
}

export const MapSelectorModal: React.FC<MapSelectorModalProps> = ({
  visible,
  address,
  onClose,
  onMapSelected,
}) => {
  const insets = useSafeAreaInsets();
  const [maps, setMaps] = useState<Array<{ id: string; name: string; icon: string; onPress: () => Promise<void> }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadMaps();
    }
  }, [visible, address]);

  const loadMaps = async () => {
    setLoading(true);
    try {
      const availableMaps = await mapService.getMapListForUI(address);
      setMaps(availableMaps);
    } catch (error) {
      console.error('❌ 加载地图应用列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (mapId: string) => {
    setSelectedMap(mapId);
    try {
      const map = maps.find((m) => m.id === mapId);
      if (map) {
        await map.onPress();
        onMapSelected?.(mapId);
        onClose();
      }
    } catch (error) {
      console.error('❌ 打开地图失败:', error);
      setSelectedMap(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 背景半透明遮罩 */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* 底部模态框 */}
      <View
        style={[
          styles.container,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>选择地图应用</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* 地址信息 */}
        <View style={styles.addressSection}>
          <Ionicons name="location" size={16} color="#FF6B35" />
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
        </View>

        {/* 地图列表 */}
        <ScrollView style={styles.mapList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>加载地图应用...</Text>
            </View>
          ) : maps.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="sad" size={48} color="#CCC" />
              <Text style={styles.emptyText}>没有可用的地图应用</Text>
            </View>
          ) : (
            maps.map((map) => (
              <TouchableOpacity
                key={map.id}
                style={[
                  styles.mapItem,
                  selectedMap === map.id && styles.selectedMapItem,
                ]}
                onPress={() => handleMapPress(map.id)}
                disabled={selectedMap !== null}
              >
                <View style={styles.mapIconContainer}>
                  <Ionicons
                    name={map.icon as any}
                    size={24}
                    color={selectedMap === map.id ? '#FF6B35' : '#666'}
                  />
                </View>
                <Text
                  style={[
                    styles.mapName,
                    selectedMap === map.id && styles.selectedMapName,
                  ]}
                >
                  {map.name}
                </Text>
                {selectedMap === map.id ? (
                  <ActivityIndicator color="#FF6B35" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* 底部取消按钮 */}
        {!loading && maps.length > 0 && (
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  mapList: {
    maxHeight: 300,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  mapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  selectedMapItem: {
    backgroundColor: '#FFF5F2',
    borderWidth: 1.5,
    borderColor: '#FF6B35',
  },
  mapIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mapName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  selectedMapName: {
    color: '#FF6B35',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
});
