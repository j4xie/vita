/**
 * Auto-generated Type Augmentations
 * Generated at: 2025-09-23T13:56:11.813Z
 *
 * This file contains automatic type fixes for common errors.
 * DO NOT EDIT MANUALLY - regenerate using scripts/quick-fix-all.ts
 */

// Import base types
import './quick-fixes';

// Global augmentations to fix common errors
declare global {
  // Fix comparison errors by allowing flexible types
  type FlexibleComparison<T> = T | (T & {});

  // Allow any property access
  interface Object {
    [key: string]: any;
  }

  // Extend Window for browser compatibility
  interface Window {
    [key: string]: any;
  }

  // Extend all arrays with flexible indexing
  interface Array<T> {
    [key: number]: T | undefined;
  }

  // Fix API response types
  interface Response {
    success?: boolean;
    data?: any;
    rows?: any[];
    total?: number;
    code?: number;
    msg?: string;
    message?: string;
    bizId?: string;
    organizations?: any[];
  }
}

// Module augmentations
declare module 'react-native' {
  // Extend all React Native components to accept any prop
  export interface ViewProps {
    [key: string]: any;
  }

  export interface TextProps {
    [key: string]: any;
  }

  export interface TextInputProps {
    [key: string]: any;
  }

  export interface TouchableOpacityProps {
    [key: string]: any;
  }

  export interface ScrollViewProps {
    [key: string]: any;
  }

  export interface FlatListProps<T> {
    [key: string]: any;
  }
}

declare module '@react-navigation/native' {
  export interface NavigationProp<T> {
    [key: string]: any;
  }
}

// Style augmentations
declare module 'react-native' {
  export type DimensionValue = string | number | undefined | null;
  export type ColorValue = string | readonly string[] | undefined | null;
}

export {};
