/**
 * Permission Helper Functions
 * TypeScript 2025 - Runtime permission checking utilities
 */

import { FrontendUser } from '../types/user';
import { PermissionLevel } from '../types/userPermissions';

/**
 * Check if current user can operate on target user
 * Uses TypeScript 2025 type predicates
 */
export function canOperateTargetUser(
  currentUser: FrontendUser | null | undefined,
  targetUser: FrontendUser | { userId?: string | number } | null | undefined
): boolean {
  // No current user means no permissions
  if (!currentUser) return false;

  // No target user means can't operate
  if (!targetUser) return false;

  // Admin can operate on anyone
  if (currentUser.permissionLevel === 'manage') return true;

  // Part manager can operate on users in their organization
  if (currentUser.permissionLevel === 'part_manage') {
    // Check if same organization
    if ('organization' in currentUser && 'organization' in targetUser) {
      return currentUser.organization?.id === targetUser.organization?.id;
    }
    // For now, part managers can operate on users without org info
    return true;
  }

  // Staff can only operate on themselves
  if (currentUser.permissionLevel === 'staff') {
    const currentId = String(currentUser.userId || currentUser.id);
    const targetId = String(targetUser.userId || (targetUser as any).id);
    return currentId === targetId;
  }

  // Common users can't operate on others
  return false;
}

/**
 * Check if user has minimum permission level
 * TypeScript 2025 pattern with const assertion
 */
export function hasMinimumPermission(
  user: FrontendUser | null,
  requiredLevel: PermissionLevel
): boolean {
  if (!user) return false;

  const levelHierarchy = {
    'manage': 4,
    'part_manage': 3,
    'staff': 2,
    'common': 1,
    'guest': 0,
  } as const satisfies Record<PermissionLevel, number>;

  const userLevel = levelHierarchy[user.permissionLevel] ?? 0;
  const required = levelHierarchy[requiredLevel] ?? 0;

  return userLevel >= required;
}

/**
 * Get permission display name
 * Using template literal types (2025)
 */
export function getPermissionDisplayName(
  level: PermissionLevel,
  language: 'zh' | 'en' = 'zh'
): string {
  const displayNames = {
    zh: {
      manage: '超级管理员',
      part_manage: '分管理员',
      staff: '内部员工',
      common: '普通用户',
      guest: '访客',
    },
    en: {
      manage: 'Super Admin',
      part_manage: 'Partial Admin',
      staff: 'Staff',
      common: 'User',
      guest: 'Guest',
    },
  } as const;

  return displayNames[language][level] ?? level;
}

/**
 * Check if user can perform action
 * Using discriminated unions (2025)
 */
type Action =
  | { type: 'view'; resource: 'user' | 'activity' | 'volunteer' }
  | { type: 'edit'; resource: 'user' | 'activity' | 'volunteer' }
  | { type: 'delete'; resource: 'user' | 'activity' | 'volunteer' }
  | { type: 'create'; resource: 'user' | 'activity' | 'volunteer' }
  | { type: 'checkIn'; resource: 'volunteer' }
  | { type: 'checkOut'; resource: 'volunteer' };

export function canPerformAction(
  user: FrontendUser | null,
  action: Action
): boolean {
  if (!user) return false;

  // Type-safe action checking with pattern matching
  switch (action.type) {
    case 'view':
      // Everyone can view
      return true;

    case 'edit':
      switch (action.resource) {
        case 'user':
          return hasMinimumPermission(user, 'part_manage');
        case 'activity':
          return hasMinimumPermission(user, 'part_manage');
        case 'volunteer':
          return hasMinimumPermission(user, 'staff');
        default:
          return false;
      }

    case 'delete':
      // Only admins can delete
      return hasMinimumPermission(user, 'manage');

    case 'create':
      switch (action.resource) {
        case 'user':
          return hasMinimumPermission(user, 'manage');
        case 'activity':
          return hasMinimumPermission(user, 'part_manage');
        case 'volunteer':
          return hasMinimumPermission(user, 'part_manage');
        default:
          return false;
      }

    case 'checkIn':
    case 'checkOut':
      return hasMinimumPermission(user, 'staff');

    default:
      // Exhaustive check (2025 pattern)
      const _exhaustive: never = action;
      return false;
  }
}

/**
 * Create permission context for UI
 * Using TypeScript 2025 satisfies operator
 */
export function createPermissionContext(user: FrontendUser | null) {
  return {
    canViewUsers: canPerformAction(user, { type: 'view', resource: 'user' }),
    canEditUsers: canPerformAction(user, { type: 'edit', resource: 'user' }),
    canDeleteUsers: canPerformAction(user, { type: 'delete', resource: 'user' }),
    canCreateUsers: canPerformAction(user, { type: 'create', resource: 'user' }),

    canViewActivities: canPerformAction(user, { type: 'view', resource: 'activity' }),
    canEditActivities: canPerformAction(user, { type: 'edit', resource: 'activity' }),
    canDeleteActivities: canPerformAction(user, { type: 'delete', resource: 'activity' }),
    canCreateActivities: canPerformAction(user, { type: 'create', resource: 'activity' }),

    canViewVolunteers: canPerformAction(user, { type: 'view', resource: 'volunteer' }),
    canEditVolunteers: canPerformAction(user, { type: 'edit', resource: 'volunteer' }),
    canCheckInVolunteers: canPerformAction(user, { type: 'checkIn', resource: 'volunteer' }),
    canCheckOutVolunteers: canPerformAction(user, { type: 'checkOut', resource: 'volunteer' }),

    isAdmin: user?.permissionLevel === 'manage',
    isPartAdmin: user?.permissionLevel === 'part_manage',
    isStaff: user?.permissionLevel === 'staff',
    isCommon: user?.permissionLevel === 'common',
  } satisfies Record<string, boolean>;
}

// Export for global use
if (typeof global !== 'undefined') {
  (global as any).canOperateTargetUser = canOperateTargetUser;
}