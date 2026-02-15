import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import XPBar from '@/components/features/gamification/XPBar'
import BadgeGrid from '@/components/features/gamification/BadgeGrid'
import Leaderboard from '@/components/features/gamification/Leaderboard'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography, radii, shadows } from '@/config/tokens'

export default function ContractorStats() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [xpData, setXpData] = useState(null)
  const [levels, setLevels] = useState([])
  const [badges, setBadges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    async function loadAll() {
      try {
        const headers = { ...getAuthHeaders() }

        const [xpRes, levelsRes, badgesRes, leaderboardRes] = await Promise.all([
          fetch(apiEndpoint(`/gamification/xp/${user.id}`), { headers }),
          fetch(apiEndpoint('/gamification/levels'), { headers }),
          fetch(apiEndpoint(`/gamification/badges/${user.id}`), { headers }),
          fetch(apiEndpoint('/gamification/leaderboard'), { headers }),
        ])

        const [xpJson, levelsJson, badgesJson, leaderboardJson] = await Promise.all([
          xpRes.json(),
          levelsRes.json(),
          badgesRes.json(),
          leaderboardRes.json(),
        ])

        if (xpJson.success !== false) setXpData(xpJson.data || xpJson)
        if (Array.isArray(levelsJson.data || levelsJson)) setLevels(levelsJson.data || levelsJson)
        if (Array.isArray(badgesJson.data || badgesJson)) setBadges(badgesJson.data || badgesJson)
        if (Array.isArray(leaderboardJson.data || leaderboardJson)) setLeaderboard(leaderboardJson.data || leaderboardJson)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [user?.id, addToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  // Derived stats
  const tasksCompleted = xpData?.tasks_completed ?? 0
  const onTimeCount = xpData?.on_time_count ?? 0
  const totalWithDeadline = xpData?.total_tasks_with_deadline ?? 0
  const onTimeRate = totalWithDeadline > 0
    ? Math.round((onTimeCount / totalWithDeadline) * 100)
    : 0
  const avgQuality = xpData?.avg_quality_rating ?? 0
  const totalXP = xpData?.total_xp ?? 0

  return (
    <div>
      <PageHeader title="My Stats" subtitle="Track your progress and achievements" />

      {/* XP Section */}
      <div style={sectionStyle}>
        <GlowCard padding="32px">
          <XPBar xpData={xpData} levels={levels} />
        </GlowCard>
      </div>

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        <GlowCard>
          <div style={statLabelStyle}>Tasks Completed</div>
          <div style={statValueStyle}>{tasksCompleted}</div>
        </GlowCard>

        <GlowCard>
          <div style={statLabelStyle}>On-Time Rate</div>
          <div style={statValueStyle}>
            {onTimeRate}
            <span style={statUnitStyle}>%</span>
          </div>
        </GlowCard>

        <GlowCard>
          <div style={statLabelStyle}>Avg Quality Rating</div>
          <div style={statValueStyle}>
            {avgQuality > 0 ? avgQuality.toFixed(1) : '-'}
            {avgQuality > 0 && <Star size={16} style={{ marginLeft: '4px', display: 'inline', verticalAlign: 'middle' }} />}
          </div>
        </GlowCard>

        <GlowCard>
          <div style={statLabelStyle}>Total XP</div>
          <div style={statValueStyle}>{totalXP.toLocaleString()}</div>
        </GlowCard>
      </div>

      {/* Badges Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>My Badges</h2>
        {badges.length > 0 ? (
          <BadgeGrid badges={badges} />
        ) : (
          <GlowCard>
            <div style={emptyTextStyle}>
              Complete tasks to start earning badges!
            </div>
          </GlowCard>
        )}
      </div>

      {/* Leaderboard Preview */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Leaderboard</h2>
        {leaderboard.length > 0 ? (
          <GlowCard padding="12px">
            <Leaderboard
              entries={leaderboard}
              currentUserId={user?.id}
              compact
            />
          </GlowCard>
        ) : (
          <GlowCard>
            <div style={emptyTextStyle}>
              Leaderboard data is not available yet.
            </div>
          </GlowCard>
        )}
      </div>
    </div>
  )
}

// =========================================================================
// Styles
// =========================================================================

const sectionStyle = {
  marginBottom: spacing[8],
}

const sectionTitleStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[900],
  marginBottom: spacing[4],
  marginTop: 0,
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing[4],
  marginBottom: spacing[8],
}

const statLabelStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  color: colours.neutral[600],
  marginBottom: spacing[2],
}

const statValueStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize['3xl'],
  fontWeight: typography.fontWeight.bold,
  color: colours.neutral[900],
}

const statUnitStyle = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
}

const emptyTextStyle = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.base,
  color: colours.neutral[500],
  textAlign: 'center',
  padding: spacing[6],
}
