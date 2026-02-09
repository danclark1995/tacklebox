import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, typography, radii, shadows, transitions } from '@/config/tokens'
import Button from '@/components/ui/Button'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'

const STEPS = [
  {
    key: 'welcome',
    heading: (name) => `Welcome to TackleBox, ${name}!`,
    description:
      'TackleBox is your personal creative project hub. Here you can submit tasks, track progress, and access your brand materials.',
    icon: () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={colours.primary[500]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: 'brand',
    heading: () => 'Your Brand Profile',
    description:
      'Your brand profile contains your colours, voice, values, and guidelines. Contractors use this to ensure every deliverable matches your brand.',
    icon: () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={colours.secondary[500]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="19" cy="13" r="2" />
        <circle cx="7" cy="13" r="2" />
        <circle cx="13" cy="19" r="2" />
        <path d="M13.5 9v2" />
        <path d="M10.93 11.07L9 13" />
        <path d="M16.07 11.07L18 13" />
        <path d="M13 17v-2" />
      </svg>
    ),
  },
  {
    key: 'tasks',
    heading: () => 'How to Submit a Task',
    description:
      'Select a project, pick a category, add your brief, and we\'ll handle the rest. You can track progress in real-time.',
    icon: () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={colours.primary[500]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    key: 'brand-hub',
    heading: () => 'Your Brand Hub',
    description:
      'Access your brand guides, style documents, and assets all in one place. Everything stays organized and up-to-date.',
    icon: () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={colours.secondary[500]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
]

const OnboardingWizard = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  const isLastStep = currentStep === STEPS.length - 1
  const step = STEPS[currentStep]

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleSkip = async () => {
    await handleComplete()
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await fetch(apiEndpoint('/users/me/onboarding'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ has_completed_onboarding: true }),
      })
    } catch {
      // Continue even if API fails
    } finally {
      setCompleting(false)
      onComplete()
    }
  }

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colours.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing[4],
    animation: 'fadeIn 300ms ease',
  }

  const cardStyle = {
    backgroundColor: colours.white,
    borderRadius: radii.xl,
    boxShadow: shadows.xl,
    maxWidth: '600px',
    width: '100%',
    overflow: 'hidden',
    animation: 'slideUp 300ms ease',
  }

  const progressContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing[2],
    padding: `${spacing[5]} ${spacing[6]} 0`,
  }

  const getDotStyle = (index) => ({
    width: '10px',
    height: '10px',
    borderRadius: radii.full,
    backgroundColor: index === currentStep
      ? colours.primary[500]
      : index < currentStep
        ? colours.primary[300]
        : colours.neutral[200],
    transition: `all ${transitions.normal}`,
  })

  const contentStyle = {
    padding: `${spacing[8]} ${spacing[8]} ${spacing[6]}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  }

  const iconContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '120px',
    height: '120px',
    borderRadius: radii.full,
    backgroundColor: currentStep % 2 === 0 ? colours.primary[50] : colours.secondary[50],
    marginBottom: spacing[6],
  }

  const headingStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    marginBottom: spacing[3],
    margin: 0,
  }

  const descriptionStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.base,
    color: colours.neutral[600],
    lineHeight: typography.lineHeight.relaxed,
    maxWidth: '460px',
    marginTop: spacing[3],
  }

  const footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing[4]} ${spacing[6]} ${spacing[6]}`,
    borderTop: `1px solid ${colours.neutral[100]}`,
  }

  const stepCounterStyle = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colours.neutral[400],
  }

  const buttonsStyle = {
    display: 'flex',
    gap: spacing[3],
  }

  const displayName = user?.display_name || user?.name || 'there'

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={overlayStyle}>
        <div style={cardStyle}>
          {/* Progress dots */}
          <div style={progressContainerStyle}>
            {STEPS.map((_, index) => (
              <div key={index} style={getDotStyle(index)} />
            ))}
          </div>

          {/* Content */}
          <div style={contentStyle}>
            <div style={iconContainerStyle}>
              {step.icon()}
            </div>
            <h2 style={headingStyle}>
              {step.heading(displayName)}
            </h2>
            <p style={descriptionStyle}>
              {step.description}
            </p>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <span style={stepCounterStyle}>
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <div style={buttonsStyle}>
              <Button variant="ghost" onClick={handleSkip} disabled={completing}>
                Skip
              </Button>
              <Button onClick={handleNext} loading={completing}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

OnboardingWizard.propTypes = {
  user: PropTypes.shape({
    display_name: PropTypes.string,
    name: PropTypes.string,
  }),
  onComplete: PropTypes.func.isRequired,
}

export default OnboardingWizard
