import React, { useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme';

interface AnimatedSearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  scrollY: Reanimated.SharedValue<number>;
  placeholder?: string;
}

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
  searchText,
  onSearchChange,
  scrollY,
  placeholder,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const inputRef = useRef<TextInput>(null);

  // Animation thresholds (as specified in requirements)
  const SHOW_THRESHOLD = 240; // 240pt
  const HIDE_THRESHOLD = 16;  // 16pt

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSearchChange('');
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Animated style for search bar visibility and transform
  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    // Show when scrollY > SHOW_THRESHOLD, hide when scrollY < HIDE_THRESHOLD
    const opacity = interpolate(
      scrollY.value,
      [HIDE_THRESHOLD, SHOW_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    const translateY = interpolate(
      scrollY.value,
      [HIDE_THRESHOLD, SHOW_THRESHOLD],
      [-20, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [HIDE_THRESHOLD, SHOW_THRESHOLD],
      [0.95, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity: withTiming(opacity, {
        duration: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      transform: [
        { 
          translateY: withTiming(translateY, {
            duration: 200,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          }) 
        },
        { 
          scale: withTiming(scale, {
            duration: 200,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
          })
        },
      ],
    };
  });

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : theme.liquidGlass.background.primary,
      borderBottomWidth: theme.liquidGlass.border.width,
      borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.3)' : theme.liquidGlass.border.color,
      zIndex: 105, // Above CategoryBar
      ...theme.shadows.md,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(58, 58, 60, 0.85)' : theme.liquidGlass.card.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(84, 84, 88, 0.3)' : theme.liquidGlass.border.color,
      ...theme.shadows.xs,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDarkMode ? 'rgba(235, 235, 245, 0.9)' : theme.colors.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
      lineHeight: 20,
    },
    clearButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(142, 142, 147, 0.8)' : theme.colors.text.tertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
  });

  return (
    <Reanimated.View style={[styles.container, searchBarAnimatedStyle]}>
      <View style={styles.searchInputContainer}>
        <Icon
          name="search"
          size={20}
          color={isDarkMode ? 'rgba(235, 235, 245, 0.6)' : theme.colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder || t('placeholders.searchActivities')}
          value={searchText}
          onChangeText={onSearchChange}
          onFocus={handleFocus}
          placeholderTextColor={isDarkMode ? 'rgba(235, 235, 245, 0.6)' : theme.colors.text.secondary}
          returnKeyType="search"
          blurOnSubmit={false}
          clearButtonMode="never" // We use custom clear button
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t('accessibility.searchActivities')}
          accessibilityHint={t('accessibility.searchActivitiesHint')}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearSearch}
            accessibilityLabel={t('accessibility.clearSearch')}
            accessibilityRole="button"
          >
            <Icon
              name="close"
              size={14}
              color={theme.colors.surface}
            />
          </TouchableOpacity>
        )}
      </View>
    </Reanimated.View>
  );
};

export default AnimatedSearchBar;