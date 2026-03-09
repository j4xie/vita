/**
 * useMembershipLevel Hook
 * 会员等级数据 Hook
 *
 * 供 PointsMallHomeScreen 和 ProfileHomeScreen 共用
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserExLevelInfo, UserExLevelInfo } from '../services/membershipAPI';
import { useUser } from '../context/UserContext';

interface UseMembershipLevelReturn {
  membershipLevel: UserExLevelInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useMembershipLevel = (userId?: number | string): UseMembershipLevelReturn => {
  const { user, isAuthenticated } = useUser();
  const [membershipLevel, setMembershipLevel] = useState<UserExLevelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveUserId = userId || user?.userId || user?.id;

  const fetchMembershipLevel = useCallback(async () => {
    if (!isAuthenticated || !effectiveUserId) {
      setMembershipLevel(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getUserExLevelInfo(effectiveUserId);
      setMembershipLevel(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load membership level';
      setError(message);
      // Use warn instead of error to avoid LogBox overlay in dev mode
      console.warn('[useMembershipLevel]', message);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, isAuthenticated]);

  useEffect(() => {
    fetchMembershipLevel();
  }, [fetchMembershipLevel]);

  return {
    membershipLevel,
    loading,
    error,
    refresh: fetchMembershipLevel,
  };
};

export default useMembershipLevel;
