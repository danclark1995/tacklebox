/**
 * useProjects Hook — Stub
 * Will provide project data and actions to components.
 * Implementation in Phase 1B.
 */

export default function useProjects() {
  return {
    projects: [],
    isLoading: true,
    error: null,
    fetchProjects: async () => {},
    createProject: async () => {},
  }
}
