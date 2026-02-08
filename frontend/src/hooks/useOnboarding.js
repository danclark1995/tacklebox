/**
 * useOnboarding Hook — Stub
 * Will manage onboarding wizard state for first-login clients.
 * Implementation in Phase 1D.
 */

export default function useOnboarding() {
  return {
    isOnboarding: false,
    currentStep: 0,
    totalSteps: 4,
    nextStep: () => {},
    prevStep: () => {},
    completeOnboarding: async () => {},
    skipOnboarding: async () => {},
  }
}
