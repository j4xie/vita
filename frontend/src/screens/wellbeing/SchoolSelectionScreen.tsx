import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Animated,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';
import { mockSchools, School } from '../../data/mockData';

interface SchoolSelectionScreenProps {
  onSchoolSelect: (school: School) => void;
}

export const SchoolSelectionScreen: React.FC<SchoolSelectionScreenProps> = ({ onSchoolSelect }) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState('');
  const [filteredSchools, setFilteredSchools] = useState<School[]>(mockSchools);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredSchools(mockSchools);
    } else {
      const filtered = mockSchools.filter(school =>
        school.name.toLowerCase().includes(text.toLowerCase()) ||
        school.englishName.toLowerCase().includes(text.toLowerCase()) ||
        school.location.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, []);

  const handleSchoolPress = useCallback((school: School) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onSchoolSelect(school);
  }, [onSchoolSelect]);

  const renderSchoolCard = useCallback(({ item }: { item: School }) => {
    const animatedValue = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(animatedValue, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: animatedValue }] }}>
        <TouchableOpacity
          style={[styles.schoolCard, { backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff' }]}
          onPress={() => handleSchoolPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[item.color + '20', item.color + '10']}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.schoolInfo}>
                <View style={[styles.logoContainer, { backgroundColor: item.color + '30' }]}>
                  <View style={[styles.logoPlaceholder, { backgroundColor: item.color }]}>
                    <Ionicons 
                      name="school-outline" 
                      size={28} 
                      color="white" 
                    />
                  </View>
                </View>
                
                <View style={styles.schoolDetails}>
                  <Text style={[styles.schoolName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.schoolEnglishName, { color: isDarkMode ? '#a1a1aa' : '#6b7280' }]}>
                    {item.englishName}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons 
                      name="location-outline" 
                      size={14} 
                      color={isDarkMode ? '#a1a1aa' : '#9ca3af'} 
                    />
                    <Text style={[styles.location, { color: isDarkMode ? '#a1a1aa' : '#9ca3af' }]}>
                      {item.location}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rightSection}>
                <View style={[styles.studentCountBadge, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.studentCount, { color: item.color }]}>
                    {item.studentCount}位志愿者
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={isDarkMode ? '#a1a1aa' : '#9ca3af'} 
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [isDarkMode, handleSchoolPress]);

  const ItemSeparator = useCallback(() => <View style={{ height: 12 }} />, []);

  // 计算内容底部边距（避免被底栏遮挡）
  const contentInsetBottom = 56 + 12 + insets.bottom; // tabBar高度 + 间距 + 安全区域

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#f2f2f7' }]}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff' }]}>
          <Ionicons name="search" size={20} color={isDarkMode ? '#a1a1aa' : '#9ca3af'} />
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#ffffff' : '#000000' }]}
            placeholder={t('placeholders.searchSchools')}
            placeholderTextColor={isDarkMode ? '#a1a1aa' : '#9ca3af'}
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={isDarkMode ? '#a1a1aa' : '#9ca3af'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 学校列表 */}
      <FlatList
        data={filteredSchools}
        renderItem={renderSchoolCard}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ItemSeparator}
        style={styles.list}
        contentContainerStyle={{
          paddingTop: 8, // 从16减少到8，缩小与搜索栏的间距
          paddingHorizontal: 16,
          paddingBottom: contentInsetBottom,
        }}
        onScroll={() => {}} // 显式提供onScroll函数避免错误
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={8}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="school-outline" 
              size={64} 
              color={isDarkMode ? '#3a3a3c' : '#e5e7eb'} 
            />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#8e8e93' : '#6b7280' }]}>
              未找到匹配的学校
            </Text>
            <Text style={[styles.emptySubtext, { color: isDarkMode ? '#636366' : '#9ca3af' }]}>
              尝试修改搜索条件
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 4, // 减少顶部间距
    paddingBottom: 8, // 从16减少到8，缩小与下方列表的间距
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  list: {
    flex: 1,
  },
  schoolCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schoolInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolDetails: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  schoolEnglishName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  studentCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  studentCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
});

export default SchoolSelectionScreen;