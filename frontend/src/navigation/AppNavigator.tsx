import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { vitaGlobalAPI } from '../services/VitaGlobalAPI';
import { theme } from '../theme';
import { CustomTabBar } from '../components/navigation/CustomTabBar';
import { useUser, UserProvider } from '../context/UserContext';
import { pageTransitions } from '../utils/animations';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { FilterProvider } from '../context/FilterContext';

// Screens
import { ActivityListScreen } from '../screens/activities/ActivityListScreen';
import { ActivityDetailScreen } from '../screens/activities/ActivityDetailScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterChoiceScreen } from '../screens/auth/RegisterChoiceScreen';
import { RegisterFormScreen } from '../screens/auth/RegisterFormScreen';
import { RegisterStep1Screen } from '../screens/auth/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/auth/RegisterStep2Screen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { QRScannerScreen } from '../screens/common/QRScannerScreen';
// Profile Screens
import { ProfileHomeScreen } from '../screens/profile/ProfileHomeScreen';
import { AccountSecurityScreen } from '../screens/profile/AccountSecurityScreen';
import { NotificationScreen } from '../screens/profile/NotificationScreen';
import { GeneralScreen } from '../screens/profile/GeneralScreen';
import { AboutSupportScreen } from '../screens/profile/AboutSupportScreen';
import { LanguageSelectionScreen } from '../screens/profile/LanguageSelectionScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
// Cards Screens
import { MyCardsScreen } from '../screens/cards/MyCardsScreen';
// Organization Provider
import { OrganizationProvider } from '../context/OrganizationContext';
// Other Tab Screens
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { ConsultingScreen } from '../screens/consulting/ConsultingScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { WellbeingScreen } from '../screens/wellbeing/WellbeingScreen';
import SchoolDetailScreen from '../screens/wellbeing/SchoolDetailScreen';
import { VolunteerCheckInScreen } from '../screens/volunteer/VolunteerCheckInScreen';
import { FloatingAIButton } from '../components/common/FloatingAIButton';
import { GlobalTouchHandler } from '../components/common/GlobalTouchHandler';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Stack Navigators
const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const WellbeingStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        ...pageTransitions.slideFromRight,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen 
        name="RegisterChoice" 
        component={RegisterChoiceScreen}
        options={{
          ...pageTransitions.slideFromBottom,
        }}
      />
      <AuthStack.Screen 
        name="RegisterForm" 
        component={RegisterFormScreen}
        options={{
          ...pageTransitions.fade,
        }}
      />
      <AuthStack.Screen 
        name="RegisterStep1" 
        component={RegisterStep1Screen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen 
        name="RegisterStep2" 
        component={RegisterStep2Screen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen 
        name="Verification" 
        component={VerificationScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
    </AuthStack.Navigator>
  );
};

// Wellbeing Stack Navigator
const WellbeingNavigator = () => {
  return (
    <WellbeingStack.Navigator
      screenOptions={{
        headerShown: false,
        ...pageTransitions.slideFromRight,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
        },
      }}
    >
      <WellbeingStack.Screen 
        name="WellbeingHome" 
        component={WellbeingScreen}
      />
      <WellbeingStack.Screen 
        name="SchoolDetail" 
        component={SchoolDetailScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <WellbeingStack.Screen 
        name="VolunteerCheckIn" 
        component={VolunteerCheckInScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
    </WellbeingStack.Navigator>
  );
};

// Home Stack Navigator
const HomeNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        ...pageTransitions.slideFromRight,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
        },
      }}
    >
      <MainStack.Screen 
        name="ActivityList" 
        component={ActivityListScreen}
        options={{
          ...pageTransitions.fade,
        }}
      />
      <MainStack.Screen 
        name="ActivityDetail" 
        component={ActivityDetailScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
    </MainStack.Navigator>
  );
};

// MyCards Screen with Organization Provider
const MyCardsScreenWithProvider = () => (
  <OrganizationProvider userId="user_123">
    <MyCardsScreen />
  </OrganizationProvider>
);

// QRScanner Screen with Organization Provider
const QRScannerScreenWithProvider = () => (
  <OrganizationProvider userId="user_123">
    <QRScannerScreen />
  </OrganizationProvider>
);

// Profile Stack Navigator
const ProfileNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#f2f2f7',
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
        },
        headerBackTitle: t('navigation.headers.back'),
        ...pageTransitions.slideFromRight,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
        },
      }}
    >
      <ProfileStack.Screen 
        name="ProfileHome" 
        component={ProfileHomeScreen}
        options={{
          headerShown: false, // Hide header for home screen
        }}
      />
      <ProfileStack.Screen 
        name="AccountSecurity" 
        component={AccountSecurityScreen}
        options={{
          title: t('navigation.headers.accountSecurity'),
        }}
      />
      <ProfileStack.Screen 
        name="Notifications" 
        component={NotificationScreen}
        options={{
          title: t('navigation.headers.notifications'),
        }}
      />
      <ProfileStack.Screen 
        name="General" 
        component={GeneralScreen}
        options={{
          title: t('navigation.headers.general'),
        }}
      />
      <ProfileStack.Screen 
        name="AboutSupport" 
        component={AboutSupportScreen}
        options={{
          title: t('navigation.headers.aboutSupport'),
        }}
      />
      <ProfileStack.Screen 
        name="LanguageSelection" 
        component={LanguageSelectionScreen}
        options={{
          title: t('navigation.headers.language'),
        }}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: t('navigation.headers.edit_profile'),
        }}
      />
      <ProfileStack.Screen 
        name="MyCards" 
        component={MyCardsScreenWithProvider}
        options={{
          headerShown: false, // MyCardsScreen有自己的header
        }}
      />
    </ProfileStack.Navigator>
  );
};

// Tab Navigator with new 5-tab layout
const TabNavigator = () => {
  return (
    <FilterProvider>
      <GlobalTouchHandler>
        <View style={{ flex: 1 }}>
          <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.text.tertiary,
          }}
        >
        {/* 探索 - 原活动内容 */}
        <Tab.Screen 
          name="Explore" 
          component={HomeNavigator}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route);
            console.log('Current route name:', routeName); // 调试信息
            return {
              tabBarStyle: {
                display: routeName === 'ActivityDetail' ? 'none' : 'flex',
              },
            };
          }}
        />
        {/* 咨询 - 原探索位置 */}
        <Tab.Screen 
          name="Consulting" 
          component={ConsultingScreen}
        />
        {/* 社区 - 新增 */}
        <Tab.Screen 
          name="Community" 
          component={CommunityScreen}
        />
        {/* 安心 - 原志愿者位置，集成志愿者功能 */}
        <Tab.Screen 
          name="Wellbeing" 
          component={WellbeingNavigator}
          options={({ route }) => ({
            tabBarStyle: {
              display: getFocusedRouteNameFromRoute(route) === 'SchoolDetail' ? 'none' : 'flex',
            },
          })}
        />
        {/* 个人 - 重构为2×2卡片布局 */}
        <Tab.Screen 
          name="Profile" 
          component={ProfileNavigator}
          options={({ route }) => ({
            tabBarStyle: {
              display: getFocusedRouteNameFromRoute(route) === 'ProfileHome' ? 'flex' : 'none',
            },
          })}
        />
        </Tab.Navigator>
        
        {/* 全局悬浮AI助手按钮 - 已修复并重新启用 */}
        <ErrorBoundary>
          <FloatingAIButton />
        </ErrorBoundary>
      </View>
      </GlobalTouchHandler>
    </FilterProvider>
  );
};

// ProfileScreen is now imported from separate file

// Root Navigator
export const AppNavigator = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const isAuthenticated = await vitaGlobalAPI.isAuthenticated();
        setUserToken(isAuthenticated ? 'authenticated' : null);
      } catch (error) {
        console.error('Error checking login status:', error);
        setUserToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <UserProvider>
      <LanguageProvider>
        <ThemeProvider>
          <NavigationContainer>
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Main Tab Navigator (default) */}
          <RootStack.Screen name="Main" component={TabNavigator} />
          
          {/* Auth Stack */}
          <RootStack.Screen 
            name="Auth" 
            component={AuthNavigator}
            options={{
              animationEnabled: false,
            }}
          />
          
          {/* Global Screens */}
          <RootStack.Screen 
            name="QRScanner" 
            component={QRScannerScreenWithProvider}
            options={{
              presentation: 'modal',
            }}
          />
          
          {/* Other Auth Screens that can be accessed from Main */}
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="RegisterChoice" component={RegisterChoiceScreen} />
          <RootStack.Screen name="RegisterForm" component={RegisterFormScreen} />
          <RootStack.Screen name="Verification" component={VerificationScreen} />
        </RootStack.Navigator>
        </NavigationContainer>
        </ThemeProvider>
      </LanguageProvider>
    </UserProvider>
  );
};