/**
 * API Type Fixes using TypeScript 2025
 * Unified API response handling with automatic type inference
 */

import { BackendUserInfo } from './user';
import { UserRoleInfo, SimpleRoleInfo } from './userPermissions';

/**
 * Flexible API Response with 2025 conditional types
 * Automatically handles different API response formats
 */
export type FlexibleAPIResponse<T> = {
  code: number;
  msg: string;
} & (
  | { data: T; success?: boolean }
  | { rows: T extends Array<infer U> ? U[] : T[]; total?: number }
  | { organizations?: T }
  | { bizId?: string; message?: string }
  | T
);

/**
 * Type-safe API response handler with auto-narrowing
 */
export function handleAPIResponse<T>(
  response: unknown
): FlexibleAPIResponse<T> {
  if (!response || typeof response !== 'object') {
    return { code: 500, msg: 'Invalid response' } as FlexibleAPIResponse<T>;
  }
  return response as FlexibleAPIResponse<T>;
}

/**
 * Extract data from flexible API response
 */
export function extractAPIData<T>(
  response: FlexibleAPIResponse<T>
): T | T[] | undefined {
  if ('data' in response) return response.data;
  if ('rows' in response) return response.rows;
  if ('organizations' in response) return response.organizations;
  return undefined;
}

/**
 * Role type compatibility layer (2025 pattern)
 */
export type FlexibleRoleInfo = Partial<UserRoleInfo> & SimpleRoleInfo;

export function createFlexibleRole(
  role: SimpleRoleInfo | UserRoleInfo | any
): FlexibleRoleInfo {
  return {
    key: role.key || role.roleKey || '',
    roleName: role.roleName || role.name || '',
    roleId: role.roleId || role.id,
    roleKey: role.roleKey || role.key,
    roleSort: role.roleSort || 0,
    admin: role.admin || false,
    status: role.status || '0',
  } satisfies FlexibleRoleInfo;
}

/**
 * Activity type fixes
 */
export interface FlexibleActivity {
  id: number;
  name: string;
  activityName?: string; // Alias support
  startTime: string;
  endTime: string;
  address: string;
  icon?: string;
  enrollment?: number;
  detail?: string;
  signStartTime?: string;
  signEndTime?: string;
  [key: string]: any; // Allow additional properties
}

/**
 * User info response adapter
 */
export interface FlexibleUserInfoResponse {
  msg: string;
  code: number;
  data?: BackendUserInfo | any;
  roleIds?: number[];
  postIds?: number[];
  roles?: any[];
  posts?: any[];
  success?: boolean;
}

export function adaptUserInfoResponse(
  response: unknown
): FlexibleUserInfoResponse {
  const res = response as any;
  return {
    msg: res.msg || '',
    code: res.code || 200,
    data: res.data || res,
    roleIds: res.roleIds || [],
    postIds: res.postIds || [],
    roles: res.roles || [],
    posts: res.posts || [],
    success: res.code === 200,
  };
}

/**
 * Organization API response fixes
 */
export interface FlexibleOrganizationResponse<T> {
  code: number;
  msg?: string;
  success?: boolean;
  organizations?: T[];
  data?: T | T[];
}

export function extractOrganizations<T>(
  response: FlexibleOrganizationResponse<T>
): T[] {
  if (response.organizations) return response.organizations;
  if (Array.isArray(response.data)) return response.data;
  if (response.data) return [response.data];
  return [];
}

/**
 * Type guards with auto-inference (2025)
 */
export function hasData<T>(
  response: any
): response is { data: T } {
  return 'data' in response && response.data !== undefined;
}

export function hasRows<T>(
  response: any
): response is { rows: T[]; total?: number } {
  return 'rows' in response && Array.isArray(response.rows);
}

export function isSuccessResponse(
  response: any
): response is { code: 200; success: true } {
  return response.code === 200 || response.success === true;
}

/**
 * Dimension value type fix for React Native
 */
export type FlexibleDimensionValue = string | number | `${number}%` | undefined;

/**
 * Style type fixes
 */
export type FlexibleColorValue = string | readonly string[] | undefined;

export type FlexibleTransform = Array<
  | { scale: number }
  | { rotate: string }
  | { translateX: number }
  | { translateY: number }
  | { scaleX: number }
  | { scaleY: number }
  | { rotateX: string }
  | { rotateY: string }
  | { rotateZ: string }
  | { perspective: number }
  | { skewX: string }
  | { skewY: string }
>;

/**
 * Default style type for animations
 */
export interface FlexibleDefaultStyle {
  opacity?: number;
  transform?: FlexibleTransform;
  [key: string]: any;
}

/**
 * Brand array type for theme colors (2025)
 */
export type BrandColorArray = readonly string[] | string[];

export interface FlexibleThemeColors {
  brand: BrandColorArray;
  background: BrandColorArray;
  card: BrandColorArray;
  [key: string]: BrandColorArray | any;
}

/**
 * Global type augmentations for better inference
 */
declare global {
  /**
   * Augment API response types
   */
  interface APIResponse<T> extends FlexibleAPIResponse<T> {}

  /**
   * Augment dimension types
   */
  type DimensionValue = FlexibleDimensionValue;

  /**
   * Augment color types
   */
  type ColorValue = FlexibleColorValue;

  /**
   * Augment animation types
   */
  type DefaultStyle = FlexibleDefaultStyle;
}

export {};