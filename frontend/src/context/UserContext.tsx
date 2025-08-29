import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pomeloXAPI } from '../services/PomeloXAPI';
import { adaptUserInfoResponse, FrontendUser } from '../utils/userAdapter';
import { 
  isLoggedIn, 
  getUserInfo as getAuthUserInfo, 
  clearUserSession,
  getCurrentToken
} from '../services/authAPI';
import { 
  createPermissionChecker, 
  PermissionChecker,
  PermissionLevel,
  getUserPermissionLevel
} from '../types/userPermissions';
import { activityStatsService } from '../services/activityStatsService';

interface UserPermissions {
  canAccessVolunteerFeatures: boolean;
  isOrganizer: boolean;
  isAdmin: boolean;
  schoolId?: string;
  organizationId?: string;
}

interface UserContextType {
  user: FrontendUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
  hasPermission: (permission: keyof FrontendUser['permissions']) => boolean;
  // 新增权限检查功能
  permissions: PermissionChecker;
  permissionLevel: PermissionLevel;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('guest');
  const [permissions, setPermissions] = useState<PermissionChecker>(createPermissionChecker(null));

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const authenticated = await isLoggedIn();
      
      if (authenticated) {
        // 用户已登录，获取用户信息
        await refreshUserInfo();
      } else {
        // 用户未登录
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserInfo = async () => {
    try {
      setIsLoading(true);
      
      // 使用新的authAPI获取用户信息
      const response = await getAuthUserInfo();
      const adaptedData = adaptUserInfoResponse(response);
      
      if (adaptedData.success && adaptedData.user) {
        setUser(adaptedData.user);
        // 更新权限信息
        updateUserPermissions(adaptedData.user);
        // 缓存用户数据
        await AsyncStorage.setItem('userData', JSON.stringify(adaptedData.user));
      } else {
        console.error('获取用户信息失败:', adaptedData.message);
        setUser(null);
        setPermissionLevel('guest');
        setPermissions(createPermissionChecker(null));
        // 如果获取用户信息失败，可能token已过期，清除会话
        await clearUserSession();
      }
    } catch (error) {
      console.error('获取用户信息错误:', error);
      setUser(null);
      // 清除可能无效的会话信息
      await clearUserSession();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userInfo?: any) => {
    try {
      // 如果已经有用户信息，直接使用
      if (userInfo) {
        const adaptedData = adaptUserInfoResponse({ code: 200, data: userInfo });
        if (adaptedData.success && adaptedData.user) {
          setUser(adaptedData.user);
          await AsyncStorage.setItem('userData', JSON.stringify(adaptedData.user));
          // 更新权限信息
          updateUserPermissions(adaptedData.user);
        }
      } else {
        // 从登录响应中获取userId，然后获取完整用户信息
        await refreshUserInfo();
      }
    } catch (error) {
      console.error('Failed to get user info after login:', error);
      throw error;
    }
  };

  // 更新用户权限信息
  const updateUserPermissions = (userData: any) => {
    try {
      const level = getUserPermissionLevel(userData);
      const checker = createPermissionChecker(userData);
      
      setPermissionLevel(level);
      setPermissions(checker);
      
      console.log('✅ 用户权限已更新:', {
        userName: userData.userName,
        permissionLevel: level,
        isAdmin: checker.isAdmin(),
        hasVolunteerAccess: checker.hasVolunteerManagementAccess(),
        canCheckInOut: checker.canCheckInOut(),
        rawUserData: {
          admin: userData.admin,
          roles: userData.roles?.map((r: any) => ({ roleKey: r.roleKey, roleName: r.roleName })),
          posts: userData.posts?.map((p: any) => ({ postCode: p.postCode, postName: p.postName }))
        }
      });
    } catch (error) {
      console.error('更新用户权限失败:', error);
      setPermissionLevel('guest');
      setPermissions(createPermissionChecker(null));
    }
  };

  const logout = async () => {
    try {
      // 清除当前用户的活动统计数据
      if (user?.id) {
        await activityStatsService.clearUserLocalData(user.id);
      }
      
      setUser(null);
      setPermissionLevel('guest');
      setPermissions(createPermissionChecker(null));
      await clearUserSession(); // 使用新的authAPI清除会话
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const hasPermission = (permission: keyof FrontendUser['permissions']): boolean => {
    return user?.permissions[permission] ?? false;
  };

  const contextValue: UserContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUserInfo,
    hasPermission,
    // 新增权限相关
    permissions,
    permissionLevel,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};