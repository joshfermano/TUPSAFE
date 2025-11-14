/**
 * useAuth Hook Compatibility Wrapper
 *
 * This hook provides a compatibility layer for components that were using
 * the old mock AuthContext. It wraps the new RealAuthProvider and maintains
 * the same interface.
 */

import { useRealAuth } from '@/context/RealAuthContext';

/**
 * Compatibility wrapper for useAuth
 * Maintains the same interface as the old mock auth system
 */
export function useAuth() {
  return useRealAuth();
}

export default useAuth;
