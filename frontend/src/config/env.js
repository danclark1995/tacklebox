/**
 * TackleBox Environment Configuration
 *
 * All env-specific values in config. Nothing hardcoded.
 * Dev/prod detected automatically; values overridable via env vars.
 */

const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

const config = {
  // Environment
  isDev,
  isProd,
  environment: isDev ? 'development' : 'production',

  // API
  apiUrl: import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8787' : 'https://tacklebox-api.square-sunset-3584.workers.dev'),
  apiVersion: 'v1',

  // App
  appName: 'TackleBox',
  appUrl: import.meta.env.VITE_APP_URL || (isDev ? 'http://localhost:5173' : 'https://tacklebox-3mu.pages.dev'),

  // Feature flags (for progressive rollout)
  features: {
    aiEnabled: import.meta.env.VITE_FEATURE_AI === 'true' || false,
    gamificationEnabled: true,
    onboardingEnabled: true,
  },
}

/**
 * Get the full API endpoint URL
 * @param {string} path - API path (e.g., '/users', '/tasks/123')
 * @returns {string} Full URL
 */
export function apiEndpoint(path) {
  const base = config.isDev ? '' : config.apiUrl
  return `${base}/api/${config.apiVersion}${path}`
}

export default config
