/**
 * Unified Type System for PomeloX Frontend
 * TypeScript 2025 Best Practices
 *
 * This is the main entry point for all type definitions and utilities
 */

// Core type definitions
export * from './user';
export * from './userPermissions';
export * from './activity';
export * from './organization';

// Type fixes and enhancements (2025 features)
export * from './fixes';
// Note: .d.ts files are not exported here as they shouldn't be imported at runtime

// Re-export commonly used types for convenience
export type {
  BaseUserInfo,
  FrontendUser,
  BackendUserInfo,
  UserPermissions,
  UserContextData,
} from './user';

export type {
  PermissionLevel,
  UserRoleInfo,
  SimpleRoleInfo,
} from './userPermissions';

// Re-export utility functions
export {
  // User utilities
  hasPermission,
  getUserPrimaryRole,
  isBackendUser,
  isFrontendUser,
} from './user';

export {
  // Permission utilities
  getUserPermissionLevel,
} from './userPermissions';

// Note: API utility functions should be imported from their actual implementation files
// not from .d.ts declaration files

// Note: Advanced utilities available via direct import from './advanced-fixes'

// Note: Basic utilities available via direct import from './fixes'

// Type aliases for better DX (2025 pattern)
export type ID = string | number;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;
export type ValueOf<T> = T[keyof T];
export type Entries<T> = [keyof T, ValueOf<T>][];

/**
 * Global type augmentations using 2025 patterns
 */
declare global {
  /**
   * Enhanced console with typed methods
   */
  interface Console {
    success(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
  }

  /**
   * Type-safe setTimeout and setInterval
   */
  function setTimeout<Args extends any[]>(
    handler: (...args: Args) => void,
    timeout?: number,
    ...args: Args
  ): NodeJS.Timeout;

  function setInterval<Args extends any[]>(
    handler: (...args: Args) => void,
    timeout?: number,
    ...args: Args
  ): NodeJS.Timeout;

  /**
   * Enhanced Promise with better error typing
   */
  interface PromiseConstructor {
    allSettled<T extends readonly unknown[] | []>(
      values: T
    ): Promise<{
      -readonly [P in keyof T]: PromiseSettledResult<
        T[P] extends PromiseLike<infer U> ? U : T[P]
      >;
    }>;
  }
}

// Ensure module is treated as a module
export {};