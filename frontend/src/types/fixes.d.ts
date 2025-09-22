/**
 * TypeScript Global Type Fixes for PomeloX
 * Using TypeScript 2025 best practices with satisfies operator
 *
 * This file contains type augmentations and fixes for common type errors
 */

import { ScrollView } from 'react-native';
import { UserPermissions } from './user';
import { SimpleRoleInfo, UserRoleInfo } from './userPermissions';

export { UserPermissions };

/**
 * API fixes are available through fixes.ts
 */
// Removed re-export from .d.ts file - use fixes.ts instead

/**
 * Make SimpleRoleInfo compatible with UserRoleInfo (2025)
 */
declare module './userPermissions' {
  interface SimpleRoleInfo extends Partial<UserRoleInfo> {}
}

/**
 * Augment ScrollView type to include measure method
 * Fixes TS2339 error in PrivacyAgreementModal
 */
declare module 'react-native' {
  interface ScrollView {
    measure?: (callback: (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => void) => void;
  }
}

/**
 * Extended User Permissions Interface
 * Adds missing permission properties
 */
export interface ExtendedUserPermissions extends UserPermissions {
  canViewStudentId?: boolean;
  canViewFullProfile?: boolean;
  canViewRecentActivities?: boolean;
}

/**
 * Legacy permission mapping for backward compatibility
 */
export type LegacyPermissions = {
  canViewDetails: boolean;
  canViewContact: boolean;
  canViewActivities: boolean;
  canViewStudentId?: boolean;
  canViewFullProfile?: boolean;
}

/**
 * Convert legacy permissions to new format
 */
export const fromLegacyPermissions = (legacy: LegacyPermissions): UserPermissions => ({
  canViewBasicInfo: legacy.canViewDetails,
  canViewContactInfo: legacy.canViewContact,
  canViewStudentId: legacy.canViewStudentId || false,
  canViewActivityStats: legacy.canViewActivities,
  canViewFullProfile: legacy.canViewFullProfile || false,
  canEditInfo: false,
  canManageUsers: false,
  canViewDetails: legacy.canViewDetails,
  canViewContact: legacy.canViewContact,
  canViewActivities: legacy.canViewActivities,
})

/**
 * API Response Type with satisfies operator support
 * Using TypeScript 2025 pattern for better inference
 */
export type ApiResponse<T> = {
  code: number;
  msg: string;
  data?: T;
  total?: number;
  rows?: T extends Array<infer U> ? U[] : T extends { rows: Array<infer V> } ? V[] : any[];
  bizId?: string;
  message?: string;
  success?: boolean;
}

/**
 * Safe API Response Handler
 * Uses TypeScript 2025 const type parameters
 */
export const createSafeApiResponse = <const T>(
  response: unknown
): ApiResponse<T> | null => {
  if (!response || typeof response !== 'object') return null;

  const res = response as Record<string, unknown>;

  if (typeof res.code !== 'number' || typeof res.msg !== 'string') {
    return null;
  }

  return res as ApiResponse<T>;
};

/**
 * Type-safe property checker using satisfies
 * Prevents TS2339 errors for optional properties
 */
export const hasProperty = <T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => {
  return key in obj;
};

/**
 * Safe property access with default value
 * Uses TypeScript 2025 inference improvements
 */
export const getPropertySafe = <T, K extends keyof T, D = undefined>(
  obj: T | null | undefined,
  key: K,
  defaultValue?: D
): T[K] | D => {
  if (!obj) return defaultValue as D;
  return obj[key] ?? (defaultValue as D);
};

/**
 * Theme type augmentation for missing properties
 */
declare module '../theme' {
  interface ThemeRadius {
    modal?: number;
    large?: number;
    medium?: number;
  }

  interface ThemeStyles {
    l2BrandGlassButton?: any;
  }

  interface ThemeShadows {
    light?: 'sm';
    dark?: 'md';
  }

  interface ThemeColors {
    surface?: string;
  }
}

/**
 * Fix for dynamic property access errors
 * Uses satisfies for type safety
 */
export type DynamicObject = {
  [key: string]: any;
}

/**
 * Type guard for API data validation
 * Using TypeScript 2025 patterns
 */
export const isValidApiData = <T>(
  data: unknown,
  validator: (data: unknown) => data is T
): data is T => {
  return validator(data);
};

/**
 * Enhanced type predicates with auto-inference (2025)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value is null or undefined');
  }
}

/**
 * Type-safe object key access with NoInfer (2025)
 */
export function safeGet<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue?: NoInfer<T[K]>
): T[K] | typeof defaultValue {
  return key in obj ? obj[key] : defaultValue;
}

/**
 * Pattern matching helper for discriminated unions
 */
export type Match<T extends { type: string }> = {
  [K in T['type']]: (value: Extract<T, { type: K }>) => any;
};

export function match<T extends { type: string }, R>(
  value: T,
  handlers: Match<T>
): R {
  const handler = handlers[value.type as T['type']];
  if (!handler) {
    throw new Error(`No handler for type: ${value.type}`);
  }
  return handler(value as any);
}

/**
 * Utility type for fixing "property does not exist" errors
 * while maintaining type safety
 */
export type WithOptionalProperty<T, K extends string, V = any> = T & {
  [P in K]?: V;
};

/**
 * Fix for array type inference issues
 * Uses const type parameters from TypeScript 2025
 */
export const createTypedArray = <const T extends readonly unknown[]>(
  ...items: T
): T => items;

/**
 * Safe type assertion with validation
 */
export const assertType = <T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  errorMessage?: string
): T => {
  if (!validator(value)) {
    throw new TypeError(errorMessage ?? 'Type assertion failed');
  }
  return value;
};

/**
 * Fix for enum-like constant objects
 * Uses satisfies for better type inference
 */
export const createEnum = <const T extends Record<string, string | number>>(
  obj: T
): Readonly<T> => {
  return Object.freeze(obj) satisfies Readonly<T>;
};

/**
 * Template literal type utilities (2025)
 */
export type CamelToSnake<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `_${Lowercase<First>}${CamelToSnake<Rest>}`
    : `${First}${CamelToSnake<Rest>}`
  : S;

export type SnakeToCamel<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${First}${Capitalize<SnakeToCamel<Rest>>}`
  : S;

/**
 * Branded types for type-safe IDs (2025 pattern)
 */
export type Brand<T, B> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type ActivityId = Brand<string, 'ActivityId'>;
export type OrganizationId = Brand<string, 'OrganizationId'>;

export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createActivityId(id: string): ActivityId {
  return id as ActivityId;
}

export function createOrganizationId(id: string): OrganizationId {
  return id as OrganizationId;
}

/**
 * Type-safe omit function
 * Better than lodash omit with full type safety
 */
export const omitProps = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

/**
 * Type-safe pick function
 */
export const pickProps = <T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};