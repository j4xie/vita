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
import { createPermissionChecker } from '../types/userPermissions';
import { pageTransitions } from '../utils/animations';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';
import { FilterProvider } from '../context/FilterContext';
import { VolunteerProvider } from '../context/VolunteerContext';
import { shouldShowTabBar, mustHideTabBar } from '../config/tabBarConfig';

// Screens
import { ActivityDetailScreen } from '../screens/activities/ActivityDetailScreen';
import { ActivityRegistrationFormScreen } from '../screens/activities/ActivityRegistrationFormScreen';
import { AIFormFillerScreen } from '../screens/activities/AIFormFillerScreen';
import { PointsMallHomeScreen } from '../screens/rewards/PointsMallHomeScreen';
import { PointsMallListScreen } from '../screens/rewards/PointsMallListScreen';
import { PointsMallDetailScreen } from '../screens/rewards/PointsMallDetailScreen';
import { OrderConfirmScreen } from '../screens/rewards/OrderConfirmScreen';
import { PaymentResultScreen } from '../screens/rewards/PaymentResultScreen';
import { AddressListScreen } from '../screens/rewards/AddressListScreen';
import { AddressEditScreen } from '../screens/rewards/AddressEditScreen';
import { AddressSelectScreen } from '../screens/rewards/AddressSelectScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { SetNewPasswordScreen } from '../screens/auth/SetNewPasswordScreen';
import { RegisterChoiceScreen } from '../screens/auth/RegisterChoiceScreen';
import { IdentityChoiceScreen } from '../screens/auth/IdentityChoiceScreen';
import { ParentInvitationRegisterScreen } from '../screens/auth/ParentInvitationRegisterScreen';
import { ParentNormalRegisterScreen } from '../screens/auth/ParentNormalRegisterScreen';
import { ParentNormalRegisterStep1Screen } from '../screens/auth/ParentNormalRegisterStep1Screen';
import { ParentNormalRegisterStep2Screen } from '../screens/auth/ParentNormalRegisterStep2Screen';
import { StudentInvitationRegisterScreen } from '../screens/auth/StudentInvitationRegisterScreen';
import { StudentNormalRegisterStep1Screen } from '../screens/auth/StudentNormalRegisterStep1Screen';
import { StudentNormalRegisterStep2Screen } from '../screens/auth/StudentNormalRegisterStep2Screen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { QRScannerScreen } from '../screens/common/QRScannerScreen';
import { QRScanResultScreen } from '../screens/common/QRScanResultScreen';
import { CalendarSelectionScreen } from '../screens/common/CalendarSelectionScreen';
// Profile Screens
import { ProfileHomeScreen } from '../screens/profile/ProfileHomeScreen';
// import { AccountSecurityScreen } from '../screens/profile/AccountSecurityScreen'; // 文件已删除
import { NotificationScreen } from '../screens/profile/NotificationScreen';
import { GeneralScreen } from '../screens/profile/GeneralScreen';
import { AboutSupportScreen } from '../screens/profile/AboutSupportScreen';
import { LanguageSelectionScreen } from '../screens/profile/LanguageSelectionScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ActivityLayoutSelectionScreen } from '../screens/profile/ActivityLayoutSelectionScreen';
import { PersonalQRScreen } from '../screens/profile/PersonalQRScreen';
// Cards Screens
import { MyCardsScreen } from '../screens/cards/MyCardsScreen';
// Organization Provider
import { OrganizationProvider } from '../context/OrganizationContext'; // 暂时注释功能，保留接口
// Other Tab Screens
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { ConsultingScreen } from '../screens/consulting/ConsultingScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { CommunityEventsScreen } from '../screens/community/CommunityEventsScreen';
// import { SchoolMerchantsScreen } from '../screens/community/SchoolMerchantsScreen'; // TODO: Create this screen
import { WellbeingScreen } from '../screens/wellbeing/WellbeingScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { VolunteerHomeScreen } from '../screens/volunteer/VolunteerHomeScreen';
import { VolunteerCheckOutScreen } from '../screens/volunteer/VolunteerCheckOutScreen';
import { VolunteerSchoolListScreen } from '../screens/volunteer/VolunteerSchoolListScreen';
import { VolunteerSchoolDetailScreen } from '../screens/volunteer/VolunteerSchoolDetailScreen';
import { VolunteerHistoryScreen } from '../screens/volunteer/VolunteerHistoryScreen';
import { TimeEntryScreen } from '../screens/volunteer/TimeEntryScreen';
import { FloatingAIButton } from '../components/common/FloatingAIButton';
import { FloatingFilterButton } from '../components/community/FloatingFilterButton';
import { GlobalTouchHandler } from '../components/common/GlobalTouchHandler';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { TermsScreen } from '../screens/legal/TermsScreen';
import { AIChatScreen } from '../screens/AIChatScreen';

// Stack Navigators
const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const WellbeingStack = createStackNavigator();
const RewardsStack = createStackNavigator();
const CommunityStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthNavigator = () => {
  const { t } = useTranslation();

  return (
    <AuthStack.Navigator
      {...({ id: "auth" } as any)}
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
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="SetNewPassword"
        component={SetNewPasswordScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="RegisterChoice"
        component={RegisterChoiceScreen}
        options={{
          ...pageTransitions.slideFromBottom,
        }}
      />
      <AuthStack.Screen
        name="IdentityChoice"
        component={IdentityChoiceScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="ParentInvitationRegister"
        component={ParentInvitationRegisterScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="ParentNormalRegisterStep1"
        component={ParentNormalRegisterStep1Screen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="ParentNormalRegisterStep2"
        component={ParentNormalRegisterStep2Screen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="StudentInvitationRegister"
        component={StudentInvitationRegisterScreen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="StudentNormalRegisterStep1"
        component={StudentNormalRegisterStep1Screen}
        options={{
          ...pageTransitions.slideFromRight,
        }}
      />
      <AuthStack.Screen
        name="StudentNormalRegisterStep2"
        component={StudentNormalRegisterStep2Screen}
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
      {...({ id: "wellbeing" } as any)}
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
    </WellbeingStack.Navigator>
  );
};

// Rewards Stack Navigator - 积分商城
const RewardsNavigator = () => {
  return (
    <RewardsStack.Navigator
      {...({ id: "rewards" } as any)}
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
      <RewardsStack.Screen
        name="RewardsHome"
        component={PointsMallHomeScreen}
      />
      <RewardsStack.Screen
        name="PointsMallList"
        component={PointsMallListScreen}
        options={{
          headerShown: false,
        }}
      />
      <RewardsStack.Screen
        name="PointsMallDetail"
        component={PointsMallDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <RewardsStack.Screen
        name="OrderConfirm"
        component={OrderConfirmScreen}
        options={{
          headerShown: false,
        }}
      />
      <RewardsStack.Screen
        name="PaymentResult"
        component={PaymentResultScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* 地址管理相关页面 */}
      <RewardsStack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{
          headerShown: false,
        }}
      />
      <RewardsStack.Screen
        name="AddressEdit"
        component={AddressEditScreen}
        options={{
          headerShown: false,
        }}
      />
      <RewardsStack.Screen
        name="AddressSelect"
        component={AddressSelectScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* TODO: 添加更多积分商城相关页面
        - MyPoints (我的积分)
        - ExchangeOrders (兑换记录)
        - Favorites (我的收藏)
        - MyOrders (我的订单)
      */}
    </RewardsStack.Navigator>
  );
};

// Community Stack Navigator - 社区活动
const CommunityNavigator = () => {
  return (
    <CommunityStack.Navigator
      {...({ id: "community" } as any)}
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
      <CommunityStack.Screen
        name="CommunityHome"
        component={CommunityScreen}
      />
      <CommunityStack.Screen
        name="CommunityEvents"
        component={CommunityEventsScreen}
      />
      {/* TODO: SchoolMerchantsScreen not yet implemented
      <CommunityStack.Screen
        name="SchoolMerchants"
        component={SchoolMerchantsScreen}
      />
      */}
    </CommunityStack.Navigator>
  );
};

// Home Stack Navigator
const HomeNavigator = () => {
  return (
    <MainStack.Navigator
      {...({ id: "home" } as any)}
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
        component={ExploreScreen}
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
        name="AIFormFiller"
        component={AIFormFillerScreen}
        options={{
          ...pageTransitions.slideFromRight,
          headerShown: false,
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
      {...({ id: "profile" } as any)}
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
      {/* 地址管理 - 从个人中心访问 */}
      <ProfileStack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{
          headerShown: false,
        }}
      />
      <ProfileStack.Screen
        name="AddressEdit"
        component={AddressEditScreen}
        options={{
          headerShown: false,
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
        name="PersonalQR"
        component={PersonalQRScreen}
        options={{
          headerShown: false,
          ...pageTransitions.slideFromRight,
        }}
      />
      {/* 会员卡功能已隐藏以通过App Store审核 */}
      {/* <ProfileStack.Screen 
        name="MyCards" 
        component={MyCardsScreenWithProvider}
        options={{
          headerShown: false, // MyCardsScreen有自己的header
        }}
      /> */}
      <ProfileStack.Screen
        name="Terms"
        component={TermsScreen}
        options={({ route }) => ({
          title: (route.params as any)?.type === 'privacy' ? t('navigation.headers.privacy_policy') : t('navigation.headers.terms_of_service'),
          ...pageTransitions.slideFromRight,
        })}
      />
      {/* Volunteer Management Screens */}
      <ProfileStack.Screen
        name="VolunteerHome"
        component={VolunteerHomeScreen}
        options={{
          title: t('navigation.headers.volunteer_management'),
          headerShown: false,
        }}
      />
      <ProfileStack.Screen
        name="VolunteerSchoolList"
        component={VolunteerSchoolListScreen}
        options={{
          title: t('navigation.headers.school_list'),
          ...pageTransitions.slideFromRight,
        }}
      />
      <ProfileStack.Screen
        name="VolunteerSchoolDetail"
        component={VolunteerSchoolDetailScreen}
        options={{
          headerShown: false,
          ...pageTransitions.slideFromRight,
        }}
      />
      <ProfileStack.Screen
        name="VolunteerCheckOut"
        component={VolunteerCheckOutScreen}
        options={{
          headerShown: false,
          ...pageTransitions.slideFromRight,
        }}
      />
      <ProfileStack.Screen
        name="VolunteerHistory"
        component={VolunteerHistoryScreen}
        options={{
          headerShown: false,
          ...pageTransitions.slideFromRight,
        }}
      />
    </ProfileStack.Navigator>
  );
};

// Tab Navigator with permission-based layout
const TabNavigator = () => {
  // 追踪当前Tab以控制FloatingSearchButton显示
  const [currentTab, setCurrentTab] = useState('Explore');

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
            {...({ id: "main-tab" } as any)}
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.text.tertiary,
            }}
            screenListeners={{
              state: (e) => {
                // 监听Tab切换事件
                const state = e.data.state;
                if (state && state.index !== undefined && state.routes) {
                  const currentRoute = state.routes[state.index];
                  if (currentRoute && currentRoute.name) {
                    console.log('📱 [TAB-NAVIGATOR] Tab切换到:', currentRoute.name);
                    setCurrentTab(currentRoute.name);
                  }
                }
              },
            }}
          >
            {/* 探索 - 所有用户都可以访问 */}
            <Tab.Screen
              name="Explore"
              component={HomeNavigator}
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

            {/* 社区 - 商家内容与活动 */}
            <Tab.Screen
              name="Community"
              component={CommunityNavigator}
              options={({ route }) => {
                const routeName = getFocusedRouteNameFromRoute(route) ?? 'CommunityHome';
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

            {/* 会员 - 积分商城·优惠券·会员系统 (中心突出Tab) */}
            <Tab.Screen
              name="Rewards"
              component={RewardsNavigator}
              options={({ route }) => {
                const routeName = getFocusedRouteNameFromRoute(route) ?? 'RewardsHome';

                console.log('📱 [TAB-CONTROL] Rewards Tab:', {
                  routeName,
                  forcedDisplay: 'flex'
                });

                // 强制显示TabBar - 会员中心应该始终显示TabBar
                return {
                  tabBarStyle: {
                    display: 'flex',
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
              component={ProfileNavigator}
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

          {/* 全局悬浮AI助手按钮 */}
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
          <VolunteerProvider>
            <NavigationContainer>
              <RootStack.Navigator
                {...({ id: "root" } as any)}
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
                    headerShown: false,
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

                {/* Search Screen - 独立搜索页面 */}
                <RootStack.Screen
                  name="Search"
                  component={SearchScreen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />

                {/* Calendar Selection Screen - 日历选择页面 */}
                <RootStack.Screen
                  name="CalendarSelection"
                  component={CalendarSelectionScreen}
                  options={{
                    presentation: 'modal',
                    ...pageTransitions.slideFromBottom,
                  }}
                />

                {/* Time Entry Screen - 时间补录页面 */}
                <RootStack.Screen
                  name="TimeEntry"
                  component={TimeEntryScreen}
                  options={{
                    presentation: 'modal',
                    ...pageTransitions.slideFromBottom,
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
                  name="ForgotPassword"
                  component={ForgotPasswordScreen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />
                <RootStack.Screen
                  name="SetNewPassword"
                  component={SetNewPasswordScreen}
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
                  name="IdentityChoice"
                  component={IdentityChoiceScreen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />
                <RootStack.Screen
                  name="ParentInvitationRegister"
                  component={ParentInvitationRegisterScreen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />
                <RootStack.Screen
                  name="ParentNormalRegisterStep1"
                  component={ParentNormalRegisterStep1Screen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />
                <RootStack.Screen
                  name="ParentNormalRegisterStep2"
                  component={ParentNormalRegisterStep2Screen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />
                <RootStack.Screen
                  name="StudentInvitationRegister"
                  component={StudentInvitationRegisterScreen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />
                <RootStack.Screen
                  name="StudentNormalRegisterStep1"
                  component={StudentNormalRegisterStep1Screen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />
                <RootStack.Screen
                  name="StudentNormalRegisterStep2"
                  component={StudentNormalRegisterStep2Screen}
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

                {/* Legal Screens */}
                <RootStack.Screen
                  name="Terms"
                  component={TermsScreen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />

                {/* AI Chat Screen */}
                <RootStack.Screen
                  name="AIChat"
                  component={AIChatScreen}
                  options={{
                    ...pageTransitions.slideFromRight,
                  }}
                />

              </RootStack.Navigator>
            </NavigationContainer>
          </VolunteerProvider>
        </ThemeProvider>
      </LanguageProvider>
    </UserProvider>
  );
};