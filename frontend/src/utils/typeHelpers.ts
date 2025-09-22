/**
 * Type Helper Utilities using TypeScript 2025 Features
 * Runtime type checking and conversion utilities
 */

import type {
  FlexibleAPIResponse,
  FlexibleActivity,
  FlexibleRoleInfo,
  FlexibleUserInfoResponse
} from '../types/api-fixes';

/**
 * Safe API data extractor with type narrowing (2025)
 */
export function safeExtractData<T>(response: any): T | undefined {
  // Check for various API response patterns
  if (response?.data !== undefined) return response.data;
  if (response?.rows !== undefined) return response.rows;
  if (response?.organizations !== undefined) return response.organizations;
  if (response?.bizId !== undefined) return response as T;
  return undefined;
}

/**
 * Transform any activity format to FlexibleActivity (2025 pattern)
 */
export function normalizeActivity(activity: any): FlexibleActivity {
  return {
    id: activity.id || activity.activityId || 0,
    name: activity.name || activity.activityName || '',
    activityName: activity.activityName || activity.name,
    startTime: activity.startTime || activity.beginTime || '',
    endTime: activity.endTime || activity.finishTime || '',
    address: activity.address || activity.location || '',
    icon: activity.icon,
    enrollment: activity.enrollment,
    detail: activity.detail,
    signStartTime: activity.signStartTime,
    signEndTime: activity.signEndTime,
    ...activity, // Preserve any additional fields
  } satisfies FlexibleActivity;
}

/**
 * Safe boolean converter with type predicate (2025)
 */
export function toBoolean(value: unknown): value is boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Type-safe array converter with auto-inference
 */
export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

/**
 * Safe number parser with validation
 */
export function toNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}

/**
 * Type-safe string converter
 */
export function toString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

/**
 * Deep merge objects with type safety (2025)
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      target[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      target[key] = sourceValue as T[typeof key];
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Type guard for objects
 */
function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Safe JSON stringify with circular reference handling
 */
export function safeStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    },
    space
  );
}

/**
 * Type-safe localStorage wrapper
 */
export const storage = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save to localStorage: ${e}`);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

/**
 * Debounce function with TypeScript 2025 inference
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function with proper typing
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, delay * Math.pow(backoff, i))
        );
      }
    }
  }

  throw lastError!;
}

/**
 * Type-safe event emitter (2025 pattern)
 */
export class TypedEventEmitter<Events extends Record<string, any>> {
  private events: Partial<Record<keyof Events, Array<(data: any) => void>>> = {};

  on<K extends keyof Events>(
    event: K,
    listener: (data: Events[K]) => void
  ): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(listener);
  }

  off<K extends keyof Events>(
    event: K,
    listener: (data: Events[K]) => void
  ): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event]!.filter(l => l !== listener);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    if (!this.events[event]) return;
    this.events[event]!.forEach(listener => listener(data));
  }

  once<K extends keyof Events>(
    event: K,
    listener: (data: Events[K]) => void
  ): void {
    const wrapper = (data: Events[K]) => {
      listener(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

/**
 * Create a type-safe enum from const assertion (2025)
 */
export function createConstEnum<const T extends Record<string, string | number>>(
  obj: T
): Readonly<T> {
  return Object.freeze(obj);
}

/**
 * Pipe function for functional composition (2025)
 */
export function pipe<A, B>(
  fn1: (a: A) => B
): (a: A) => B;
export function pipe<A, B, C>(
  fn1: (a: A) => B,
  fn2: (b: B) => C
): (a: A) => C;
export function pipe<A, B, C, D>(
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D
): (a: A) => D;
export function pipe(...fns: Array<(a: any) => any>) {
  return (x: any) => fns.reduce((v, f) => f(v), x);
}

/**
 * Compose function for reverse functional composition
 */
export function compose<A, B>(
  fn1: (a: A) => B
): (a: A) => B;
export function compose<A, B, C>(
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => C;
export function compose<A, B, C, D>(
  fn3: (c: C) => D,
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => D;
export function compose(...fns: Array<(a: any) => any>) {
  return (x: any) => fns.reduceRight((v, f) => f(v), x);
}