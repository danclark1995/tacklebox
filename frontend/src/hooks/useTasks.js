/**
 * useTasks Hook — Stub
 * Will provide task data and actions to components.
 * Implementation in Phase 1B.
 */

export default function useTasks() {
  return {
    tasks: [],
    isLoading: true,
    error: null,
    fetchTasks: async () => {},
    createTask: async () => {},
    updateTask: async () => {},
  }
}
