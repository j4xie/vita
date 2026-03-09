import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardEvent,
  AccessibilityInfo,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme';
import { useFilter } from '../../context/FilterContext';
import { shouldShowTabBar } from '../../config/tabBarConfig';
import { CenterTabButton } from './CenterTabButton';
import { ExploreIcon } from '../common/icons/ExploreIcon';

interface CustomTabBarProps extends BottomTabBarProps {
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isFilterOpen } = useFilter();
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);

  const currentRoute = state.routes[state.index];
  const getFocusedRouteName = (route: any): string => {
    if (route.state) {
      const nestedRoute = route.state.routes[route.state.index];
      return getFocusedRouteName(nestedRoute);
    }
    return route.name;
  };

  const focusedRouteName = getFocusedRouteName(currentRoute);

  const tabBarTranslateY = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
  }, []);

  // Tab scale animations
  const tabScale0 = useSharedValue(1);
  const tabScale1 = useSharedValue(1);
  const tabScale2 = useSharedValue(1);
  const tabScale3 = useSharedValue(1);
  const tabScale4 = useSharedValue(1);
  const tabScales = useRef([tabScale0, tabScale1, tabScale2, tabScale3, tabScale4]).current;

  const handleTabPress = useCallback((route: any, isFocused: boolean) => {
    const tabIndex = state.routes.findIndex(r => r.key === route.key);

    // Bounce animation on non-focused tab
    if (!isFocused && tabIndex >= 0 && tabIndex < tabScales.length) {
      tabScales[tabIndex].value = withSequence(
        withTiming(0.9, { duration: 100, easing: Easing.out(Easing.quad) }),
        withSpring(1.05, { damping: 12, stiffness: 400 }),
        withTiming(1.0, { duration: 150, easing: Easing.out(Easing.cubic) })
      );
    }

    // Subtle bar bounce
    if (!isFocused) {
      tabBarTranslateY.value = withSequence(
        withTiming(-1, { duration: 80, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 15, stiffness: 300 })
      );
    }

    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptics not available:', error);
      }

      navigation.navigate(route.name, route.params);
    } else if (isFocused && route.name === 'Explore') {
      DeviceEventEmitter.emit('scrollToTopAndRefresh');
    }
  }, [navigation]);

  // Filter hide/show
  useEffect(() => {
    const targetTranslateY = isFilterOpen ? 120 : 0;
    tabBarTranslateY.value = withTiming(targetTranslateY, {
      duration: isReduceMotionEnabled ? 120 : 200,
    });
  }, [isFilterOpen, isReduceMotionEnabled]);

  // Keyboard hide/show
  useEffect(() => {
    const keyboardWillShow = (e: KeyboardEvent) => {
      const currentRoute = state.routes[state.index];
      const currentRouteName = currentRoute?.name || 'unknown';

      if (shouldShowTabBar(currentRouteName)) {
        tabBarTranslateY.value = withTiming(120, { duration: 250 });
      }
    };

    const keyboardWillHide = () => {
      const currentRoute = state.routes[state.index];
      const currentRouteName = currentRoute?.name || 'unknown';

      if (shouldShowTabBar(currentRouteName)) {
        tabBarTranslateY.value = withTiming(0, { duration: 250 });
      }
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [state]);

  const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case 'Explore':
        return focused ? 'navigate' : 'navigate-outline';
      case 'Community':
        return focused ? 'business' : 'business-outline';
      case 'Rewards':
        return focused ? 'card' : 'card-outline';
      case 'Wellbeing':
        return focused ? 'chatbubbles' : 'chatbubbles-outline';
      case 'Profile':
        return focused ? 'person-circle' : 'person-circle-outline';
      default:
        return 'compass-outline';
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Explore':
        return t('navigation.tabs.explore');
      case 'Community':
        return t('navigation.tabs.community');
      case 'Rewards':
        return t('navigation.tabs.rewards');
      case 'Wellbeing':
        return t('navigation.tabs.wellbeing');
      case 'Profile':
        return t('navigation.tabs.profile');
      default:
        return routeName;
    }
  };

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: tabBarTranslateY.value },
    ],
  }));

  // Per-tab animated styles
  const tabAnimStyle0 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale0.value }] }));
  const tabAnimStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale1.value }] }));
  const tabAnimStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale2.value }] }));
  const tabAnimStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale3.value }] }));
  const tabAnimStyle4 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale4.value }] }));
  const tabAnimStyles = useRef([tabAnimStyle0, tabAnimStyle1, tabAnimStyle2, tabAnimStyle3, tabAnimStyle4]).current;

  if (!state || !state.routes || !descriptors) {
    return null;
  }

  const tabBarStyle = descriptors[currentRoute?.key]?.options?.tabBarStyle;
  const shouldHideByStyle = tabBarStyle && typeof tabBarStyle === 'object' && 'display' in tabBarStyle && tabBarStyle.display === 'none';
  const shouldShowByConfig = shouldShowTabBar(focusedRouteName);

  if (shouldHideByStyle || !shouldShowByConfig) {
    return null;
  }

  return (
    <Animated.View style={[
      styles.container,
      { paddingBottom: insets.bottom },
      animatedTabBarStyle,
      isFilterOpen && styles.hidden
    ]}>
      {/* Top shadow line */}
      <View style={styles.topShadowLine} />

      {/* Tab items */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          if (!route || !route.key) return null;

          const descriptor = descriptors[route.key];
          if (!descriptor) return null;

          const isFocused = state.index === index;

          // Rewards Tab - center button placeholder
          if (route.name === 'Rewards') {
            return <View key={route.key} style={styles.centerPlaceholder} />;
          }

          const iconName = getIconName(route.name, isFocused);
          const label = getTabLabel(route.name);

          return (
            <Animated.View
              key={route.key}
              style={[styles.tabItem, tabAnimStyles[index]]}
            >
              <TouchableOpacity
                accessibilityRole="tab"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={`${label}${isFocused ? ', selected' : ''}`}
                onPress={() => handleTabPress(route, isFocused)}
                style={styles.tabTouchable}
                activeOpacity={0.7}
              >
                {/* Active indicator line */}
                {isFocused && <View style={styles.activeIndicator} />}

                <View style={styles.tabContent}>
                  {route.name === 'Explore' ? (
                    <ExploreIcon
                      size={isFocused ? 22 : 20}
                      color={isFocused ? '#FF8A72' : '#555555'}
                      filled={isFocused}
                    />
                  ) : (
                    <Ionicons
                      name={iconName}
                      size={isFocused ? 22 : 20}
                      color={isFocused ? '#FF8A72' : '#555555'}
                    />
                  )}
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isFocused ? '#FF8A72' : '#555555',
                        fontWeight: isFocused ? '600' : '500',
                      }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                    allowFontScaling={true}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Floating center button */}
      {(() => {
        const rewardsRoute = state.routes.find(route => route.name === 'Rewards');
        if (!rewardsRoute) return null;

        const rewardsIndex = state.routes.findIndex(route => route.name === 'Rewards');
        const isFocused = state.index === rewardsIndex;

        return (
          <View style={styles.floatingCenterButton} pointerEvents="box-none">
            <CenterTabButton
              focused={isFocused}
              onPress={() => handleTabPress(rewardsRoute, isFocused)}
              icon="crown-outline"
              badge={0}
            />
          </View>
        );
      })()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },

  topShadowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },

  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    paddingHorizontal: 4,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    minHeight: 48,
    minWidth: 44,
    position: 'relative',
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  activeIndicator: {
    position: 'absolute',
    top: 2,
    width: 20,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FF8A72',
  },

  tabLabel: {
    fontSize: Platform.OS === 'ios' && (Dimensions.get('window').width >= 768) ? 24 : 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: Platform.OS === 'ios' && (Dimensions.get('window').width >= 768) ? 30 : 13,
  },

  hidden: {
    opacity: 0,
    pointerEvents: 'none',
    transform: [{ translateY: 200 }],
  },

  centerPlaceholder: {
    width: 70,
    height: '100%',
  },

  floatingCenterButton: {
    position: 'absolute',
    top: -22,
    left: '50%',
    marginLeft: -30,
    zIndex: 1001,
  },
});

export default CustomTabBar;
