import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserPermissions {
  canAccessVolunteerFeatures: boolean;
  isOrganizer: boolean;
  isAdmin: boolean;
  schoolId?: string;
  organizationId?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  verified: boolean;
  schoolId?: string;
  organizationId?: string;
  permissions: UserPermissions;
}

interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  permissions: UserPermissions;
  isLoading: boolean;
  login: (userData: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  updatePermissions: (newPermissions: Partial<UserPermissions>) => void;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

const defaultPermissions: UserPermissions = {
  canAccessVolunteerFeatures: false,
  isOrganizer: false,
  isAdmin: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      
      if (userData && userToken) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        // Mock user data for development
        const mockUser: UserProfile = {
          id: 'mock-user-1',
          email: 'student@columbia.edu',
          name: '张同学',
          verified: true,
          schoolId: 'cu',
          organizationId: 'cu-cssa',
          permissions: {
            canAccessVolunteerFeatures: true, // Enable for demo purposes
            isOrganizer: true,
            isAdmin: false,
            schoolId: 'cu',
            organizationId: 'cu-cssa',
          },
        };
        setUser(mockUser);
        // Save mock data
        await AsyncStorage.setItem('userData', JSON.stringify(mockUser));
        await AsyncStorage.setItem('userToken', 'mock-token');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: UserProfile) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('userToken', 'logged-in-token');
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  };

  const updatePermissions = (newPermissions: Partial<UserPermissions>) => {
    if (user) {
      const updatedUser = {
        ...user,
        permissions: {
          ...user.permissions,
          ...newPermissions,
        },
      };
      setUser(updatedUser);
      AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return user?.permissions[permission] === true;
  };

  const contextValue: UserContextType = {
    user,
    isAuthenticated: !!user,
    permissions: user?.permissions || defaultPermissions,
    isLoading,
    login,
    logout,
    updatePermissions,
    hasPermission,
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