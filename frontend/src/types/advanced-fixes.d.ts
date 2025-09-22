/**
 * Advanced TypeScript 2025 Type Fixes
 * Using latest features: NoInfer, satisfies, template literals, branded types
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Exhaustive type checking with pattern matching (2025)
 */
export type Exhaustive<T> = T extends never ? true : false;

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Deep readonly with satisfies (2025 pattern)
 */
export type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

export const deepFreeze = <T>(obj: T): DeepReadonly<T> => {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  return obj as DeepReadonly<T>;
};

/**
 * Type-safe event emitter with template literals (2025)
 */
export type EventMap = Record<string, any>;

export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T> = (params: T) => void;

export interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

/**
 * Advanced discriminated union helpers (2025)
 */
export type DiscriminatedUnion<K extends PropertyKey, T extends Record<K, any>> = T;

export type ExtractUnion<T, K extends PropertyKey, V> = T extends Record<K, V> ? T : never;

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Type-safe API client with NoInfer (2025)
 */
export interface APIClient<Endpoints extends Record<string, any>> {
  get<K extends keyof Endpoints & string>(
    endpoint: K,
    params?: NoInfer<Endpoints[K]['params']>
  ): Promise<Endpoints[K]['response']>;

  post<K extends keyof Endpoints & string>(
    endpoint: K,
    body: NoInfer<Endpoints[K]['body']>
  ): Promise<Endpoints[K]['response']>;
}

/**
 * Advanced type guards with auto-narrowing (2025)
 */
export const isNotNull = <T>(value: T | null): value is T => {
  return value !== null;
};

export const isNotUndefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Type-safe JSON parsing (2025 pattern)
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

export const parseJSON = <T = JSONValue>(text: string): T => {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new TypeError(`Invalid JSON: ${error}`);
  }
};

/**
 * Advanced mapped type utilities (2025)
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PickRequired<T> = Pick<T, RequiredKeys<T>>;
export type PickOptional<T> = Pick<T, OptionalKeys<T>>;

/**
 * Tuple utilities with template literals (2025)
 */
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...any[]]
  ? H
  : never;

export type Tail<T extends readonly unknown[]> = T extends readonly [any, ...infer R]
  ? R
  : [];

export type Length<T extends readonly unknown[]> = T['length'];

export type Reverse<T extends readonly unknown[]> = T extends readonly [...infer R, infer L]
  ? [L, ...Reverse<R>]
  : [];

/**
 * Advanced path types for nested objects (2025)
 */
export type Path<T, Key extends keyof T = keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ? `${Key}` | `${Key}.${Path<T[Key]>}`
    : `${Key}`
  : never;

export type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

/**
 * Type-safe builder pattern (2025)
 */
export type Builder<T> = {
  [K in keyof T]-?: (value: T[K]) => Builder<T>;
} & {
  build(): T;
};

/**
 * Advanced async type utilities (2025)
 */
export type Awaitable<T> = T | Promise<T>;
export type Promisify<T> = T extends Promise<any> ? T : Promise<T>;
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Type-safe environment variables (2025 pattern)
 */
export interface ProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  [key: string]: string | undefined;
}

export const getEnvVar = <K extends keyof ProcessEnv>(
  key: K,
  defaultValue?: NoInfer<ProcessEnv[K]>
): ProcessEnv[K] => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${String(key)} is not defined`);
  }
  return (value ?? defaultValue) as ProcessEnv[K];
};

/**
 * Advanced React prop types (2025)
 */
export type PropsWithClassName<T = {}> = T & {
  className?: string;
};

export type PropsWithStyle<T = {}> = T & {
  style?: Record<string, any>;
};

export type PropsWithChildren<T = {}> = T & {
  children?: React.ReactNode;
};

/**
 * Type-safe style utilities
 */
export type StyleValue = string | number | undefined;
export type StyleObject = Record<string, StyleValue>;

export const mergeStyles = (...styles: (StyleObject | undefined)[]): StyleObject => {
  return styles.filter(isDefined).reduce((acc, style) => ({
    ...acc,
    ...style,
  }), {});
};

/**
 * Global type augmentations
 */
declare global {
  interface ObjectConstructor {
    keys<T extends object>(obj: T): (keyof T & string)[];
    entries<T extends object>(obj: T): [keyof T & string, T[keyof T]][];
  }

  interface Array<T> {
    includes(searchElement: any, fromIndex?: number): searchElement is T;
  }
}

export {};