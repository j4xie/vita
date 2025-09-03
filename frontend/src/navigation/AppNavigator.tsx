import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { pomeloXAPI } from '../services/PomeloXAPI';
import { theme } from '../theme';
import { CustomTabBar } from '../components/navigation/CustomTabBar';
import { SimpleSearchTabBar } from '../components/navigation/SimpleSearchTabBar';
import { useUser, UserProvider } from '../context/UserContext';
import { pageTransitions } from '../utils/animations';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { FilterProvider } from '../context/FilterContext';

// Screens
import { ActivityListScreen } from '../screens/activities/ActivityListScreen';
import { ActivityDetailScreen } from '../screens/activities/ActivityDetailScreen';
import { ActivityRegistrationFormScreen } from '../screens/activities/ActivityRegistrationFormScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterChoiceScreen } from '../screens/auth/RegisterChoiceScreen';
import { RegisterFormScreen } from '../screens/auth/RegisterFormScreen';
import { RegisterStep1Screen } from '../screens/auth/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/auth/RegisterStep2Screen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { QRScannerScreen } from '../screens/common/QRScannerScreen';
// Profile Screens
import { ProfileHomeScreen } from '../screens/profile/ProfileHomeScreen';
// import { AccountSecurityScreen } from '../screens/profile/AccountSecurityScreen'; // 文件已删除
import { NotificationScreen } from '../screens/profile/NotificationScreen';
import { GeneralScreen } from '../screens/profile/GeneralScreen';
import { AboutSupportScreen } from '../screens/profile/AboutSupportScreen';
import { LanguageSelectionScreen } from '../screens/profile/LanguageSelectionScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ActivityLayoutSelectionScreen } from '../screens/profile/ActivityLayoutSelectionScreen';
// Cards Screens
import { MyCardsScreen } from '../screens/cards/MyCardsScreen';
// Organization Provider
import { OrganizationProvider } from '../context/OrganizationContext'; // 暂时注释功能，保留接口
// Other Tab Screens
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { ConsultingScreen } from '../screens/consulting/ConsultingScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { WellbeingScreen } from '../screens/wellbeing/WellbeingScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import SchoolDetailScreen from '../screens/wellbeing/SchoolDetailScreen';
import { VolunteerCheckInScreen } from '../screens/volunteer/VolunteerCheckInScreen';
import { FloatingAIButton } from '../components/common/FloatingAIButton';
import { GlobalTouchHandler } from '../components/common/GlobalTouchHandler';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { TermsScreen } from '../screens/legal/TermsScreen';

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
      <AuthStack.Screen 
        name="Terms" 
        component={TermsScreen}
        options={({ route }) => ({
          headerShown: true,
          title: (route.params as any)?.type === 'privacy' ? '隐私政策' : '服务条款',
          headerStyle: {
            backgroundColor: '#f2f2f7',
            shadowOpacity: 0,
            elevation: 0,
          },
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
          },
          headerBackTitle: '返回',
          ...pageTransitions.slideFromRight,
        })}
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
      <MainStack.Screen 
        name="ActivityRegistrationForm" 
        component={ActivityRegistrationFormScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
    </MainStack.Navigator>
  );
};

// MyCards Screen - 启用组织Provider以支持会员卡功能
const MyCardsScreenWithProvider = () => {
  const { user } = useUser();
  return (
    <OrganizationProvider userId={user?.id || "guest"}>
      <MyCardsScreen />
    </OrganizationProvider>
  );
};

// QRScanner Screen - 启用组织Provider以支持扫码功能  
const QRScannerScreenWithProvider = () => {
  const { user } = useUser();
  return (
    <OrganizationProvider userId={user?.id || "guest"}>
      <QRScannerScreen />
    </OrganizationProvider>
  );
};

// Profile Stack Navigator
const ProfileNavigator = () => {
  // 移除Provider外部的翻译调用
  // const { t } = useTranslation();
  
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
        headerBackTitle: '返回',
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
      {/* AccountSecurity功能已移除
      <ProfileStack.Screen 
        name="AccountSecurity" 
        component={AccountSecurityScreen}
        options={{
          title: '账户安全',
        }}
      />
      */}
      <ProfileStack.Screen 
        name="Notifications" 
        component={NotificationScreen}
        options={{
          title: '通知设置',
        }}
      />
      <ProfileStack.Screen 
        name="General" 
        component={GeneralScreen}
        options={{
          title: '通用设置',
        }}
      />
      <ProfileStack.Screen 
        name="AboutSupport" 
        component={AboutSupportScreen}
        options={{
          title: '关于和支持',
        }}
      />
      <ProfileStack.Screen 
        name="LanguageSelection" 
        component={LanguageSelectionScreen}
        options={{
          title: '语言设置',
        }}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          title: '编辑资料',
        }}
      />
      <ProfileStack.Screen 
        name="ActivityLayoutSelection" 
        component={ActivityLayoutSelectionScreen}
        options={{
          title: '布局选择',
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="MyCards" 
        component={MyCardsScreenWithProvider}
        options={{
          headerShown: false, // MyCardsScreen有自己的header
        }}
      />
      <ProfileStack.Screen 
        name="Terms" 
        component={TermsScreen}
        options={({ route }) => ({
          title: (route.params as any)?.type === 'privacy' ? '隐私政策' : '服务条款',
          ...pageTransitions.slideFromRight,
        })}
      />
    </ProfileStack.Navigator>
  );
};

// Tab Navigator with permission-based layout
const TabNavigator = () => {
  const { permissions, user } = useUser();
  
  console.log('🔍 [TABS] 渲染Tab导航，用户权限:', {
    hasUser: !!user,
    permissionLevel: permissions.getPermissionLevel(),
    hasVolunteerAccess: permissions.hasVolunteerManagementAccess(),
    isAdmin: permissions.isAdmin(),
    isStaff: permissions.isStaff()
  });
  
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
        {/* 探索 - 所有用户都可以访问 */}
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
        
        {/* 社区咨询 - 所有用户都可以访问 */}
        <Tab.Screen 
          name="Community" 
          component={CommunityScreen}
        />
        
        {/* 安心/志愿者 - 仅staff及以上可以访问 */}
        {permissions.hasVolunteerManagementAccess() && (
          <Tab.Screen 
            name="Wellbeing" 
            component={WellbeingNavigator}
            options={({ route }) => ({
              tabBarStyle: {
                display: getFocusedRouteNameFromRoute(route) === 'SchoolDetail' ? 'none' : 'flex',
              },
            })}
          />
        )}
        
        {/* 个人 - 所有用户都可以访问 */}
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
  // 移除Provider外部的翻译调用
  // const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const isAuthenticated = await pomeloXAPI.isAuthenticated();
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
        <Text>Loading...</Text>
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
          
          {/* Search Screen - 独立搜索页面 */}
          <RootStack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          
          {/* Global Activity Screens - 可以从任何地方访问的活动页面 */}
          <RootStack.Screen 
            name="ActivityDetail" 
            component={ActivityDetailScreen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          <RootStack.Screen 
            name="ActivityRegistrationForm" 
            component={ActivityRegistrationFormScreen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          
          {/* Global Auth Screens - 可以从任何地方访问的认证页面 */}
          <RootStack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          <RootStack.Screen 
            name="RegisterChoice" 
            component={RegisterChoiceScreen}
            options={{
              ...pageTransitions.slideFromBottom,
            }}
          />
          <RootStack.Screen 
            name="RegisterForm" 
            component={RegisterFormScreen}
            options={{
              ...pageTransitions.fade,
            }}
          />
          <RootStack.Screen 
            name="Verification" 
            component={VerificationScreen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          
          {/* Legal Screens */}
          <RootStack.Screen 
            name="Terms" 
            component={TermsScreen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          
        </RootStack.Navigator>
        </NavigationContainer>
        </ThemeProvider>
      </LanguageProvider>
    </UserProvider>
  );
};