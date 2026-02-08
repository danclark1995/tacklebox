/**
 * useTimeTracking Hook — Stub
 * Will provide time tracking data and actions to components.
 * Implementation in Phase 1C.
 */

export default function useTimeTracking() {
  return {
    entries: [],
    totalMinutes: 0,
    isLoading: true,
    error: null,
    logTime: async () => {},
    updateEntry: async () => {},
    deleteEntry: async () => {},
  }
}
