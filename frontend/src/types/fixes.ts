// Note: .d.ts files should not be imported at runtime
// They are only for TypeScript type checking

// Re-export specific types from fixes.d.ts
// Note: UserPermissions is already exported from './user', don't re-export to avoid conflicts
export type {
  LegacyPermissions,
} from './fixes.d';

export { fromLegacyPermissions } from './fixes.d';