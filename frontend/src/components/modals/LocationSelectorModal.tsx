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
  const [searchText, setSearchText] = useState('');
  const [currentStep, setCurrentStep] = useState<'main' | 'state' | 'city' | 'school'>('main');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

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

  // 处理选择用户学校 - 智能映射
  const handleSelectUserSchool = async () => {
    if (!userSchool) return;

    // 处理用户学校字符串
    let schoolName: string;
    if (typeof userSchool === 'object' && userSchool) {
      schoolName = (userSchool as any).name || userSchool.toString();
    } else {
      schoolName = userSchool;
    }

    // 直接使用学校名，因为我们已经在SCHOOL_COORDINATES中定义了所有学校
    const mappedSchool = schoolName;
    console.log('🎓 [我的学校] 学校映射:', { 原学校: userSchool, 映射学校: mappedSchool });

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

      console.log('🎓 [我的学校] 切换到学校位置:', newLocation);

      // 触感反馈
      try {
        await Haptics.selectionAsync();
      } catch (e) {}

      // 移除位置持久化，只在当前会话有效
      // await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));

      onLocationSelected(newLocation);
      onClose();
    } else {
      console.warn('🎓 [我的学校] 未找到学校坐标:', mappedSchool);
      // 如果没有找到学校坐标，可以显示提示或使用默认位置
    }
  };

  // 处理手动选择
  const handleManualSelection = () => {
    setCurrentStep('state');
  };

  // 选择州
  const handleSelectState = (state: string) => {
    setSelectedState(state);
    setCurrentStep('city');
  };

  // 选择城市
  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    // 如果城市有学校，显示学校选择
    if (cityToSchools[city] && cityToSchools[city].length > 0) {
      setCurrentStep('school');
    } else {
      // 直接使用城市作为位置
      handleSelectLocation(selectedState, city, null);
    }
  };

  // 选择学校
  const handleSelectSchool = (school: string) => {
    handleSelectLocation(selectedState, selectedCity, school);
  };

  // 最终选择位置
  const handleSelectLocation = async (state: string, city: string, school: string | null) => {
    const newLocation: LocationInfo = {
      state,
      city,
      school: school || undefined,
      source: 'manual',
    };

    if (school && SCHOOL_COORDINATES[school]) {
      newLocation.lat = SCHOOL_COORDINATES[school].lat;
      newLocation.lng = SCHOOL_COORDINATES[school].lng;
    } else if (STATE_COORDINATES[state]) {
      newLocation.lat = STATE_COORDINATES[state].lat;
      newLocation.lng = STATE_COORDINATES[state].lng;
    }

    // 移除位置持久化
    // await AsyncStorage.setItem('userLocation', JSON.stringify(newLocation));
    onLocationSelected(newLocation);
    onClose();
  };

  // 获取当前位置显示文本
  const getCurrentLocationText = () => {
    if (!currentLocation) return t('location.not_set', '未设置');

    let text = '';

    // 格式: 州, 城市 [, 学校]
    if (currentLocation.state) {
      text = getStateName(String(currentLocation.state));
    }

    if (currentLocation.city) {
      text += text ? `, ${String(currentLocation.city)}` : String(currentLocation.city);
    }

    if (currentLocation.school) {
      text += text ? `, ${String(currentLocation.school)}` : String(currentLocation.school);
    }

    return text || t('location.not_set', '未设置');
  };

  // 渲染主界面
  const renderMainScreen = () => (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('location.selector_title', '选择位置')}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 当前位置信息 */}
      <View style={styles.currentLocationContainer}>
        <Text style={styles.sectionTitle}>
          {t('location.current_location', '当前位置')}
        </Text>
        <View style={styles.currentLocationBox}>
          <Ionicons
            name="location"
            size={20}
            color={currentLocation ? '#4CAF50' : '#999'}
          />
          <Text style={styles.currentLocationText}>
            {getCurrentLocationText()}
          </Text>
        </View>
      </View>

      {/* 选项列表 */}
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {/* 我的学校 */}
        {userSchool && (
          <TouchableOpacity
            style={[styles.optionItem, styles.mySchoolOption]}
            onPress={handleSelectUserSchool}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <Ionicons name="school" size={24} color="#4CAF50" />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>
                  {t('location.my_school', '我的学校')}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {typeof userSchool === 'object' && userSchool ? (userSchool as any).name || userSchool : userSchool}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}

        {/* GPS定位 */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={handleUseGPS}
          activeOpacity={0.7}
          disabled={isLoadingGPS}
        >
          <View style={styles.optionLeft}>
            <Ionicons
              name="navigate"
              size={24}
              color={hasLocationPermission ? '#007AFF' : '#999'}
            />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                {t('location.use_gps', '使用GPS定位')}
              </Text>
              <Text style={styles.optionSubtitle}>
                {hasLocationPermission
                  ? t('location.get_current_location', '获取当前位置')
                  : t('location.need_permission', '需要定位权限')}
              </Text>
            </View>
          </View>
          {isLoadingGPS ? (
            <Text style={styles.loadingText}>
              {t('location.locating', '定位中...')}
            </Text>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#999" />
          )}
        </TouchableOpacity>

        {/* 手动选择 */}
        <TouchableOpacity
          style={styles.optionItem}
          onPress={handleManualSelection}
          activeOpacity={0.7}
        >
          <View style={styles.optionLeft}>
            <Ionicons name="hand-left" size={24} color="#F9A889" />
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>
                {t('location.manual_select', '手动选择位置')}
              </Text>
              <Text style={styles.optionSubtitle}>
                {t('location.choose_state_city', '选择州、城市或学校')}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // 渲染州选择
  const renderStateSelection = () => (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('main')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t('location.select_state', '选择州')}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
        {Object.keys(statesCities).sort().map((state) => (
          <TouchableOpacity
            key={state}
            style={styles.selectionItem}
            onPress={() => handleSelectState(state)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectionItemText}>
              {getStateName(String(state))} ({String(state)})
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // 渲染城市选择
  const renderCitySelection = () => (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('state')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t('location.select_city', '选择城市')}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.stateIndicator}>
        <Text style={styles.stateIndicatorText}>
          {getStateName(String(selectedState))}
        </Text>
      </View>

      <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
        {statesCities[selectedState]?.map((city) => (
          <TouchableOpacity
            key={city}
            style={styles.selectionItem}
            onPress={() => handleSelectCity(city)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectionItemText}>{String(city)}</Text>
            {cityToSchools[city] && (
              <View style={styles.schoolBadge}>
                <Text style={styles.schoolBadgeText}>
                  {cityToSchools[city].length} 所学校
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // 渲染学校选择
  const renderSchoolSelection = () => (
    <View style={styles.modalContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('city')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {t('location.select_school', '选择学校')}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.stateIndicator}>
        <Text style={styles.stateIndicatorText}>
          {String(selectedCity)}, {getStateName(String(selectedState))}
        </Text>
      </View>

      <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={false}>
        {/* 不选择学校选项 */}
        <TouchableOpacity
          style={styles.selectionItem}
          onPress={() => handleSelectLocation(selectedState, selectedCity, null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectionItemText, { color: '#666' }]}>
            {t('location.just_city', '仅选择城市')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* 学校列表 */}
        {cityToSchools[selectedCity]?.map((school) => (
          <TouchableOpacity
            key={school}
            style={styles.selectionItem}
            onPress={() => handleSelectSchool(school)}
            activeOpacity={0.7}
          >
            <View style={styles.schoolItemLeft}>
              <Ionicons name="school" size={20} color="#4CAF50" />
              <Text style={styles.selectionItemText}>{String(school)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {currentStep === 'main' && renderMainScreen()}
          {currentStep === 'state' && renderStateSelection()}
          {currentStep === 'city' && renderCitySelection()}
          {currentStep === 'school' && renderSchoolSelection()}
        </View>
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
    flex: 1,
    backgroundColor: 'white',
    marginTop: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  currentLocationContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  currentLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
  },
  currentLocationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  optionsList: {
    flex: 1,
    paddingTop: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    marginBottom: 1,
  },
  mySchoolOption: {
    backgroundColor: '#f0fdf4',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    fontSize: 14,
    color: '#007AFF',
  },
  selectionList: {
    flex: 1,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  stateIndicator: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stateIndicatorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  schoolBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  schoolBadgeText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  schoolItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});