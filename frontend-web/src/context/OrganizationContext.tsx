/**
 * 组织状态管理Context
 * 处理多学联组织切换、权限验证、数据同步等功能
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Organization, 
  UserOrganization, 
  MembershipCard,
  OrganizationSwitchResult,
  OrganizationError
} from '../types/organization';
import { fetchOrganizationList } from '../services/registrationAPI';

// ==================== Context类型定义 ====================

interface OrganizationContextState {
  // 基础状态
  currentOrganization: Organization | null;
  organizations: Organization[];
  userMemberships: UserOrganization[];
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  isSwitching: boolean;
  
  // 数据状态
  lastSyncTime: string | null;
  needsSync: boolean;
  
  // 错误状态
  error: OrganizationError | null;
  
  // 缓存数据
  membershipCards: MembershipCard[];
  availableMerchants: string[]; // 当前组织可用商家ID列表
}

interface OrganizationContextActions {
  // 基础操作
  switchOrganization: (organizationId: string) => Promise<OrganizationSwitchResult>;
  refreshOrganizations: () => Promise<void>;
  
  // 数据管理
  syncUserData: (organizationId?: string) => Promise<void>;
  clearCache: () => Promise<void>;
  
  // 会员卡管理
  updateMembershipCards: (cards: MembershipCard[]) => void;
  addMembershipCard: (card: MembershipCard) => void;
  removeMembershipCard: (cardId: string) => void;
  
  // 权限检查
  hasOrganizationAccess: (organizationId: string) => boolean;
  hasMerchantAccess: (merchantId: string) => boolean;
  
  // 错误处理
  clearError: () => void;
  setError: (error: OrganizationError) => void;
}

type OrganizationContextType = OrganizationContextState & OrganizationContextActions;

// ==================== Action类型定义 ====================

type OrganizationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_SWITCHING'; payload: boolean }
  | { type: 'SET_ORGANIZATIONS'; payload: Organization[] }
  | { type: 'SET_USER_MEMBERSHIPS'; payload: UserOrganization[] }
  | { type: 'SET_CURRENT_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_MEMBERSHIP_CARDS'; payload: MembershipCard[] }
  | { type: 'ADD_MEMBERSHIP_CARD'; payload: MembershipCard }
  | { type: 'REMOVE_MEMBERSHIP_CARD'; payload: string }
  | { type: 'UPDATE_MEMBERSHIP_CARD'; payload: { id: string; updates: Partial<MembershipCard> } }
  | { type: 'SET_AVAILABLE_MERCHANTS'; payload: string[] }
  | { type: 'SET_LAST_SYNC_TIME'; payload: string }
  | { type: 'SET_NEEDS_SYNC'; payload: boolean }
  | { type: 'SET_ERROR'; payload: OrganizationError | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_ALL_DATA' };

// ==================== Reducer ====================

const initialState: OrganizationContextState = {
  currentOrganization: null,
  organizations: [],
  userMemberships: [],
  isLoading: false,
  isInitialized: false,
  isSwitching: false,
  lastSyncTime: null,
  needsSync: false,
  error: null,
  membershipCards: [],
  availableMerchants: [],
};

function organizationReducer(
  state: OrganizationContextState, 
  action: OrganizationAction
): OrganizationContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    case 'SET_SWITCHING':
      return { ...state, isSwitching: action.payload };
    
    case 'SET_ORGANIZATIONS':
      return { ...state, organizations: action.payload };
    
    case 'SET_USER_MEMBERSHIPS':
      return { ...state, userMemberships: action.payload };
    
    case 'SET_CURRENT_ORGANIZATION':
      return { ...state, currentOrganization: action.payload };
    
    case 'SET_MEMBERSHIP_CARDS':
      return { ...state, membershipCards: action.payload };
    
    case 'ADD_MEMBERSHIP_CARD':
      return { 
        ...state, 
        membershipCards: [...state.membershipCards, action.payload] 
      };
    
    case 'REMOVE_MEMBERSHIP_CARD':
      return {
        ...state,
        membershipCards: state.membershipCards.filter(card => card.id !== action.payload)
      };
    
    case 'UPDATE_MEMBERSHIP_CARD':
      return {
        ...state,
        membershipCards: state.membershipCards.map(card => 
          card.id === action.payload.id 
            ? { ...card, ...action.payload.updates }
            : card
        )
      };
    
    case 'SET_AVAILABLE_MERCHANTS':
      return { ...state, availableMerchants: action.payload };
    
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    
    case 'SET_NEEDS_SYNC':
      return { ...state, needsSync: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'CLEAR_ALL_DATA':
      return { ...initialState, isInitialized: true };
    
    default:
      return state;
  }
}

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  CURRENT_ORGANIZATION: '@pomelox:current_organization',
  ORGANIZATIONS: '@pomelox:organizations',
  USER_MEMBERSHIPS: '@pomelox:user_memberships',
  MEMBERSHIP_CARDS: '@pomelox:membership_cards',
  LAST_SYNC_TIME: '@pomelox:last_sync_time',
  AVAILABLE_MERCHANTS: '@pomelox:available_merchants',
} as const;

// ==================== Context创建 ====================

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// ==================== Provider组件 ====================

interface OrganizationProviderProps {
  children: React.ReactNode;
  userId?: string; // 当前用户ID
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ 
  children, 
  userId 
}) => {
  const [state, dispatch] = useReducer(organizationReducer, initialState);

  // ==================== 本地存储操作 ====================

  const loadFromStorage = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Loading organization data from storage...');
      
      // 简化存储加载，避免AggregateError
      const currentOrgData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_ORGANIZATION);
      const organizationsData = await AsyncStorage.getItem(STORAGE_KEYS.ORGANIZATIONS);
      const membershipsData = await AsyncStorage.getItem(STORAGE_KEYS.USER_MEMBERSHIPS);

      // 安全解析数据
      if (organizationsData) {
        try {
          const organizations = JSON.parse(organizationsData);
          dispatch({ type: 'SET_ORGANIZATIONS', payload: organizations });
          console.log('Loaded organizations from storage:', organizations.length);
        } catch (error) {
          console.error('Error parsing organizations data:', error);
        }
      }

      if (membershipsData) {
        try {
          const memberships = JSON.parse(membershipsData);
          dispatch({ type: 'SET_USER_MEMBERSHIPS', payload: memberships });
          console.log('Loaded memberships from storage:', memberships.length);
        } catch (error) {
          console.error('Error parsing memberships data:', error);
        }
      }

      if (currentOrgData) {
        try {
          const currentOrg = JSON.parse(currentOrgData);
          dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: currentOrg });
          console.log('Loaded current org from storage:', currentOrg.name);
        } catch (error) {
          console.error('Error parsing current organization data:', error);
        }
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      console.error('Error loading organization data from storage:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: {
          code: 'UNKNOWN_ERROR',
          message: '加载本地数据失败',
          details: { error }
        }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }, []);

  // ==================== 组织操作 ====================

  const switchOrganization = useCallback(async (organizationId: string): Promise<OrganizationSwitchResult> => {
    try {
      dispatch({ type: 'SET_SWITCHING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // 检查组织是否存在
      const targetOrg = state.organizations.find(org => org.id === organizationId);
      if (!targetOrg) {
        throw new Error('Organization not found');
      }

      // 检查用户权限
      const userMembership = state.userMemberships.find(
        membership => membership.organizationId === organizationId && 
                     membership.isActive &&
                     membership.verificationStatus === 'verified'
      );
      
      if (!userMembership) {
        throw new Error('User has no permission to access this organization');
      }

      // 保存之前的组织
      const previousOrg = state.currentOrganization;

      // 更新当前组织
      dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: targetOrg });
      await saveToStorage(STORAGE_KEYS.CURRENT_ORGANIZATION, targetOrg);

      // 更新用户会员关系状态
      const updatedMemberships = state.userMemberships.map(membership => ({
        ...membership,
        isCurrent: membership.organizationId === organizationId
      }));
      dispatch({ type: 'SET_USER_MEMBERSHIPS', payload: updatedMemberships });
      await saveToStorage(STORAGE_KEYS.USER_MEMBERSHIPS, updatedMemberships);

      // TODO: 在后端实现后，这里应该调用API同步数据
      // await syncUserData(organizationId);

      const result: OrganizationSwitchResult = {
        success: true,
        previousOrganization: previousOrg || undefined,
        newOrganization: targetOrg,
        affectedData: {
          cardsUpdated: 0, // TODO: 实际统计
          activitiesReloaded: true,
          merchantsReloaded: true,
        },
        message: `已切换到 ${targetOrg.displayNameZh}`,
      };

      return result;
    } catch (error) {
      const errorInfo: OrganizationError = {
        code: 'PERMISSION_DENIED',
        message: error instanceof Error ? error.message : 'Organization switch failed',
        details: { organizationId, error }
      };
      
      dispatch({ type: 'SET_ERROR', payload: errorInfo });
      
      return {
        success: false,
        message: errorInfo.message,
        affectedData: {
          cardsUpdated: 0,
          activitiesReloaded: false,
          merchantsReloaded: false,
        }
      };
    } finally {
      dispatch({ type: 'SET_SWITCHING', payload: false });
    }
  }, [state.organizations, state.userMemberships, state.currentOrganization, saveToStorage]);

  const refreshOrganizations = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (userId) {
        // 使用Mock API获取用户组织数据
        // 使用真实API替代MockAPI
        const organizationsResult = await fetchOrganizationList();
        const organizations = organizationsResult.success ? organizationsResult.organizations : [];
        const memberships: UserOrganization[] = [];
        
        dispatch({ type: 'SET_ORGANIZATIONS', payload: organizations });
        dispatch({ type: 'SET_USER_MEMBERSHIPS', payload: memberships });
        
        // 设置当前组织
        const currentMembership = memberships.find(m => m.isCurrent);
        if (currentMembership) {
          const currentOrg = organizations.find(o => o.id === currentMembership.organizationId);
          if (currentOrg) {
            dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: currentOrg });
            await saveToStorage(STORAGE_KEYS.CURRENT_ORGANIZATION, currentOrg);
          }
        }

        // 保存到本地存储
        await Promise.all([
          saveToStorage(STORAGE_KEYS.ORGANIZATIONS, organizations),
          saveToStorage(STORAGE_KEYS.USER_MEMBERSHIPS, memberships),
        ]);
        
      } else {
        // 无用户ID时也使用真实API获取组织数据
        const organizationsResult = await fetchOrganizationList();
        const organizations = organizationsResult.success ? organizationsResult.organizations : [];
        dispatch({ type: 'SET_ORGANIZATIONS', payload: organizations });
      }

      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date().toISOString() });
      await saveToStorage(STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());

    } catch (error) {
      console.error('Error refreshing organizations:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: {
          code: 'NETWORK_ERROR',
          message: '刷新组织数据失败',
          details: { error }
        }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [userId, saveToStorage]);

  // ==================== 数据同步 ====================

  const syncUserData = useCallback(async (organizationId?: string) => {
    try {
      const targetOrgId = organizationId || state.currentOrganization?.id;
      if (!targetOrgId) return;

      // TODO: 实现真实的数据同步逻辑
      console.log('Syncing user data for organization:', targetOrgId);
      
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date().toISOString() });
      dispatch({ type: 'SET_NEEDS_SYNC', payload: false });
    } catch (error) {
      console.error('Error syncing user data:', error);
      dispatch({ type: 'SET_NEEDS_SYNC', payload: true });
    }
  }, [state.currentOrganization]);

  const clearCache = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_ORGANIZATION),
        AsyncStorage.removeItem(STORAGE_KEYS.ORGANIZATIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_MEMBERSHIPS),
        AsyncStorage.removeItem(STORAGE_KEYS.MEMBERSHIP_CARDS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC_TIME),
        AsyncStorage.removeItem(STORAGE_KEYS.AVAILABLE_MERCHANTS),
      ]);
      
      dispatch({ type: 'CLEAR_ALL_DATA' });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  // ==================== 会员卡管理 ====================

  const updateMembershipCards = useCallback((cards: MembershipCard[]) => {
    dispatch({ type: 'SET_MEMBERSHIP_CARDS', payload: cards });
    saveToStorage(STORAGE_KEYS.MEMBERSHIP_CARDS, cards);
  }, [saveToStorage]);

  const addMembershipCard = useCallback((card: MembershipCard) => {
    dispatch({ type: 'ADD_MEMBERSHIP_CARD', payload: card });
    // 保存更新后的完整列表
    const updatedCards = [...state.membershipCards, card];
    saveToStorage(STORAGE_KEYS.MEMBERSHIP_CARDS, updatedCards);
  }, [state.membershipCards, saveToStorage]);

  const removeMembershipCard = useCallback((cardId: string) => {
    dispatch({ type: 'REMOVE_MEMBERSHIP_CARD', payload: cardId });
    // 保存更新后的完整列表
    const updatedCards = state.membershipCards.filter(card => card.id !== cardId);
    saveToStorage(STORAGE_KEYS.MEMBERSHIP_CARDS, updatedCards);
  }, [state.membershipCards, saveToStorage]);

  // ==================== 权限检查 ====================

  const hasOrganizationAccess = useCallback((organizationId: string): boolean => {
    return state.userMemberships.some(
      membership => membership.organizationId === organizationId && 
                   membership.isActive &&
                   membership.verificationStatus === 'verified'
    );
  }, [state.userMemberships]);

  const hasMerchantAccess = useCallback((merchantId: string): boolean => {
    // TODO: 实现真实的商家权限检查逻辑
    // 需要检查当前组织是否与该商家有合作关系
    return state.availableMerchants.includes(merchantId);
  }, [state.availableMerchants]);

  // ==================== 错误处理 ====================

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const setError = useCallback((error: OrganizationError) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // ==================== 初始化效果 ====================

  useEffect(() => {
    console.log('OrganizationProvider initializing with userId:', userId);
    if (userId) {
      loadFromStorage().then(() => {
        // 如果本地存储没有数据，尝试刷新
        if (state.organizations.length === 0) {
          console.log('No local data found, refreshing organizations...');
          refreshOrganizations();
        }
      });
    } else {
      // 没有用户ID时，直接刷新获取静态数据
      refreshOrganizations();
    }
  }, [userId]);

  // 监听数据变化进行调试
  useEffect(() => {
    console.log('Organization state updated:', {
      isInitialized: state.isInitialized,
      currentOrg: state.currentOrganization?.name,
      orgCount: state.organizations.length,
      isLoading: state.isLoading
    });
  }, [state.isInitialized, state.currentOrganization, state.organizations, state.isLoading]);

  // ==================== Context值 ====================

  const contextValue: OrganizationContextType = {
    // 状态
    ...state,
    
    // 操作
    switchOrganization,
    refreshOrganizations,
    syncUserData,
    clearCache,
    updateMembershipCards,
    addMembershipCard,
    removeMembershipCard,
    hasOrganizationAccess,
    hasMerchantAccess,
    clearError,
    setError,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

// ==================== Hook ====================

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

// ==================== 默认导出 ====================

export default OrganizationContext;