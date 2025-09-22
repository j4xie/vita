// Note: .d.ts files should not be imported at runtime
// They are only for TypeScript type checking

// Re-export specific types from fixes.d.ts
export type {
  LegacyPermissions,
  UserPermissions,
} from './fixes.d';

export { fromLegacyPermissions } from './fixes.d';