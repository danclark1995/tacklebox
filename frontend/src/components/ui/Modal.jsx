import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, shadows, typography, transitions, zIndex } from '@/config/tokens'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeStyles = {
    sm: { maxWidth: '400px' },
    md: { maxWidth: '560px' },
    lg: { maxWidth: '720px' },
    xl: { maxWidth: '900px' },
  }

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colours.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    zIndex: zIndex.modal,
    animation: 'fadeIn 200ms ease',
  }

  const modalStyles = {
    backgroundColor: colours.white,
    borderRadius: radii.xl,
    boxShadow: shadows.xl,
    width: '100%',
    ...sizeStyles[size],
    animation: 'slideUp 200ms ease',
  }

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
    borderBottom: `1px solid ${colours.neutral[200]}`,
  }

  const titleStyles = {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colours.neutral[900],
    margin: 0,
  }

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    fontSize: typography.fontSize.xl,
    color: colours.neutral[500],
    cursor: 'pointer',
    padding: spacing[1],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    transition: `all ${transitions.fast}`,
    width: '32px',
    height: '32px',
  }

  const contentStyles = {
    padding: spacing[6],
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={overlayStyles} onClick={handleOverlayClick}>
        <div style={modalStyles}>
          <div style={headerStyles}>
            <h2 style={titleStyles}>{title}</h2>
            {showCloseButton && (
              <button
                style={closeButtonStyles}
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colours.neutral[100]
                  e.currentTarget.style.color = colours.neutral[700]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = colours.neutral[500]
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <div style={contentStyles}>{children}</div>
        </div>
      </div>
    </>
  )
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  showCloseButton: PropTypes.bool,
}

export default Modal
