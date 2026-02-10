import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '@/components/layout/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { colours, spacing, typography } from '@/config/tokens'
import { VALIDATION } from '@/config/constants'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await login(email, password)
      addToast('Welcome back!', 'success')
      navigate('/')
    } catch (error) {
      setErrors({ form: error.message || 'Login failed. Please check your credentials.' })
      addToast(error.message || 'Login failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const headingStyle = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colours.neutral[900],
    marginBottom: spacing[6],
    textAlign: 'center',
  }

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
  }

  const errorStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[700],
    marginTop: spacing[1],
  }

  const formErrorStyle = {
    fontSize: typography.fontSize.sm,
    color: colours.neutral[700],
    padding: spacing[3],
    backgroundColor: colours.neutral[100],
    borderRadius: '6px',
    textAlign: 'center',
  }

  return (
    <AuthLayout>
      <h1 style={headingStyle}>Sign in to TackleBox</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        {errors.form && (
          <div style={formErrorStyle}>{errors.form}</div>
        )}

        <div>
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
          {errors.email && <div style={errorStyle}>{errors.email}</div>}
        </div>

        <div>
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && <div style={errorStyle}>{errors.password}</div>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </AuthLayout>
  )
}
