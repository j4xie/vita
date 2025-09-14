import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebHaptics as Haptics } from '../../utils/WebHaptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

import { theme } from '../../theme';
import { useAllDarkModeStyles } from '../../hooks/useDarkModeStyles';

interface RouteParams {
  currentLayout: 'list' | 'grid';
}

export const ActivityLayoutSelectionScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const darkModeSystem = useAllDarkModeStyles();
  const { isDarkMode } = darkModeSystem;
  
  const params = route.params as RouteParams;
  const [selectedLayout, setSelectedLayout] = useState<'list' | 'grid'>(params.currentLayout);

  const handleLayoutSelect = async (layout: 'list' | 'grid') => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    
    setSelectedLayout(layout);
    
    try {
      await AsyncStorage.setItem('activity_view_layout', layout);
      // 只使用DeviceEventEmitter，不使用function参数
      DeviceEventEmitter.emit('activityLayoutChanged', layout);
      navigation.goBack();
    } catch (error) {
      console.warn('Failed to save layout preference:', error);
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#000000' : '#F2F2F7' }
    ]}>
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {t('activities.layout.selection_title')}
        </Text>
      </View>

      {/* Layout Options */}
      <View style={styles.content}>
        {/* Grid Option */}
        <TouchableOpacity
          style={[
            styles.option,
            {
              backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
              borderColor: selectedLayout === 'grid' ? '#FF6B35' : 'transparent',
            }
          ]}
          onPress={() => handleLayoutSelect('grid')}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <Ionicons name="grid-outline" size={24} color="#FF6B35" />
            <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {t('common.gridView')}
            </Text>
            {selectedLayout === 'grid' && (
              <Ionicons name="checkmark" size={20} color="#FF6B35" />
            )}
          </View>
          <Text style={[styles.optionDescription, { color: isDarkMode ? '#8E8E93' : '#8E8E93' }]}>
            {t('activities.layout.grid_description')}
          </Text>
        </TouchableOpacity>

        {/* List Option */}
        <TouchableOpacity
          style={[
            styles.option,
            {
              backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
              borderColor: selectedLayout === 'list' ? '#FF6B35' : 'transparent',
            }
          ]}
          onPress={() => handleLayoutSelect('list')}
          activeOpacity={0.7}
        >
          <View style={styles.optionContent}>
            <Ionicons name="list-outline" size={24} color="#FF6B35" />
            <Text style={[styles.optionTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
              {t('common.listView')}
            </Text>
            {selectedLayout === 'list' && (
              <Ionicons name="checkmark" size={20} color="#FF6B35" />
            )}
          </View>
          <Text style={[styles.optionDescription, { color: isDarkMode ? '#8E8E93' : '#8E8E93' }]}>
            {t('activities.layout.list_description')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  option: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  optionDescription: {
    fontSize: 15,
    lineHeight: 20,
  },
});

export default ActivityLayoutSelectionScreen;