/**
 * useAuth Hook — Stub
 * Will provide auth state and actions to components.
 * Implementation in Phase 1B.
 */

export default function useAuth() {
  // Stub — will be implemented with auth context
  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    logout: () => {},
    hasRole: () => false,
  }
}
