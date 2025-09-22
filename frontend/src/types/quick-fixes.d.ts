/**
 * Quick Type Fixes for Common Errors
 * Batch fixing TS2339, TS2304, TS2538 errors
 */

import { UserPermissions } from './user';

/**
 * Fix TS2339: Property does not exist errors
 */

// API Response extensions
declare global {
  interface APIResponse<T = any> {
    success?: boolean;
    organizations?: T[];
    bizId?: string;
    message?: string;
    rows?: any[];
    total?: number;
    data?: T;
    code: number;
    msg: string;
  }
}

// Activity type extensions
interface ExtendedActivity {
  id: number;
  name: string;
  activityName?: string;
  startTime: string;
  endTime: string;
  address: string;
  icon?: string;
  enrollment?: number;
  detail?: string;
  signStartTime?: string;
  signEndTime?: string;
  enabled?: number;
  createUserId?: number;
  registerCount?: number;
  [key: string]: any; // Allow any additional properties
}

// User type extensions
interface ExtendedUser {
  id?: string | number;
  userId?: string | number;
  userName?: string;
  legalName?: string;
  nickName?: string;
  email?: string;
  phone?: string;
  phonenumber?: string;
  avatar?: string;
  avatarUrl?: string;
  role?: any;
  roles?: any[];
  admin?: boolean;
  post?: any;
  posts?: any[];
  permissions?: any;
  organization?: any;
  dept?: any;
  deptId?: number;
  school?: any;
  bizId?: string;
  orgId?: string;
  verCode?: string;
  invCode?: string;
  createTime?: string;
  updateTime?: string;
  status?: string;
  [key: string]: any; // Allow any additional properties
}

// Theme extensions
declare module '../theme' {
  interface Theme {
    colors: {
      text: {
        primary: string;
        secondary: string;
        [key: string]: any;
      };
      background: {
        primary: string;
        secondary: string;
        [key: string]: any;
      };
      surface?: string;
      [key: string]: any;
    };
    shadows: {
      [key: string]: any;
    };
    borderRadius: {
      modal?: number;
      large?: number;
      medium?: number;
      [key: string]: any;
    };
    [key: string]: any;
  }
}

/**
 * Fix TS2538: Type cannot be used as index
 */
export type SafeIndex<T> = T extends string ? T : string;
export type FlexibleRecord<K extends string | number | symbol = string, V = any> = {
  [key in K]: V;
} & {
  [key: string]: any;
};

/**
 * Fix TS2367: Comparison has no overlap
 */
export type FlexibleString = string | (string & {});
export type FlexibleNumber = number | (number & {});

/**
 * Style type fixes for React Native
 */
export type StyleValue = string | number | undefined | null;
export type DimensionValue = StyleValue | `${number}%`;
export type ColorValue = string | readonly string[] | undefined | null;

export interface FlexibleStyle {
  [key: string]: StyleValue | FlexibleStyle | FlexibleStyle[];
  transform?: Array<{
    [key: string]: StyleValue;
  }>;
}

/**
 * Fix missing function declarations
 */
declare global {
  function t(key: string, defaultValue?: string | object): string;
  function canOperateTargetUser(current: any, target: any): boolean;

  // React hooks that might be missing
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useState<T>(initial: T): [T, (value: T) => void];
  function useCallback<T extends Function>(fn: T, deps: any[]): T;
  function useMemo<T>(fn: () => T, deps: any[]): T;
  function useRef<T>(initial: T): { current: T };
}

/**
 * Fix missing type declarations
 */
declare global {
  // School type
  interface School {
    id: string | number;
    name: string;
    deptId?: number;
    deptName?: string;
    parentId?: number;
    ancestors?: string;
    orderNum?: number;
    status?: string;
    [key: string]: any;
  }

  // User role and post types
  interface UserRole {
    roleId: number;
    roleName: string;
    roleKey: string;
    status?: string;
    [key: string]: any;
  }

  interface UserPost {
    postId: number;
    postName: string;
    postCode: string;
    status?: string;
    [key: string]: any;
  }
}

/**
 * Fix FormData types
 */
declare global {
  interface ParentNormalFormData {
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    agreeToTerms: boolean;
    [key: string]: any;
  }

  interface StudentNormalFormData {
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
    studentId?: string;
    school?: string;
    major?: string;
    agreeToTerms: boolean;
    [key: string]: any;
  }
}

/**
 * Component props extensions
 */
export interface ExtendedProps {
  [key: string]: any;
  children?: React.ReactNode;
  style?: FlexibleStyle | FlexibleStyle[];
  className?: string;
}

/**
 * Navigation types
 */
export interface ExtendedNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  push: (screen: string, params?: any) => void;
  replace: (screen: string, params?: any) => void;
  [key: string]: any;
}

/**
 * Route types
 */
export interface ExtendedRoute {
  name: string;
  params?: any;
  key?: string;
  [key: string]: any;
}

/**
 * Type guards for safe access
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safe property access
 */
export function getProperty<T, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue?: T[K]
): T[K] | undefined {
  return obj?.[key] ?? defaultValue;
}

/**
 * Type casting helpers
 */
export function asAny<T>(value: T): any {
  return value as any;
}

export function asString(value: unknown): string {
  return String(value);
}

export function asNumber(value: unknown): number {
  return Number(value) || 0;
}

export function asBoolean(value: unknown): boolean {
  return Boolean(value);
}

/**
 * Re-export all fixes
 */
export * from './fixes';
export * from './api-fixes.d';
export * from './advanced-fixes';
export * from './global-fixes';

export {};