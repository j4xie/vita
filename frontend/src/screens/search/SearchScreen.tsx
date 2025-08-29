import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { theme } from '../../theme';
import { SimpleActivityCard } from '../../components/cards/SimpleActivityCard';
import { pomeloXAPI } from '../../services/PomeloXAPI';
import { adaptActivityList } from '../../utils/activityAdapter';

export const SearchScreen: React.FC = ({ route }: any) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const initialSearchText = route?.params?.initialSearchText || '';
  const [searchText, setSearchText] = useState(initialSearchText);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // 动画值
  const searchBarOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // 页面进入动画
    searchBarOpacity.value = withTiming(1, { duration: 300 });
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    
    // 自动聚焦搜索框
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // 处理初始搜索文本
  useEffect(() => {
    if (initialSearchText && initialSearchText.trim().length >= 2) {
      handleSearch(initialSearchText);
    }
  }, [initialSearchText]);

  const handleSearch = async (text: string) => {
    setSearchText(text);
    
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 [SearchScreen] 开始搜索:', { searchText: text });
      
      // 修复API调用方式
      const response = await pomeloXAPI.getActivityList({ 
        pageNum: 1, 
        pageSize: 20, 
        name: text 
      });
      
      console.log('🔍 [SearchScreen] API响应:', { 
        code: response.code, 
        total: response.total, 
        rowsCount: response.rows?.length 
      });
      
      if (response.code === 200 && response.rows) {
        // 添加前端过滤作为双重保障
        const filteredRows = response.rows.filter((activity: any) => 
          activity.name.toLowerCase().includes(text.toLowerCase()) ||
          activity.address?.toLowerCase().includes(text.toLowerCase())
        );
        
        console.log('🔍 [SearchScreen] 过滤后结果:', { 
          原始数量: response.rows.length,
          过滤后数量: filteredRows.length,
          搜索词: text 
        });
        
        const adaptedResults = filteredRows.map((activity: any) => ({
          id: activity.id.toString(),
          title: activity.name,
          location: activity.address,
          date: activity.startTime?.split(' ')[0] || '',
          endDate: activity.endTime?.split(' ')[0] || '',
          time: activity.startTime?.split(' ')[1]?.slice(0, 5) || '',
          attendees: 0,
          maxAttendees: activity.enrollment || 0,
          image: activity.icon,
        }));
        setSearchResults(adaptedResults);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchBarOpacity.value,
    transform: [
      { translateY: (1 - searchBarOpacity.value) * -20 }
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* 背景 */}
      <LinearGradient
        colors={['#F8F9FA', '#F1F2F3', '#EDEEF0']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      {/* 搜索栏 */}
      <Animated.View style={[styles.searchBarContainer, searchBarAnimatedStyle]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t('placeholders.searchActivities')}
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Text style={styles.cancelText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 搜索结果 */}
      <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : searchText.trim().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{t('accessibility.searchActivities')}</Text>
            <Text style={styles.emptySubtitle}>{t('accessibility.searchActivitiesHint')}</Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{t('filters.noResults')}</Text>
            <Text style={styles.emptySubtitle}>{t('cards.try_different_search')}</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {searchResults.map((activity, index) => (
              <SimpleActivityCard
                key={activity.id}
                activity={activity}
                onPress={() => {
                  navigation.navigate('ActivityDetail', { activity });
                }}
              />
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    height: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
});