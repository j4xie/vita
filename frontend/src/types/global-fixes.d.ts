/**
 * Global Type Fixes and Augmentations
 * TypeScript 2025 - Global scope enhancements
 */

import { UserPermissions } from './user';

declare global {
  /**
   * Form data types for registration screens
   */
  interface ParentNormalFormData {
    userName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    agreeToTerms: boolean;
    childrenInfo?: Array<{
      name: string;
      school: string;
      grade: string;
    }>;
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
  }

  /**
   * Missing function declarations
   */
  function canOperateTargetUser(
    currentUserId: string | number,
    targetUserId: string | number,
    currentUserRole?: string
  ): boolean;

  /**
   * Enhanced console for development (2025 pattern)
   */
  interface Console {
    success(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    table(data: any, columns?: string[]): void;
    time(label?: string): void;
    timeEnd(label?: string): void;
    group(label?: string): void;
    groupEnd(): void;
  }

  /**
   * React Native specific global types
   */
  namespace ReactNative {
    interface DimensionValue extends String {}
    interface ColorValue extends String {}
  }

  /**
   * Legacy permission compatibility
   */
  interface LegacyPermissions {
    canViewDetails: boolean;
    canViewContact: boolean;
    canViewActivities: boolean;
    canViewStudentId?: boolean;
    canViewFullProfile?: boolean;
    [key: string]: any;
  }

  /**
   * Type conversion helpers (2025 pattern)
   */
  function toLegacyPermissions(permissions: UserPermissions): LegacyPermissions;
  function fromLegacyPermissions(legacy: LegacyPermissions): UserPermissions;
}

/**
 * Module augmentations for missing imports
 */
declare module 'react' {
  export const useEffect: typeof React.useEffect;
  export const useCallback: typeof React.useCallback;
  export const useMemo: typeof React.useMemo;
  export const useState: typeof React.useState;
  export const useRef: typeof React.useRef;
  export const useContext: typeof React.useContext;
}

declare module 'react-i18next' {
  interface UseTranslationResponse {
    t: (key: string, options?: any) => string;
    i18n: any;
    ready: boolean;
  }

  export function useTranslation(ns?: string): UseTranslationResponse;
}

/**
 * Type gymnastics for complex type conversions (2025)
 */
export type SafeCast<T, U> = T extends U ? T : U;

export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-?: DeepRequired<T[P]>;
} : T;

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type Immutable<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Advanced conditional types (2025)
 */
export type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? A : B;

export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P
  >
}[keyof T];

export type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >
}[keyof T];

/**
 * Type-safe casting utilities
 */
export function safeCast<T, U>(value: T, fallback: U): T | U {
  try {
    return value as unknown as T;
  } catch {
    return fallback;
  }
}

export function forceCast<T>(value: any): T {
  return value as T;
}

export function isType<T>(value: any, guard: (v: any) => v is T): value is T {
  return guard(value);
}

/**
 * React Native style type fixes
 */
export type FlexStyle = {
  flex?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
};

export type ShadowStyle = {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
};

export type TransformStyle = {
  transform?: Array<
    | { perspective: number }
    | { rotate: string }
    | { rotateX: string }
    | { rotateY: string }
    | { rotateZ: string }
    | { scale: number }
    | { scaleX: number }
    | { scaleY: number }
    | { translateX: number }
    | { translateY: number }
    | { skewX: string }
    | { skewY: string }
    | { matrix: number[] }
  >;
};

export type CompleteStyle = FlexStyle & ShadowStyle & TransformStyle & {
  [key: string]: any;
};

export {};