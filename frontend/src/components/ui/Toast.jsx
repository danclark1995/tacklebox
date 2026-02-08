import React, { createContext, useContext, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { colours, spacing, radii, shadows, typography, transitions, zIndex } from '@/config/tokens'

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

const Toast = ({ id, message, variant, onClose }) => {
  const variantStyles = {
    success: {
      backgroundColor: colours.success[50],
      borderColor: colours.success[500],
      color: colours.success[800],
      iconColor: colours.success[500],
    },
    error: {
      backgroundColor: colours.error[50],
      borderColor: colours.error[500],
      color: colours.error[800],
      iconColor: colours.error[500],
    },
    warning: {
      backgroundColor: colours.warning[50],
      borderColor: colours.warning[500],
      color: colours.warning[800],
      iconColor: colours.warning[500],
    },
    info: {
      backgroundColor: colours.info[50],
      borderColor: colours.info[500],
      color: colours.info[800],
      iconColor: colours.info[500],
    },
  }

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  }

  const toastStyles = {
    fontFamily: typography.fontFamily.sans,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    boxShadow: shadows.lg,
    minWidth: '320px',
    maxWidth: '480px',
    marginBottom: spacing[3],
    border: `1px solid ${variantStyles[variant].borderColor}`,
    backgroundColor: variantStyles[variant].backgroundColor,
    color: variantStyles[variant].color,
    animation: 'slideInRight 200ms ease',
  }

  const iconWrapperStyles = {
    display: 'flex',
    flexShrink: 0,
    color: variantStyles[variant].iconColor,
  }

  const messageStyles = {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  }

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: spacing[1],
    display: 'flex',
    alignItems: 'center',
    color: variantStyles[variant].color,
    opacity: 0.7,
    transition: `opacity ${transitions.fast}`,
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={toastStyles}>
        <div style={iconWrapperStyles}>{icons[variant]}</div>
        <div style={messageStyles}>{message}</div>
        <button
          style={closeButtonStyles}
          onClick={() => onClose(id)}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </>
  )
}

Toast.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  onClose: PropTypes.func.isRequired,
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, variant = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, variant }])

    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info: (message) => addToast(message, 'info'),
  }

  const containerStyles = {
    position: 'fixed',
    top: spacing[4],
    right: spacing[4],
    zIndex: zIndex.toast,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={containerStyles}>
        {toasts.map((t) => (
          <Toast key={t.id} id={t.id} message={t.message} variant={t.variant} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Toast
