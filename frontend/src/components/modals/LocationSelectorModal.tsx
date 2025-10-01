import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  LocationInfo,
  SCHOOL_COORDINATES,
  STATE_COORDINATES,
  CITY_COORDINATES,
  getStateName,
  findNearestSchool,
  findNearestCity
} from '../../utils/locationUtils';
import LocationService from '../../services/LocationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelected: (location: LocationInfo) => void;
  userSchool?: string;
  currentLocation?: LocationInfo | null;
  hasLocationPermission?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 州和城市数据（与ActivityListScreen中的数据保持一致）
const statesCities: Record<string, string[]> = {
  'AL': ['伯明翰', '蒙哥马利', '亨茨维尔', '莫比尔'],
  'AZ': ['凤凰城', '图森', '梅萨', '钱德勒', '斯科茨代尔'],
  'CA': ['洛杉矶', '旧金山', '圣地亚哥', '奥克兰', '萨克拉门托', '圣何塞', '弗雷斯诺', '长滩', '安纳海姆', '欧文', '伯克利', '戴维斯', '圣塔芭芭拉', '圣克鲁兹'],
  'CO': ['丹佛', '科罗拉多斯普林斯', '奥罗拉', '博尔德'],
  'CT': ['哈特福德', '纽黑文', '斯坦福德', '布里奇波特'],
  'FL': ['迈阿密', '奥兰多', '坦帕', '杰克逊维尔', '塔拉哈西', '圣彼得堡'],
  'GA': ['亚特兰大', '萨凡纳', '奥古斯塔', '哥伦布', '雅典'],
  'IL': ['芝加哥', '奥罗拉', '洛克福德', '皮奥里亚', '春田', '埃尔金', '尚佩恩'],
  'IN': ['印第安纳波利斯', '韦恩堡', '埃文斯维尔', '南本德', '布卢明顿', '西拉法叶'],
  'KY': ['路易斯维尔', '列克星敦', '鲍灵格林', '欧文斯伯勒'],
  'LA': ['新奥尔良', '巴吞鲁日', '什里夫波特', '拉斐特'],
  'MA': ['波士顿', '伍斯特', '春田', '剑桥', '洛厄尔'],
  'MD': ['巴尔的摩', '安纳波利斯', '弗雷德里克', '盖瑟斯堡', '罗克维尔'],
  'MI': ['底特律', '大急流城', '安娜堡', '兰辛', '弗林特'],
  'MN': ['明尼阿波利斯', '圣保罗', '罗切斯特', '德卢斯', '布卢明顿'],
  'MO': ['堪萨斯城', '圣路易斯', '春田', '哥伦比亚'],
  'NC': ['夏洛特', '罗利', '格林斯博罗', '达勒姆', '教堂山', '阿什维尔'],
  'NJ': ['纽瓦克', '泽西城', '帕特森', '伊丽莎白', '普林斯顿', '新不伦瑞克'],
  'NV': ['拉斯维加斯', '雷诺', '亨德森', '北拉斯维加斯'],
  'NY': ['纽约', '布法罗', '罗切斯特', '扬克斯', '锡拉丘兹', '奥尔巴尼', '伊萨卡'],
  'OH': ['哥伦布', '克利夫兰', '辛辛那提', '托莱多', '阿克伦', '代顿', '阿森斯'],
  'OK': ['俄克拉荷马城', '塔尔萨', '诺曼', '布罗肯阿罗'],
  'OR': ['波特兰', '尤金', '塞勒姆', '格雷沙姆', '比弗顿', '本德', '科瓦利斯'],
  'PA': ['费城', '匹兹堡', '艾伦镇', '伊利', '雷丁', '斯克兰顿'],
  'SC': ['哥伦比亚', '查尔斯顿', '格林维尔', '罗克希尔'],
  'TN': ['纳什维尔', '孟菲斯', '诺克斯维尔', '查塔努加'],
  'TX': ['休斯顿', '达拉斯', '奥斯汀', '圣安东尼奥', '沃思堡', '埃尔帕索', '大学城'],
  'UT': ['盐湖城', '西瓦利城', '普罗沃', '奥格登'],
  'VA': ['弗吉尼亚海滩', '诺福克', '里士满', '亚历山德里亚', '夏洛茨维尔'],
  'WA': ['西雅图', '斯波坎', '塔科马', '贝尔维尤', '埃弗里特', '普尔曼'],
  'WI': ['密尔沃基', '麦迪逊', '格林贝', '基诺沙', '拉辛'],
};

// 城市到学校的映射
const cityToSchools: Record<string, string[]> = {
  '欧文': ['UCI'],
  '洛杉矶': ['UCLA', 'USC'],
  '圣地亚哥': ['UCSD'],
  '伯克利': ['UCB'],
  '圣塔芭芭拉': ['UCSB'],
  '圣克鲁兹': ['UCSC'],
  '戴维斯': ['UCD'],
  '纽约': ['NYU'],
  '西雅图': ['UW'],
  '明尼阿波利斯': ['UMN'],
  '新不伦瑞克': ['Rutgers'],
  '波士顿': ['Berklee'],
};

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  visible,
  onClose,
  onLocationSelected,
  userSchool,
  currentLocation,
  hasLocationPermission = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'browse' | 'search'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  // 建议目的地数据
  const suggestedDestinations = [
    {
      id: 'nearby',
      type: 'gps',
      icon: 'navigate' as const,
      title: t('location.nearby', 'Nearby'),
      subtitle: t('location.find_around_you', 'Find what\'s around you'),
      color: '#007AFF',
    },
    ...(userSchool ? [{
      id: 'my-school',
      type: 'school',
      icon: 'school' as const,
      title: t('location.my_school', 'My School'),
      subtitle: typeof userSchool === 'object' && userSchool ? (userSchool as any).name || userSchool : userSchool,
      color: '#4CAF50',
    }] : []),
    {
      id: 'los-angeles',
      type: 'city',
      icon: 'business' as const,
      title: 'Los Angeles, CA',
      subtitle: t('location.popular_destination', 'Popular student destination'),
      color: '#FF9800',
      data: { state: 'CA', city: '洛杉矶' },
    },
    {
      id: 'new-york',
      type: 'city',
      icon: 'business' as const,
      title: 'New York, NY',
      subtitle: t('location.popular_destination', 'Popular student destination'),
      color: '#FF9800',
      data: { state: 'NY', city: '纽约' },
    },
    {
      id: 'san-francisco',
      type: 'city',
      icon: 'business' as const,
      title: 'San Francisco, CA',
      subtitle: t('location.popular_destination', 'Popular student destination'),
      color: '#FF9800',
      data: { state: 'CA', city: '旧金山' },
    },
    {
      id: 'boston',
      type: 'city',
      icon: 'business' as const,
      title: 'Boston, MA',
      subtitle: t('location.popular_destination', 'Popular student destination'),
      color: '#FF9800',
      data: { state: 'MA', city: '波士顿' },
    },
  ];

  // 搜索过滤逻辑
  const getSearchResults = () => {
    if (!searchQuery.trim()) {
      return suggestedDestinations;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: any[] = [];

    // 搜索州
    Object.keys(statesCities).forEach(stateCode => {
      const stateName = getStateName(stateCode);
      if (
        stateCode.toLowerCase().includes(query) ||
        stateName.toLowerCase().includes(query)
      ) {
        results.push({
          id: `state-${stateCode}`,
          type: 'state',
          icon: 'location' as const,
          title: `${stateName}, ${stateCode}`,
          subtitle: t('location.state', 'State'),
          color: '#9C27B0',
          data: { state: stateCode },
        });
      }
    });

    // 搜索城市
    Object.entries(statesCities).forEach(([stateCode, cities]) => {
      cities.forEach(city => {
        if (city.toLowerCase().includes(query)) {
          results.push({
            id: `city-${stateCode}-${city}`,
            type: 'city',
            icon: 'business' as const,
            title: `${city}, ${stateCode}`,
            subtitle: t('location.city', 'City'),
            color: '#FF9800',
            data: { state: stateCode, city },
          });
        }
      });
    });

    // 搜索学校
    Object.entries(SCHOOL_COORDINATES).forEach(([schoolCode, schoolInfo]) => {
      if (
        schoolCode.toLowerCase().includes(query) ||
        schoolInfo.city.toLowerCase().includes(query)
      ) {
        results.push({
          id: `school-${schoolCode}`,
          type: 'school',
          icon: 'school' as const,
          title: schoolCode,
          subtitle: `${schoolInfo.city}, ${schoolInfo.state}`,
          color: '#4CAF50',
          data: { school: schoolCode, city: schoolInfo.city, state: schoolInfo.state, ...schoolInfo },
        });
      }
    });

    return results.slice(0, 20); // 限制返回20个结果
  };

  // 处理使用GPS定位
  const handleUseGPS = async () => {
    setIsLoadingGPS(true);
    try {
      // 清除旧的位置数据
      console.log('🧹 清除旧的位置数据');
      await AsyncStorage.removeItem('userLocation');

      // 请求权限（如果还没有）
      if (!hasLocationPermission) {
        const granted = await LocationService.requestForegroundPermission();
        if (!granted) {
          setIsLoadingGPS(false);
          return;
        }
      }

      // 获取GPS位置
      const location = await LocationService.getCurrentLocation();
      console.log('🔍 GPS定位结果:', {
        latitude: location?.latitude,
        longitude: location?.longitude,
        timestamp: new Date().toISOString()
      });

      if (location) {
        // 找到最近的城市（而非学校）
        const nearestCity = findNearestCity(location.latitude, location.longitude);
        console.log('📍 最近城市:', nearestCity);

        if (nearestCity) {
          const newLocation: LocationInfo = {
            state: nearestCity.state,
            city: nearestCity.city,
            school: nearestCity.school, // 可能为undefined
            lat: location.latitude,
            lng: location.longitude,
            source: 'gps',
          };

          // 移除位置持久化
          // await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));

          onLocationSelected(newLocation);
          onClose();
        } else {
          // 距离太远，提示手动选择
          alert(t('location.too_far', '无法找到附近的城市，请手动选择位置'));
        }
      }
    } catch (error) {
      console.error('GPS定位失败:', error);
    } finally {
      setIsLoadingGPS(false);
    }
  };

  // 处理选择建议项
  const handleSelectSuggestion = async (suggestion: any) => {
    // 触感反馈
    try {
      await Haptics.selectionAsync();
    } catch (e) {}

    if (suggestion.type === 'gps') {
      // GPS定位
      await handleUseGPS();
    } else if (suggestion.type === 'school' && suggestion.id === 'my-school') {
      // 我的学校
      await handleSelectUserSchool();
    } else if (suggestion.data) {
      // 其他类型（州/城市/学校）
      const { state, city, school, lat, lng } = suggestion.data;
      const newLocation: LocationInfo = {
        state,
        city,
        school,
        lat,
        lng,
        source: 'manual',
      };
      onLocationSelected(newLocation);
      onClose();
    }
  };

  // 处理选择用户学校
  const handleSelectUserSchool = async () => {
    if (!userSchool) return;

    let schoolName: string;
    if (typeof userSchool === 'object' && userSchool) {
      schoolName = (userSchool as any).name || String(userSchool);
    } else {
      schoolName = userSchool;
    }

    const mappedSchool = schoolName;
    if (SCHOOL_COORDINATES[mappedSchool]) {
      const school = SCHOOL_COORDINATES[mappedSchool];
      const newLocation: LocationInfo = {
        school: mappedSchool,
        city: school.city,
        state: school.state,
        lat: school.lat,
        lng: school.lng,
        source: 'userSchool',
      };
      onLocationSelected(newLocation);
      onClose();
    }
  };

  // 渲染建议项卡片
  const renderSuggestionCard = (suggestion: any) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionCard}
      onPress={() => handleSelectSuggestion(suggestion)}
      activeOpacity={0.7}
    >
      <View style={[styles.suggestionIcon, { backgroundColor: suggestion.color + '15' }]}>
        <Ionicons name={suggestion.icon} size={24} color={suggestion.color} />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
        <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  // 渲染浏览模式
  const renderBrowseMode = () => (
    <View style={styles.modalContent}>
      {/* 标题 */}
      <View style={styles.headerRow}>
        <Text style={styles.whereTitle}>{t('location.where', 'Where?')}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#222" />
        </TouchableOpacity>
      </View>

      {/* 假搜索框 */}
      <TouchableOpacity
        style={styles.fakeSearchBox}
        onPress={() => setMode('search')}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={20} color="#999" />
        <Text style={styles.fakeSearchText}>
          {t('location.search_destinations', 'Search destinations')}
        </Text>
      </TouchableOpacity>

      {/* 建议列表 */}
      <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {t('location.suggested_destinations', 'Suggested destinations')}
        </Text>
        {suggestedDestinations.map(suggestion => renderSuggestionCard(suggestion))}
      </ScrollView>
    </View>
  );

  // 渲染搜索模式
  const renderSearchMode = () => {
    const searchResults = getSearchResults();

    return (
      <View style={styles.modalContent}>
        {/* 搜索框 */}
        <View style={styles.searchHeader}>
          <TouchableOpacity
            onPress={() => {
              setMode('browse');
              setSearchQuery('');
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <TextInput
            style={styles.realSearchInput}
            placeholder={t('location.search_destinations', 'Search destinations')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#222" />
          </TouchableOpacity>
        </View>

        {/* 搜索结果 */}
        <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
          {searchResults.map(result => renderSuggestionCard(result))}
          {searchQuery.trim() && searchResults.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="#CCC" />
              <Text style={styles.noResultsText}>
                {t('location.no_results', 'No results found')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {mode === 'browse' ? renderBrowseMode() : renderSearchMode()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    flex: 1,
  },
  // 浏览模式样式
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  whereTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  fakeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fakeSearchText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 12,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
    marginTop: 8,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  suggestionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#717171',
  },
  // 搜索模式样式
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  realSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});