import { useState, useEffect, useRef } from 'react'
import Button from './Button'

/**
 * ConfirmAction — Inline confirmation pattern for destructive/important actions.
 *
 * Initially shows the trigger element. On click, replaces it with
 * Confirm + Cancel buttons inline. Auto-reverts after 5 seconds.
 *
 * Props:
 *   trigger         – React element (the button that starts the action)
 *   message         – optional confirmation text shown above buttons
 *   confirmLabel    – label for confirm button (default: "Confirm")
 *   cancelLabel     – label for cancel button (default: "Cancel")
 *   confirmVariant  – Button variant for confirm (default: "primary")
 *   onConfirm       – called when confirm clicked
 *   onCancel        – called when cancel clicked (optional)
 */
export default function ConfirmAction({
  trigger,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) {
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (confirming) {
      timerRef.current = setTimeout(() => {
        setConfirming(false)
      }, 5000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [confirming])

  const handleConfirm = () => {
    setConfirming(false)
    if (onConfirm) onConfirm()
  }

  const handleCancel = () => {
    setConfirming(false)
    if (onCancel) onCancel()
  }

  if (!confirming) {
    return (
      <span onClick={() => setConfirming(true)} style={{ display: 'inline-flex' }}>
        {trigger}
      </span>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {message && (
        <span style={{ fontSize: '13px', color: '#888' }}>{message}</span>
      )}
      <Button size="sm" variant={confirmVariant} onClick={handleConfirm}>
        {confirmLabel}
      </Button>
      <Button size="sm" variant="secondary" onClick={handleCancel}>
        {cancelLabel}
      </Button>
    </div>
  )
}
