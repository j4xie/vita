import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../context/ThemeContext';

interface VolunteerManagementCardProps {
  onPress: () => void;
  onRegisteredPress?: () => void;
  onAttendedPress?: () => void;
  hours: number | string;
  registered: number | string;
  attended: number | string;
}

const PeopleIcon: React.FC = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    {/* Right person head */}
    <Path
      d="M16.5 6.5C16.5 7.88071 15.3807 9 14 9C12.6193 9 11.5 7.88071 11.5 6.5C11.5 5.11929 12.6193 4 14 4C15.3807 4 16.5 5.11929 16.5 6.5Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left person head */}
    <Path
      d="M8.5 8.5C8.5 9.60457 7.60457 10.5 6.5 10.5C5.39543 10.5 4.5 9.60457 4.5 8.5C4.5 7.39543 5.39543 6.5 6.5 6.5C7.60457 6.5 8.5 7.39543 8.5 8.5Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Center person head */}
    <Path
      d="M21.5 8.5C21.5 9.60457 20.6046 10.5 19.5 10.5C18.3954 10.5 17.5 9.60457 17.5 8.5C17.5 7.39543 18.3954 6.5 19.5 6.5C20.6046 6.5 21.5 7.39543 21.5 8.5Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right person body */}
    <Path
      d="M14 12C16.7614 12 19 14.2386 19 17V20H9V17C9 14.2386 11.2386 12 14 12Z"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left person body */}
    <Path
      d="M6.5 13.5C4.567 13.5 3 15.067 3 17V20H9"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right side person body */}
    <Path
      d="M19.5 13.5C21.433 13.5 23 15.067 23 17V20H19"
      stroke="#FF7763"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);


interface StatColumnProps {
  value: number | string;
  label: string;
}

const StatColumn: React.FC<StatColumnProps & { isDarkMode: boolean }> = ({
  value,
  label,
  isDarkMode,
}) => (
  <View style={statStyles.column}>
    <Text style={[statStyles.value, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
      {value}
    </Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  column: {
    alignItems: 'center',
    flex: 1,
    gap: 7,
  },
  value: {
    fontSize: 20,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Medium' : undefined,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Medium' : undefined,
    color: '#949494',
  },
});

export const VolunteerManagementCard: React.FC<VolunteerManagementCardProps> = ({
  onPress,
  onRegisteredPress,
  onAttendedPress,
  hours,
  registered,
  attended,
}) => {
  const { t } = useTranslation();
  const themeContext = useTheme();
  const { isDarkMode } = themeContext;

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('profile.volunteer.management')}
    >
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F8F8F8' }]}>
            <PeopleIcon />
          </View>
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {t('profile.volunteer.management')}
          </Text>
        </View>
        <View style={[styles.arrowCircle, { backgroundColor: isDarkMode ? '#3A3A3C' : '#F8F8F8' }]}>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
            style={{ transform: [{ rotate: '-45deg' }] }}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatColumn value={hours} label={t('profile.volunteer_hours_short')} isDarkMode={isDarkMode} />
        <TouchableOpacity onPress={onRegisteredPress} activeOpacity={0.6} style={{ flex: 1 }}>
          <StatColumn value={registered} label={t('profile.not_participated')} isDarkMode={isDarkMode} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onAttendedPress} activeOpacity={0.6} style={{ flex: 1 }}>
          <StatColumn value={attended} label={t('profile.participated')} isDarkMode={isDarkMode} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 31,
    paddingHorizontal: 9,
    paddingTop: 7,
    paddingBottom: 16,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Poppins-Medium' : undefined,
  },
  arrowCircle: {
    width: 41,
    height: 41,
    borderRadius: 25.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 9,
    paddingBottom: 12,
    gap: 30,
  },
});

export default VolunteerManagementCard;
