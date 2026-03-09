import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TextInput,
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 88; // 严格对齐图 2 的侧边栏宽度

// Design Colors - 严格对齐图 2
const COLORS = {
  primary: '#FF7763', // 珊瑚色
  primaryLight: '#FFE0D9',
  primaryBg: '#FFF5F2',
  white: '#FFFFFF',
  gray100: '#F8F8F8', // 侧边栏背景色：浅灰
  gray200: '#F2F2F2',
  gray300: '#E5E5E5',
  gray400: '#D1D1D1',
  gray500: '#999',
  gray600: '#666',
  textMain: '#1A1A1A',
  border: '#E8E8E8',
};

export interface ActivityFilterOptions {
  priceRange: 'all' | 'free' | 'under10' | '10to30' | '30to50' | '50plus';
  activityTypes: string[];
  availability: 'all' | 'available';
  location: {
    type: 'all' | 'current' | 'school' | 'city';
    value?: string;
  };
}

interface ActivityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ActivityFilterOptions) => void;
  initialFilters?: ActivityFilterOptions;
}

export const ActivityFilterModal: React.FC<ActivityFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('price');
  const [priceRange, setPriceRange] = useState<ActivityFilterOptions['priceRange']>(
    initialFilters?.priceRange || 'all'
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters?.activityTypes || []
  );
  const [availability, setAvailability] = useState<'all' | 'available'>(
    initialFilters?.availability || 'all'
  );
  const [location, setLocation] = useState<ActivityFilterOptions['location']>(
    initialFilters?.location || { type: 'all' }
  );

  const [locationSearch, setLocationSearch] = useState('');

  // Price slider state
  const SLIDER_WIDTH = screenWidth - SIDEBAR_WIDTH - 48 - 24; // 考虑padding
  const THUMB_SIZE = 24;
  const MIN_PRICE = 0;
  const MAX_PRICE = 50;

  // 价格区间映射到滑块位置 (0-1)
  const priceRangeToPositions = (range: ActivityFilterOptions['priceRange']): [number, number] => {
    switch (range) {
      case 'all': return [0, 1];
      case 'free': return [0, 0];
      case 'under10': return [0, 0.2];
      case '10to30': return [0.2, 0.6];
      case '30to50': return [0.6, 1.0];
      case '50plus': return [1.0, 1.0];
      default: return [0, 1];
    }
  };

  const initialPositions = priceRangeToPositions(initialFilters?.priceRange || 'all');
  const [minPos, setMinPos] = useState(initialPositions[0]);
  const [maxPos, setMaxPos] = useState(initialPositions[1]);

  const minPosRef = useRef(initialPositions[0]);
  const maxPosRef = useRef(initialPositions[1]);

  // 滑块位置映射到价格区间
  const positionsToRange = (min: number, max: number): ActivityFilterOptions['priceRange'] => {
    if (min === 0 && max === 0) return 'free';
    if (min === 0 && max <= 0.25) return 'under10';
    if (min >= 0.15 && min <= 0.25 && max >= 0.55 && max <= 0.65) return '10to30';
    if (min >= 0.55 && min <= 0.65 && max >= 0.95) return '30to50';
    if (min >= 0.95 && max >= 0.95) return '50plus';
    if (min === 0 && max >= 0.95) return 'all';
    return 'all';
  };

  // 当选择chip时同步滑块位置
  const handlePriceSelect = (id: ActivityFilterOptions['priceRange']) => {
    setPriceRange(id);
    const [newMin, newMax] = priceRangeToPositions(id);
    setMinPos(newMin);
    setMaxPos(newMax);
    minPosRef.current = newMin;
    maxPosRef.current = newMax;
  };

  // 左滑块 PanResponder
  const leftPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const newPos = Math.max(0, Math.min(maxPosRef.current - 0.05, minPosRef.current + gestureState.dx / SLIDER_WIDTH));
        setMinPos(newPos);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newPos = Math.max(0, Math.min(maxPosRef.current - 0.05, minPosRef.current + gestureState.dx / SLIDER_WIDTH));
        minPosRef.current = newPos;
        setMinPos(newPos);
        const newRange = positionsToRange(newPos, maxPosRef.current);
        setPriceRange(newRange);
      },
    })
  ).current;

  // 右滑块 PanResponder
  const rightPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const newPos = Math.max(minPosRef.current + 0.05, Math.min(1, maxPosRef.current + gestureState.dx / SLIDER_WIDTH));
        setMaxPos(newPos);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newPos = Math.max(minPosRef.current + 0.05, Math.min(1, maxPosRef.current + gestureState.dx / SLIDER_WIDTH));
        maxPosRef.current = newPos;
        setMaxPos(newPos);
        const newRange = positionsToRange(minPosRef.current, newPos);
        setPriceRange(newRange);
      },
    })
  ).current;

  // 获取显示的价格文字
  const getPriceDisplay = () => {
    const minPrice = Math.round(minPos * MAX_PRICE);
    const maxPrice = Math.round(maxPos * MAX_PRICE);
    if (minPrice === 0 && maxPrice === 0) return 'Free';
    if (minPrice === 0 && maxPrice >= 50) return 'Free - $50+';
    if (minPrice === 0) return `Free - $${maxPrice}`;
    if (maxPrice >= 50) return `$${minPrice} - $50+`;
    return `$${minPrice} - $${maxPrice}`;
  };

  // Tab configuration
  const tabs = [
    { id: 'price', label: t('filters.price', 'Price'), icon: 'apps-outline' },
    { id: 'type', label: t('filters.type', 'Type'), icon: 'grid-outline' },
    { id: 'availability', label: t('filters.availability', 'Availability'), icon: 'people-outline' },
    { id: 'location', label: t('filters.location', 'Location'), icon: 'location-outline' },
  ];

  const priceChips: { id: ActivityFilterOptions['priceRange']; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'free', label: 'Free' },
    { id: 'under10', label: 'under $10' },
    { id: '10to30', label: '$10 - $30' },
    { id: '30to50', label: '$30 - $50' },
    { id: '50plus', label: '$50+' },
  ];

  const activityTypes = [
    { id: 'social', label: 'Social', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400' },
    { id: 'academic', label: 'Academic', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400' },
    { id: 'sports', label: 'Sports', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400' },
    { id: 'arts', label: 'Arts', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400' },
    { id: 'volunteer', label: 'Volunteer', image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400' },
    { id: 'career', label: 'Career', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400' },
  ];

  const popularCities = [
    { id: 'los_angeles', name: 'Los Angeles, CA' },
    { id: 'new_york', name: 'New York, NY' },
    { id: 'san_francisco', name: 'San Francisco, CA' },
    { id: 'boston', name: 'Boston, MA' },
  ];

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleClearAll = () => {
    setPriceRange('all');
    setMinPos(0);
    setMaxPos(1);
    minPosRef.current = 0;
    maxPosRef.current = 1;
    setSelectedTypes([]);
    setAvailability('all');
    setLocation({ type: 'all' });
  };

  const handleApply = () => {
    onApply({ priceRange, activityTypes: selectedTypes, availability, location });
    onClose();
  };

  const getPriceSubtitle = () => {
    switch (priceRange) {
      case 'all': return 'Free - $50+';
      case 'free': return 'Free';
      case 'under10': return 'Under $10';
      case '10to30': return '$10 - $30';
      case '30to50': return '$30 - $50';
      case '50plus': return '$50+';
      default: return 'Free - $50+';
    }
  };

  const renderPriceContent = () => (
    <View style={styles.priceContent}>
      <Text style={styles.sectionTitle}>Price</Text>
      <Text style={styles.sectionSubtitle}>{getPriceDisplay()}</Text>

      {/* Interactive Slider */}
      <View style={[styles.sliderContainer, { width: SLIDER_WIDTH }]}>
        {/* Background Track */}
        <View style={styles.sliderTrack} />

        {/* Active Track */}
        <View
          style={[
            styles.sliderActiveTrack,
            {
              left: minPos * SLIDER_WIDTH,
              width: (maxPos - minPos) * SLIDER_WIDTH,
            }
          ]}
        />

        {/* Left Thumb */}
        <View
          {...leftPanResponder.panHandlers}
          style={[
            styles.sliderThumb,
            { left: minPos * SLIDER_WIDTH - THUMB_SIZE / 2 }
          ]}
        />

        {/* Right Thumb */}
        <View
          {...rightPanResponder.panHandlers}
          style={[
            styles.sliderThumb,
            { left: maxPos * SLIDER_WIDTH - THUMB_SIZE / 2 }
          ]}
        />
      </View>

      <View style={styles.chipsContainer}>
        {priceChips.map(chip => (
          <TouchableOpacity
            key={chip.id}
            style={[
              styles.chip,
              priceRange === chip.id ? styles.chipSelected : styles.chipUnselected,
            ]}
            onPress={() => handlePriceSelect(chip.id)}
          >
            <Text style={[
              styles.chipText,
              priceRange === chip.id ? styles.chipTextSelected : styles.chipTextUnselected,
            ]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTypeContent = () => (
    <View>
      <Text style={styles.sectionTitle}>Type</Text>
      <View style={styles.typeGrid}>
        {activityTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.imageCard,
              selectedTypes.includes(type.id) && styles.imageCardSelected,
            ]}
            onPress={() => toggleType(type.id)}
          >
            <Image source={{ uri: type.image }} style={styles.cardImage} />
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>{type.label}</Text>
              {selectedTypes.includes(type.id) && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAvailabilityContent = () => (
    <View>
      <Text style={styles.sectionTitle}>Availability</Text>
      <View style={styles.availabilityChips}>
        <TouchableOpacity
          style={[
            styles.availabilityChip,
            availability === 'all' && styles.chipSelected,
          ]}
          onPress={() => setAvailability('all')}
        >
          <Text style={[
            styles.chipText,
            availability === 'all' && styles.chipTextSelected,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.availabilityChip,
            availability === 'available' && styles.chipSelected,
          ]}
          onPress={() => setAvailability('available')}
        >
          <Text style={[
            styles.chipText,
            availability === 'available' && styles.chipTextSelected,
          ]}>
            Available only
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLocationContent = () => (
    <View>
      <Text style={styles.sectionTitle}>Location</Text>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBarInput}
          placeholder="Search"
          placeholderTextColor="#999"
          value={locationSearch}
          onChangeText={setLocationSearch}
        />
        <View style={styles.searchIconCircle}>
          <Ionicons name="search" size={20} color="#000" />
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.locationItem,
          location.type === 'current' && styles.locationItemActive,
        ]}
        onPress={() => setLocation({ type: 'current', value: 'New York, Ithaca, Cornell' })}
      >
        <Ionicons name="navigate-outline" size={24} color={COLORS.primary} style={styles.locationIcon} />
        <View style={styles.locationTextContent}>
          <Text style={styles.locationTitle}>Use my current location</Text>
          <Text style={styles.locationSubtitle}>New York, Ithaca, Cornell</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.locationItem,
          location.type === 'school' && styles.locationItemActive,
        ]}
        onPress={() => setLocation({ type: 'school', value: 'CU总部' })}
      >
        <Ionicons name="school-outline" size={24} color={COLORS.primary} style={styles.locationIcon} />
        <View style={styles.locationTextContent}>
          <Text style={styles.locationTitle}>My School</Text>
          <Text style={styles.locationSubtitle}>CU总部</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.locationSeparator}>
        <Text style={styles.locationSeparatorText}>POPULAR STUDENT DESTINATION</Text>
      </View>

      {popularCities.map(city => (
        <TouchableOpacity
          key={city.id}
          style={[
            styles.cityItem,
            location.type === 'city' && location.value === city.id && styles.cityItemActive,
          ]}
          onPress={() => setLocation({ type: 'city', value: city.id })}
        >
          <Ionicons name="map-outline" size={24} color={COLORS.primary} style={styles.locationIcon} />
          <Text style={styles.cityNameText}>{city.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'price': return renderPriceContent();
      case 'type': return renderTypeContent();
      case 'availability': return renderAvailabilityContent();
      case 'location': return renderLocationContent();
      default: return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Floating close button over dim area */}
        <TouchableOpacity
          testID="filter-modal-close"
          accessibilityLabel="filter-modal-close"
          style={[styles.floatingClose, { top: insets.top + 120 }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="funnel-outline" size={24} color="#000" />
              <Text style={styles.headerTitle}>Filter</Text>
            </View>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.main}>
            <View style={styles.sidebar}>
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  testID={`filter-tab-${tab.id}`}
                  accessibilityLabel={`filter-tab-${tab.id}`}
                  style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  {activeTab === tab.id && <View style={styles.activeIndicator} />}
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={activeTab === tab.id ? COLORS.primary : '#999'}
                  />
                  <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView style={styles.rightPanel} contentContainerStyle={styles.rightPanelContent}>
              {renderContent()}
            </ScrollView>
          </View>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity testID="filter-close-button" style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  floatingClose: {
    position: 'absolute',
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  container: {
    height: '75%',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 10,
    color: '#000',
  },
  clearText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#F8F8F8',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  tabItem: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  tabItemActive: {
    backgroundColor: '#FFF',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  rightPanelContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
  },
  sliderActiveTrack: {
    position: 'absolute',
    top: 18,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  chipUnselected: {
    backgroundColor: '#FFF',
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
  },
  chipTextUnselected: {
    color: '#444',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 15,
    backgroundColor: '#FFF',
  },
  closeButton: {
    flex: 1,
    height: 48,
    borderRadius: 59,
    borderWidth: 1,
    borderColor: '#949494',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    fontWeight: '500',
    color: '#949494',
  },
  applyButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 59,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  priceContent: {
    flex: 1,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    width: (screenWidth - SIDEBAR_WIDTH - 60) / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  imageCardSelected: {
    borderColor: COLORS.primary,
  },
  cardImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#F2F2F2',
  },
  cardLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  availabilityChips: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  locationOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF',
  },
  locationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: 12,
  },
  locationOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  locationOptionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  locationSeparator: {
    paddingVertical: 16,
    marginTop: 8,
  },
  locationSeparatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BBB',
    letterSpacing: 1,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cityName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingLeft: 20,
    paddingRight: 6,
    height: 50,
    marginBottom: 24,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationItemActive: {
    backgroundColor: 'rgba(255, 119, 99, 0.05)',
  },
  locationIcon: {
    width: 32,
    marginRight: 12,
  },
  locationTextContent: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  locationSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  cityItemActive: {
    backgroundColor: 'rgba(255, 119, 99, 0.05)',
  },
  cityNameText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
});
