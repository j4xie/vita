import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const COLORS = {
  primary: '#FF8A72',
  primaryLight: '#FFF0ED',
  inactive: '#AAAAAA',
  bg: '#FFFFFF',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = Platform.OS === 'ios' && SCREEN_WIDTH >= 768;

const MERCHANT_TAB_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  labelKey: string;
}> = {
  MerchantDashboard: {
    icon: 'storefront-outline',
    iconFocused: 'storefront',
    labelKey: 'navigation.tabs.merchantDashboard',
  },
  MerchantActivities: {
    icon: 'calendar-outline',
    iconFocused: 'calendar',
    labelKey: 'navigation.tabs.merchantActivities',
  },
  MerchantProfile: {
    icon: 'person-circle-outline',
    iconFocused: 'person-circle',
    labelKey: 'navigation.tabs.profile',
  },
};

// ─── Dot Indicator ────────────────────────────────────────────────────────────

const DotIndicator: React.FC<{ visible: boolean }> = ({ visible }) => {
  const opacity = useSharedValue(0);
  const scaleVal = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scaleVal.value = withSpring(1, { damping: 12, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scaleVal.value = withTiming(0, { duration: 150 });
    }
  }, [visible, opacity, scaleVal]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scaleVal.value }],
  }));

  return <Animated.View style={[styles.dotIndicator, dotStyle]} />;
};

// ─── Main Tab Bar ─────────────────────────────────────────────────────────────

export const MerchantTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarTranslateY = useSharedValue(0);

  // Per-tab scale animations (3 tabs)
  const tabScale0 = useSharedValue(1);
  const tabScale1 = useSharedValue(1);
  const tabScale2 = useSharedValue(1);
  const tabScales = useRef([tabScale0, tabScale1, tabScale2]).current;

  const handleTabPress = useCallback((route: any, isFocused: boolean, index: number) => {
    if (!isFocused && index >= 0 && index < tabScales.length) {
      tabScales[index].value = withSequence(
        withTiming(0.88, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(1.06, { damping: 11, stiffness: 380 }),
        withTiming(1.0, { duration: 130, easing: Easing.out(Easing.cubic) })
      );
    }

    if (!isFocused) {
      tabBarTranslateY.value = withSequence(
        withTiming(-2, { duration: 70, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 14, stiffness: 280 })
      );
    }

    if (Platform.OS === 'ios') {
      try { Haptics.selectionAsync(); } catch {}
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }, [navigation, tabScales, tabBarTranslateY]);

  // Keyboard show/hide
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => { tabBarTranslateY.value = withTiming(130, { duration: 240 }); }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => { tabBarTranslateY.value = withTiming(0, { duration: 240 }); }
    );
    return () => { showSub?.remove(); hideSub?.remove(); };
  }, [tabBarTranslateY]);

  const animatedTabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarTranslateY.value }],
  }));

  const tabAnimStyle0 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale0.value }] }));
  const tabAnimStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale1.value }] }));
  const tabAnimStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: tabScale2.value }] }));
  const tabAnimStyles = useRef([tabAnimStyle0, tabAnimStyle1, tabAnimStyle2]).current;

  if (!state || !state.routes) return null;

  const currentRoute = state.routes[state.index];

  // Derive focused route name from live navigation state (not stale descriptor options)
  const getFocusedRouteName = (route: any): string => {
    if (route.state) {
      const nestedRoute = route.state.routes[route.state.index];
      return getFocusedRouteName(nestedRoute);
    }
    return route.name;
  };
  const focusedRouteName = currentRoute ? getFocusedRouteName(currentRoute) : 'unknown';

  // Merchant tab bar visible pages
  const merchantVisiblePages = [
    'MerchantDashboard', 'MerchantDashboardHome',
    'MerchantActivitiesHome', 'ProfileHome',
  ];
  if (!merchantVisiblePages.includes(focusedRouteName)) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingBottom: insets.bottom },
        animatedTabBarStyle,
      ]}
    >
      {/* Hairline separator */}
      <View style={styles.topShadowLine} />

      {/* Tab row */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          if (!route || !route.key) return null;

          const isFocused = state.index === index;
          const config = MERCHANT_TAB_CONFIG[route.name];
          if (!config) return null;

          const iconName = isFocused ? config.iconFocused : config.icon;
          const label = t(config.labelKey);

          return (
            <Animated.View
              key={route.key}
              style={[styles.tabItem, tabAnimStyles[index]]}
            >
              <TouchableOpacity
                accessibilityRole="tab"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={`${label}${isFocused ? ', selected' : ''}`}
                onPress={() => handleTabPress(route, isFocused, index)}
                style={styles.tabTouchable}
                activeOpacity={0.7}
              >
                {/* Dot indicator above icon */}
                <DotIndicator visible={isFocused} />

                <View style={[
                  styles.tabContent,
                  isFocused && styles.tabContentFocused,
                ]}>
                  <Ionicons
                    name={iconName}
                    size={isFocused ? 22 : 21}
                    color={isFocused ? COLORS.primary : COLORS.inactive}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isFocused ? COLORS.primary : COLORS.inactive },
                      isFocused && styles.tabLabelActive,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {label}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const TAB_HEIGHT = 56;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 10,
  },
  topShadowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },

  // ─── Tab row ───────────────────────────────────────────────────────────────
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: TAB_HEIGHT,
    paddingHorizontal: 4,
  },

  // Regular tab slot — equal flex so all 3 columns are the same width
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingTop: 6,
  },
  tabContentFocused: {},
  tabLabel: {
    fontSize: IS_TABLET ? 20 : 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: IS_TABLET ? 26 : 13,
  },
  tabLabelActive: {
    fontWeight: '700',
  },

  // Dot indicator above icon
  dotIndicator: {
    position: 'absolute',
    top: 0,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
  },
});

export default MerchantTabBar;
