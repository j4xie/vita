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
  // 新增强制刷新权限方法
  forceRefreshPermissions: () => Promise<void>;
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

      // 适配响应数据格式
      const adaptedResponse = {
        msg: response.msg || '',
        code: response.code,
        roleIds: response.roleIds || [],
        data: response.data,
        postIds: response.postIds || [],
        roles: response.roles || [],
        posts: response.posts || []
      };
      const adaptedData = adaptUserInfoResponse(adaptedResponse);

      if (adaptedData.success && adaptedData.user) {
        console.log('✅ 用户信息获取成功:', {
          userName: adaptedData.user.userName,
          legalName: adaptedData.user.legalName,
          school: adaptedData.user.school,
          deptId: adaptedData.user.deptId,
          roles: adaptedData.user.roles
        });
        
        setUser(adaptedData.user);
        // 更新权限信息
        updateUserPermissions(adaptedData.user);
        // 缓存用户数据
        await AsyncStorage.setItem('userData', JSON.stringify(adaptedData.user));
      } else {
        console.log('📝 用户未登录或会话已过期:', adaptedData.message || '需要登录');
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
        const adaptedResponse = {
          msg: 'Success',
          code: 200,
          roleIds: userInfo.roleIds || [],
          data: userInfo,
          postIds: userInfo.postIds || [],
          roles: userInfo.roles || [],
          posts: userInfo.posts || []
        };
        const adaptedData = adaptUserInfoResponse(adaptedResponse);
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
      
      // 🔧 为新用户设置默认grid视图偏好
      try {
        const existingLayout = await AsyncStorage.getItem('activity_view_layout');
        if (!existingLayout) {
          // 新用户或没有保存偏好的用户，设置默认为grid
          await AsyncStorage.setItem('activity_view_layout', 'grid');
          console.log('✅ 为新用户设置默认grid视图');
        }
      } catch (error) {
        console.warn('设置默认布局偏好失败:', error);
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

  // 强制刷新权限（用于权限被后端修改后的更新）
  const forceRefreshPermissions = async () => {
    console.log('🔄 [PERMISSION] 强制刷新用户权限...');
    try {
      // 清除本地缓存
      await AsyncStorage.removeItem('userData');
      // 重新获取用户信息
      await refreshUserInfo();
      console.log('✅ [PERMISSION] 权限刷新成功');
    } catch (error) {
      console.error('❌ [PERMISSION] 权限刷新失败:', error);
    }
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
    forceRefreshPermissions,
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