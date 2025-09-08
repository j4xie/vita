import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import WebStorageService from '../services/WebStorageService';
import { pomeloXAPI } from '../services/PomeloXAPI';

import { theme } from '../theme';
import { CustomTabBar } from '../components/navigation/CustomTabBar';
import { SimpleSearchTabBar } from '../components/navigation/SimpleSearchTabBar';
import { useUser, UserProvider } from '../context/UserContext';
import { createPermissionChecker } from '../types/userPermissions';

import { pageTransitions } from '../utils/animations';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { FilterProvider } from '../context/FilterContext';

import { shouldShowTabBar, mustHideTabBar } from '../config/tabBarConfig';

// Web端存储适配器
const AsyncStorage = new WebStorageService('local');

// Screens
import { BeautifulActivityListScreen as ActivityListScreen } from '../screens/activities/ActivityListScreen.beautiful';
import { ActivityDetailScreen } from '../screens/activities/ActivityDetailScreen';
import { ActivityRegistrationFormScreen } from '../screens/activities/ActivityRegistrationFormScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterChoiceScreen } from '../screens/auth/RegisterChoiceScreen';
import { RegisterFormScreen } from '../screens/auth/RegisterFormScreen';
import { RegisterStep1Screen } from '../screens/auth/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/auth/RegisterStep2Screen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { QRScannerScreen } from '../screens/common/QRScannerScreen';
import { QRScanResultScreen } from '../screens/common/QRScanResultScreen';
// Profile Screens
import { ProfileHomeScreen } from '../screens/profile/ProfileHomeScreen';
// import { AccountSecurityScreen } from '../screens/profile/AccountSecurityScreen'; // 文件已删除
import { NotificationScreen } from '../screens/profile/NotificationScreen';
import { GeneralScreen } from '../screens/profile/GeneralScreen';
import { AboutSupportScreen } from '../screens/profile/AboutSupportScreen';
import { LanguageSelectionScreen } from '../screens/profile/LanguageSelectionScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ActivityLayoutSelectionScreen } from '../screens/profile/ActivityLayoutSelectionScreen';
import { UserDetailScreen } from '../screens/profile/UserDetailScreen';
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
import { ScrollDebugHelper } from '../components/debug/ScrollDebugHelper';
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
  const { t } = useTranslation();
  
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
        initialParams={{ hideCustomHeader: true }}
        options={({ route }) => ({
          headerShown: true,
          title: (route.params as any)?.type === 'privacy' ? t('navigation.headers.privacy_policy') : t('navigation.headers.terms_of_service'),
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
      <MainStack.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{
          ...pageTransitions.fade,
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
        name="ActivityLayoutSelection" 
        component={ActivityLayoutSelectionScreen}
        options={{
          title: t('navigation.headers.layout_selection'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen 
        name="Terms" 
        component={TermsScreen}
        options={({ route }) => ({
          headerShown: false,
          title: (route.params as any)?.type === 'privacy' ? t('navigation.headers.privacy_policy') : t('navigation.headers.terms_of_service'),
          ...pageTransitions.slideFromRight,
        })}
      />
    </ProfileStack.Navigator>
  );
};

// Tab Navigator with permission-based layout
const TabNavigator = () => {
  // 🚨 安全检查：防止UserProvider初始化问题
  let permissions, user;
  try {
    const userContext = useUser();
    permissions = userContext.permissions;
    user = userContext.user;
  
    console.log('🔍 [TABS] 渲染Tab导航，用户权限:', {
      hasUser: !!user,
      permissionLevel: permissions.getPermissionLevel(),
      hasVolunteerAccess: permissions.hasVolunteerManagementAccess(),
      isAdmin: permissions.isAdmin(),
      isStaff: permissions.isStaff()
    });
  } catch (error) {
    console.error('🚨 [TAB-NAVIGATOR] UserProvider错误:', error);
    // 降级处理：使用默认权限
    permissions = createPermissionChecker(null);
    user = null;
  }
  
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
          component={ActivityListScreen}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'ActivityList';
            
            // 🛡️ 双重保护：先检查是否必须隐藏，再检查是否应该显示
            const mustHide = mustHideTabBar(routeName);
            const shouldShow = !mustHide && shouldShowTabBar(routeName);
            
            console.log('📱 [TAB-CONTROL] Explore Tab:', { 
              routeName, 
              mustHide, 
              shouldShow, 
              finalDisplay: shouldShow ? 'flex' : 'none' 
            });
            
            return {
              tabBarStyle: {
                display: shouldShow ? 'flex' : 'none',
              },
            };
          }}
        />
        
        {/* 社区咨询 - 所有用户都可以访问 */}
        <Tab.Screen 
          name="Community" 
          component={CommunityScreen}
          options={() => {
            const routeName = 'Community';
            const mustHide = mustHideTabBar(routeName);
            const shouldShow = !mustHide && shouldShowTabBar(routeName);
            
            console.log('📱 [TAB-CONTROL] Community Tab:', { routeName, mustHide, shouldShow });
            
            return {
              tabBarStyle: {
                display: shouldShow ? 'flex' : 'none',
              },
            };
          }}
        />
        
        {/* 安心 - 所有用户都可以访问，内部根据权限显示不同功能 */}
        <Tab.Screen 
          name="Wellbeing" 
          component={WellbeingNavigator}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'WellbeingHome';
            
            // 🛡️ 双重保护：防止意外显示TabBar
            const mustHide = mustHideTabBar(routeName);
            const shouldShow = !mustHide && shouldShowTabBar(routeName);
            
            console.log('📱 [TAB-CONTROL] Wellbeing Tab:', { 
              routeName, 
              mustHide, 
              shouldShow,
              finalDisplay: shouldShow ? 'flex' : 'none'
            });
            
            return {
              tabBarStyle: {
                display: shouldShow ? 'flex' : 'none',
              },
            };
          }}
        />
        
        {/* 个人 - 所有用户都可以访问 */}
        <Tab.Screen 
          name="Profile" 
          component={ProfileHomeScreen}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProfileHome';
            
            // 🛡️ 关键保护：Profile子页面绝对不能显示TabBar
            const mustHide = mustHideTabBar(routeName);
            const shouldShow = !mustHide && shouldShowTabBar(routeName);
            
            console.log('📱 [TAB-CONTROL] Profile Tab:', { 
              routeName, 
              mustHide, 
              shouldShow,
              finalDisplay: shouldShow ? 'flex' : 'none'
            });
            
            return {
              tabBarStyle: {
                display: shouldShow ? 'flex' : 'none',
              },
            };
          }}
        />
        </Tab.Navigator>
        
        {/* 全局悬浮AI助手按钮 - 已修复并重新启用 */}
        <ErrorBoundary>
          <FloatingAIButton />
        </ErrorBoundary>

        {/* Web端滚动调试工具 - 已关闭 */}
        {/* <ScrollDebugHelper /> */}
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
          
          <RootStack.Screen
            name="QRScanResult"
            component={QRScanResultScreen}
            options={{
              headerShown: false,
              ...pageTransitions.slideFromRight,
            }}
          />
          
          <RootStack.Screen
            name="UserDetail"
            component={UserDetailScreen}
            options={{
              headerShown: false,
              ...pageTransitions.slideFromRight,
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
            name="RegisterStep1" 
            component={RegisterStep1Screen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          <RootStack.Screen 
            name="RegisterStep2" 
            component={RegisterStep2Screen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          <RootStack.Screen 
            name="Verification" 
            component={VerificationScreen}
            options={{
              ...pageTransitions.slideFromRight,
            }}
          />
          
          {/* Activity Detail - 全局可访问 */}
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

          {/* Profile子页面 - 全局可访问 */}
          <RootStack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{
              headerShown: true,
              title: '编辑个人资料',
              ...pageTransitions.slideFromRight,
            }}
          />
          
          <RootStack.Screen 
            name="Notifications" 
            component={NotificationScreen}
            options={{
              headerShown: true,
              title: '通知设置',
              ...pageTransitions.slideFromRight,
            }}
          />
          
          <RootStack.Screen 
            name="General" 
            component={GeneralScreen}
            options={{
              headerShown: true,
              title: '通用设置',
              ...pageTransitions.slideFromRight,
            }}
          />
          
          <RootStack.Screen 
            name="AboutSupport" 
            component={AboutSupportScreen}
            options={{
              headerShown: true,
              title: '关于与支持',
              ...pageTransitions.slideFromRight,
            }}
          />
          
          <RootStack.Screen 
            name="LanguageSelection" 
            component={LanguageSelectionScreen}
            options={{
              headerShown: true,
              title: '语言设置',
              ...pageTransitions.slideFromRight,
            }}
          />
          
          <RootStack.Screen 
            name="ActivityLayoutSelection" 
            component={ActivityLayoutSelectionScreen}
            options={{
              headerShown: false,
              ...pageTransitions.slideFromRight,
            }}
          />
          
          {/* MyCards Screen - 全局可访问 */}
          <RootStack.Screen 
            name="MyCards" 
            component={MyCardsScreenWithProvider}
            options={{
              headerShown: false,
              ...pageTransitions.slideFromRight,
            }}
          />

          {/* Legal Screens */}
          <RootStack.Screen 
            name="Terms" 
            component={TermsScreen}
            options={{
              headerShown: false,
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