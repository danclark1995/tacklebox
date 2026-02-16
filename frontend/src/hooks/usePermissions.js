/**
 * usePermissions Hook
 *
 * Provides level-based permission checking for the current user.
 * Combines user role + level to determine capabilities.
 */

import { useMemo } from 'react'
import useAuth from './useAuth'
import { getEffectiveLevel, hasCapability, isAdminTier, LEVEL_REQUIREMENTS, NAV_ITEMS, AI_TOOLS } from '@/config/permissions'

export default function usePermissions() {
  const { user } = useAuth()

  return useMemo(() => {
    const effectiveLevel = getEffectiveLevel(user)
    const isClient = user?.role === 'client'
    const isAdmin = isAdminTier(user)

    return {
      // Current effective level
      level: effectiveLevel,
      levelName: user?.level_name || 'Volunteer',
      isClient,
      isAdmin,

      // Check a specific capability
      can: (capability) => {
        if (isClient) return false // clients use separate permission model
        return hasCapability(effectiveLevel, capability)
      },

      // Get nav items for current user
      navItems: isClient
        ? NAV_ITEMS.client
        : NAV_ITEMS.camper.filter(item => effectiveLevel >= (item.minLevel || 1)),

      // Get available AI tools
      aiTools: AI_TOOLS.filter(tool => effectiveLevel >= tool.minLevel),

      // Minimum level for a capability
      levelFor: (capability) => LEVEL_REQUIREMENTS[capability] || 99,
    }
  }, [user])
}
