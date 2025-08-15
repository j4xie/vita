import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Platform,
  useColorScheme,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme';

interface PersonalInfoCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onPress: () => void;
  testID?: string;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  name,
  email,
  avatarUrl,
  onPress,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    // Press animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 20,
      marginBottom: 24,
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.08 : 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    avatarContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    avatarPlaceholder: {
      // For when we don't have an avatar image
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      fontSize: 20,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#000000',
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: isDarkMode ? '#8e8e93' : '#8e8e93',
    },
    chevron: {
      marginLeft: 8,
    },
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Edit profile for ${name}`}
        accessibilityHint="Double tap to edit your profile information"
        testID={testID}
      >
        <View style={styles.avatarContainer}>
          {/* TODO: Replace with actual avatar image when available */}
          <Ionicons
            name="person"
            size={32}
            color={theme.colors.text.inverse}
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text 
            style={styles.name}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.4}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text 
            style={styles.email}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
          >
            {email}
          </Text>
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDarkMode ? 'rgba(235, 235, 245, 0.3)' : '#c7c7cc'}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PersonalInfoCard;