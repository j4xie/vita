import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SearchIcon } from '../common/icons/SearchIcon';
import { FunnelFilterIcon, DiagonalArrowIcon } from '../common/icons/FilterIcons';
import { CalendarIcon } from '../icons/ActivityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardDoneAccessory, KEYBOARD_ACCESSORY_ID } from '../common/KeyboardDismissWrapper';
import { FrontendActivity } from '../../utils/activityAdapter';
import { useSchoolLogos, getSchoolLogoSync } from '../../hooks/useSchoolLogos';

const { width: screenWidth } = Dimensions.get('window');

const COLORS = {
  primary: '#FF7763',
  white: '#FFFFFF',
  gray100: '#F8F8F8',
  gray200: '#F0F0F0',
  gray400: '#E0E0E0',
  gray500: '#999',
  gray600: '#666',
  textMain: '#1A1A1A',
  searchBg: '#F2F2F2',
  searchBorder: '#E1E1E1',
  screenBg: '#FAF3F1',
};

interface ActivitySearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectActivity: (activity: FrontendActivity) => void;
  activities: FrontendActivity[];
}

// Search result item matching Figma explore-search-result.png
const SearchResultItem = React.memo(({
  activity,
  onPress,
}: {
  activity: FrontendActivity;
  onPress: () => void;
}) => {
  const { loading: schoolsLoading } = useSchoolLogos();

  const logoUrl = useMemo(() => {
    if (!schoolsLoading) {
      const textLogo = getSchoolLogoSync(activity.title || '', activity.location || '');
      if (textLogo) return textLogo;
    }
    const avatar = activity.organizer?.avatar;
    if (avatar && !avatar.includes('ui-avatars.com') && !avatar.includes('americanpromotioncompany.com')) {
      return avatar;
    }
    return null;
  }, [activity.title, activity.location, activity.organizer?.avatar, schoolsLoading]);

  const formatDate = (date: string | undefined) => {
    if (!date) return '';
    return date.replace(/-/g, '/');
  };

  const startDate = formatDate(activity.date);
  const timeDisplay = activity.time ? `  ${activity.time}` : '';

  return (
    <TouchableOpacity style={resultStyles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={resultStyles.avatarContainer}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={resultStyles.avatar} resizeMode="contain" />
        ) : activity.image ? (
          <Image source={{ uri: activity.image }} style={resultStyles.avatar} />
        ) : (
          <View style={[resultStyles.avatar, resultStyles.avatarPlaceholder]}>
            <CalendarIcon size={20} color={COLORS.gray500} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={resultStyles.content}>
        <Text style={resultStyles.orgText} numberOfLines={1}>
          {activity.organizer?.name || activity.organizerName || 'PomeloX'}
        </Text>
        <Text style={resultStyles.nameText} numberOfLines={1}>
          {activity.title}
        </Text>
        <View style={resultStyles.dateRow}>
          <CalendarIcon size={13} color="#949494" />
          <Text style={resultStyles.dateText}>
            {startDate}{timeDisplay}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={resultStyles.arrowBtn}>
        <DiagonalArrowIcon size={14} color="#000" />
      </View>
    </TouchableOpacity>
  );
});

const resultStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray200,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: 8,
    gap: 2,
  },
  orgText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#949494',
  },
  nameText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMain,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.gray600,
  },
  arrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ActivitySearchModal: React.FC<ActivitySearchModalProps> = ({
  visible,
  onClose,
  onSelectActivity,
  activities,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');

  const filteredActivities = useMemo(() => {
    if (!searchText.trim()) return [];

    const searchLower = searchText.toLowerCase();
    return activities.filter(activity => {
      const titleMatch = activity.title?.toLowerCase().includes(searchLower);
      const detailMatch = activity.detail?.toLowerCase().includes(searchLower);
      const orgMatch = activity.organizerName?.toLowerCase().includes(searchLower);
      const locationMatch = activity.location?.toLowerCase().includes(searchLower);
      return titleMatch || detailMatch || orgMatch || locationMatch;
    });
  }, [activities, searchText]);

  const handleClose = useCallback(() => {
    setSearchText('');
    onClose();
  }, [onClose]);

  const renderItem = useCallback(({ item }: { item: FrontendActivity }) => (
    <SearchResultItem
      activity={item}
      onPress={() => onSelectActivity(item)}
    />
  ), [onSelectActivity]);

  const renderEmpty = () => {
    if (!searchText.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <SearchIcon size={48} color={COLORS.gray400} />
          <Text style={styles.emptyTitle}>
            {t('search.startSearching', 'Start searching')}
          </Text>
          <Text style={styles.emptySubtext}>
            {t('search.searchHint', 'Enter keywords to find activities')}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <SearchIcon size={48} color={COLORS.gray400} />
        <Text style={styles.emptyTitle}>
          {t('search.noResults', 'No results found')}
        </Text>
        <Text style={styles.emptySubtext}>
          {t('search.tryDifferentKeywords', 'Try different keywords or check spelling')}
        </Text>
      </View>
    );
  };

  const resultCount = searchText.trim() ? filteredActivities.length : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        {/* Floating close button */}
        <TouchableOpacity
          testID="search-modal-close"
          accessibilityLabel="search-modal-close"
          style={[styles.floatingClose, { bottom: '75%', marginBottom: 12 }]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={20} color="#000" />
        </TouchableOpacity>

        {/* Search panel - matches Figma explore-search-result */}
        <View style={[styles.searchPanel, { paddingBottom: insets.bottom || 20 }]}>
          {/* Header */}
          <View style={styles.searchHeader}>
            <View style={styles.searchTitleRow}>
              <View style={styles.searchTitleLeft}>
                <FunnelFilterIcon size={20} color="#000" />
                <Text style={styles.searchTitle}>
                  {t('common.search', 'Search')}
                </Text>
              </View>
            </View>

            {/* Pill search input */}
            <View style={styles.searchInputRow}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('search.placeholder', 'Search')}
                placeholderTextColor="#949494"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                returnKeyType="search"
                inputAccessoryViewID={Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color="#949494" />
                </TouchableOpacity>
              )}
              <View style={styles.searchIconBtn}>
                <SearchIcon size={18} color={COLORS.white} />
              </View>
            </View>
          </View>

          {/* Result count */}
          {searchText.trim() ? (
            <Text style={styles.resultCount}>
              {resultCount} {resultCount === 1 ? t('search.result', 'result') : t('search.results', 'results')}
            </Text>
          ) : null}

          {/* Results list */}
          <FlatList
            data={filteredActivities}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
      <KeyboardDoneAccessory />
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
  searchPanel: {
    height: '75%',
    backgroundColor: COLORS.screenBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  searchHeader: {
    backgroundColor: COLORS.white,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 148, 148, 0.2)',
  },
  searchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.searchBg,
    borderWidth: 1,
    borderColor: COLORS.searchBorder,
    borderRadius: 101,
    height: 46,
    paddingLeft: 20,
    paddingRight: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#000',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  searchIconBtn: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCount: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: COLORS.gray500,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textMain,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
  },
});
