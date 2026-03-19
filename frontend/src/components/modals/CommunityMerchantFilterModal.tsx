import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FunnelFilterIcon, PriceFilterIcon, TypeFilterIcon, AvailabilityFilterIcon, LocationFilterIcon } from '../common/icons/FilterIcons';

const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 88;

const COLORS = {
  primary: '#FF7763',
  white: '#FFFFFF',
  border: '#E8E8E8',
  gray100: '#FAF3F1',
  textMain: '#1A1A1A',
};

export interface MerchantFilterOptions {
  category: string | null;
  priceRange: 'all' | 'free' | 'under-10' | '10-30' | '30-50' | '50-plus';
  sortBy: 'points-high' | 'points-low' | 'price-low' | 'price-high' | 'newest';
  selectedSchools: string[];
  selectedMerchantTypes: string[];
}

interface CommunityMerchantFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: MerchantFilterOptions) => void;
  initialFilters?: MerchantFilterOptions;
  schools: Array<{ id: string; name: string }>;
}

export const CommunityMerchantFilterModal: React.FC<CommunityMerchantFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
  schools = [],
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('type');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters?.selectedMerchantTypes || []
  );
  const [priceRange, setPriceRange] = useState(initialFilters?.priceRange || 'all');
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'points-high');
  const [selectedSchools, setSelectedSchools] = useState<string[]>(
    initialFilters?.selectedSchools || []
  );

  const hasFilterChanges = selectedTypes.length > 0 ||
    priceRange !== 'all' ||
    sortBy !== 'points-high' ||
    selectedSchools.length > 0;

  const tabs = [
    { id: 'price', label: 'Price', IconComponent: PriceFilterIcon },
    { id: 'type', label: 'Type', IconComponent: TypeFilterIcon },
    { id: 'sort', label: 'Sort', IconComponent: AvailabilityFilterIcon },
    { id: 'schools', label: 'Location', IconComponent: LocationFilterIcon },
  ];

  const merchantTypes = [
    { id: 'restaurant', label: 'Restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' },
    { id: 'cafe', label: 'Cafe', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400' },
    { id: 'bar', label: 'Bar', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400' },
    { id: 'shopping', label: 'Shopping', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400' },
    { id: 'fitness', label: 'Fitness', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
    { id: 'study', label: 'Study Space', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400' },
  ];

  const priceChips: { id: MerchantFilterOptions['priceRange']; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'free', label: 'Free' },
    { id: 'under-10', label: 'under $10' },
    { id: '10-30', label: '$10 - $30' },
    { id: '30-50', label: '$30 - $50' },
    { id: '50-plus', label: '$50+' },
  ];

  const sortOptions = [
    { id: 'points-high', label: 'Highest Points' },
    { id: 'points-low', label: 'Lowest Points' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'newest', label: 'Newest' },
  ];

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleSchool = (schoolId: string) => {
    setSelectedSchools(prev =>
      prev.includes(schoolId)
        ? prev.filter(id => id !== schoolId)
        : [...prev, schoolId]
    );
  };

  const handleClearAll = () => {
    setSelectedTypes([]);
    setPriceRange('all');
    setSortBy('points-high');
    setSelectedSchools([]);
  };

  const handleApply = () => {
    onApply({
      category: selectedTypes[0] || null,
      priceRange,
      sortBy,
      selectedSchools,
      selectedMerchantTypes: selectedTypes,
    });
    onClose();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'price':
        return (
          <View>
            <Text style={styles.sectionTitle}>Price</Text>
            <Text style={styles.sectionSubtitle}>Free - $50+</Text>
            {/* Slider track */}
            <View style={styles.sliderTrackContainer}>
              <View style={styles.sliderTrack} />
              <View style={styles.sliderActiveTrack} />
              <View style={[styles.sliderThumb, { left: 0 }]} />
              <View style={[styles.sliderThumb, { right: 0 }]} />
            </View>
            <View style={styles.chipsContainer}>
              {priceChips.map(chip => (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.chip, priceRange === chip.id ? styles.chipSelected : styles.chipUnselected]}
                  onPress={() => setPriceRange(chip.id)}
                >
                  <Text style={[styles.chipText, priceRange === chip.id ? styles.chipTextSelected : styles.chipTextUnselected]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'type':
        return (
          <View>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeGrid}>
              {merchantTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.imageCard, selectedTypes.includes(type.id) && styles.imageCardSelected]}
                  onPress={() => toggleType(type.id)}
                >
                  <Image source={{ uri: type.image }} style={styles.cardImage} />
                  <View style={styles.cardLabelContainer}>
                    <Text style={styles.cardLabel}>{type.label}</Text>
                    {selectedTypes.includes(type.id) && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'sort':
        return (
          <View>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.availabilityChips}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.sortChip, sortBy === option.id && styles.chipSelected]}
                  onPress={() => setSortBy(option.id as MerchantFilterOptions['sortBy'])}
                >
                  <Text style={[styles.chipText, sortBy === option.id ? styles.chipTextSelected : styles.chipTextUnselected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'schools':
        return (
          <View>
            <Text style={styles.sectionTitle}>Location</Text>
            {schools.map((school) => (
              <TouchableOpacity
                key={school.id}
                style={[styles.locationItem, selectedSchools.includes(school.id) && styles.locationItemActive]}
                onPress={() => toggleSchool(school.id)}
              >
                <Ionicons name="school-outline" size={22} color={COLORS.primary} style={styles.locationIcon} />
                <Text style={styles.locationTitle}>{school.name}</Text>
                {selectedSchools.includes(school.id) && (
                  <Ionicons name="checkmark" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Close button floating over dim area */}
        <TouchableOpacity
          testID="filter-modal-close"
          accessibilityLabel="filter-modal-close"
          style={[styles.floatingClose, { bottom: '75%', marginBottom: 12 }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FunnelFilterIcon size={24} color="#000" />
              <Text style={styles.headerTitle}>Filter</Text>
            </View>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Main - sidebar + content */}
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
                  <tab.IconComponent
                    size={22}
                    color={activeTab === tab.id ? COLORS.primary : '#949494'}
                  />
                  <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.rightPanel} contentContainerStyle={styles.rightPanelContent} showsVerticalScrollIndicator={false}>
              {renderContent()}
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <TouchableOpacity testID="filter-close-button" style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, !hasFilterChanges && styles.applyButtonDisabled]}
              onPress={handleApply}
              disabled={!hasFilterChanges}
            >
              <Text style={[styles.applyButtonText, !hasFilterChanges && styles.applyButtonTextDisabled]}>
                {t('filters.showResults', 'Show Results')}
              </Text>
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
    backgroundColor: COLORS.gray100,
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
    backgroundColor: '#FAF3F1',
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

  // Slider
  sliderTrackContainer: {
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
    left: 0,
    right: 0,
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

  // Chips
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

  // Type grid
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

  // Sort / Availability
  availabilityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sortChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#FFF',
    marginBottom: 4,
  },

  // Location
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
  locationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  // Footer
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
    fontFamily: 'Poppins_500Medium',
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
    shadowColor: '#FF7763',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    backgroundColor: '#D1D1D1',
    shadowOpacity: 0,
  },
  applyButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  applyButtonTextDisabled: {
    color: '#FFF',
  },
});
