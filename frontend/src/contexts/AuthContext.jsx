import { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '@/services/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const existingUser = authService.getCurrentUser()
    if (existingUser) {
      setUser(existingUser)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    try {
      const userData = await authService.login(email, password)
      setUser(userData)
      return userData
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    navigate('/login')
  }, [navigate])

  const hasRole = useCallback((...roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  // Update level data when gamification data is loaded
  const updateLevel = useCallback((level, levelName) => {
    setUser(prev => {
      if (!prev) return prev
      const effectiveLevel = prev.role === 'admin' ? Math.max(level, 7) : level
      const updated = { ...prev, level: effectiveLevel, level_name: levelName }
      authService.updateStoredUser(updated)
      return updated
    })
  }, [])

  const isAuthenticated = !!user

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
    updateLevel,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
