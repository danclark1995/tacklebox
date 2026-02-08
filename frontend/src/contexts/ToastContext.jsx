import { createContext, useState, useCallback } from 'react'
import Toast from '@/components/ui/Toast'
import { zIndex, spacing } from '@/config/tokens'

export const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((message, variant = 'info') => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, variant }

    setToasts(prev => [...prev, newToast])

    setTimeout(() => {
      removeToast(id)
    }, 5000)

    return id
  }, [removeToast])

  const value = {
    toasts,
    addToast,
    removeToast,
  }

  const containerStyle = {
    position: 'fixed',
    top: spacing[4],
    right: spacing[4],
    zIndex: zIndex.toast,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    pointerEvents: 'none',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={containerStyle}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
