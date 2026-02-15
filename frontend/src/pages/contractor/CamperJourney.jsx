import { useState, useEffect } from 'react'
import {
  Compass, BarChart3, Star, Lock,
  Flame, Layers, Zap, HeartHandshake, Sparkles, Fish,
  Tent, TreePine, Trees, Award, FireExtinguisher,
} from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import CircleProgress from '@/components/ui/CircleProgress'
import WaveProgressBar from '@/components/ui/WaveProgressBar'
import FlameIcon from '@/components/ui/FlameIcon'
import FireStageTimeline from '@/components/features/gamification/FireStageTimeline'
import { apiFetch } from '@/services/apiFetch'
import { colours, spacing, typography, radii } from '@/config/tokens'
import { SCALING_TIERS, BADGES as BADGE_DEFS } from '@/config/constants'

const ICON_MAP = {
  'flame': Flame,
  'layers': Layers,
  'fire-extinguisher': FireExtinguisher,
  'zap': Zap,
  'heart-handshake': HeartHandshake,
  'sparkles': Sparkles,
  'fish': Fish,
  'star': Star,
  'compass': Compass,
  'tent': Tent,
  'tree-pine': TreePine,
  'trees': Trees,
  'award': Award,
}

const resolveIcon = (name) => ICON_MAP[(name || '').toLowerCase()] || Award

export default function CamperJourney() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const json = await apiFetch('/gamification/me')
        if (json.success) {
          setData(json.data)
        }
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[16] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: spacing[12], color: colours.neutral[500] }}>
        Unable to load journey data.
      </div>
    )
  }

  // Derived values
  const currentLevel = data.current_level || 1
  const totalXp = data.total_xp || 0
  const currentTier = SCALING_TIERS.find(t => t.level === currentLevel) || SCALING_TIERS[0]
  const nextTier = SCALING_TIERS.find(t => t.level === currentLevel + 1)

  const currentXpRequired = currentTier.xpRequired
  const nextXpRequired = nextTier ? nextTier.xpRequired : currentXpRequired
  const xpIntoLevel = totalXp - currentXpRequired
  const xpNeeded = nextXpRequired - currentXpRequired
  const progressPercent = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100

  const levelName = data.current_level_details?.name || currentTier.name
  const fireStage = data.current_level_details?.fire_stage || currentTier.fireStage
  const rateMin = data.current_level_details?.rate_min ?? currentTier.rateMin
  const rateMax = data.current_level_details?.rate_max ?? currentTier.rateMax
  const rateLabel = rateMax > 0 ? `$${rateMin}\u2013$${rateMax}/hr` : rateMin > 0 ? `$${rateMin}+/hr` : '$0/hr'

  const tasksCompleted = data.tasks_completed || 0
  const avgRating = data.avg_quality_rating || 0
  const categoriesWorked = data.categories_worked || 0

  const levels = SCALING_TIERS.filter(t => t.level > 0).map(t => ({ level: t.level, name: t.name }))

  // Merge API badges with constant definitions for icon resolution
  const badges = (data.badges || []).map(b => {
    const def = BADGE_DEFS.find(d => d.id === b.id)
    return {
      ...b,
      icon_name: def?.icon || b.icon || b.icon_name || 'award',
      description: b.description || def?.description || '',
    }
  })

  return (
    <div style={pageStyle}>
      {/* ── SECTION 1: THE CIRCLE ────────────────────────── */}
      <section style={circleSectionStyle}>
        <div style={circleContainerStyle}>
          <CircleProgress
            currentLevel={currentLevel}
            levels={levels}
            size={340}
            className="journey-circle"
          />
        </div>

        <div style={xpBarContainerStyle}>
          <WaveProgressBar
            progress={progressPercent}
            label={`Level ${currentLevel} \u2014 ${levelName}`}
            sublabel={nextTier
              ? `${totalXp.toLocaleString()} / ${nextXpRequired.toLocaleString()} XP`
              : `${totalXp.toLocaleString()} XP \u2014 Max Level`
            }
            size="md"
            showPercentage
          />
        </div>

        <div style={rateLabelStyle}>{rateLabel}</div>

        <div style={fireStageLabelStyle}>
          <FlameIcon level={currentLevel} size="sm" animated />
          <span>{fireStage}</span>
        </div>
      </section>

      {/* ── SECTION 2: FIRE STAGES ───────────────────────── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>The Journey</h2>
        <GlowCard padding="24px 16px">
          <FireStageTimeline
            currentStage={fireStage}
            currentLevel={currentLevel}
          />
        </GlowCard>
      </section>

      {/* ── SECTION 3: BADGES & STATS ────────────────────── */}
      <section style={bottomSectionStyle} className="journey-bottom">
        {/* Badge Grid */}
        <div style={badgeColumnStyle} className="journey-badge-col">
          <h2 style={sectionTitleStyle}>
            <Compass size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Trail Badges
          </h2>
          <div style={badgeGridStyle} className="journey-badge-grid">
            {badges.map(badge => {
              const IconComponent = resolveIcon(badge.icon_name)
              const earned = badge.earned

              return (
                <GlowCard
                  key={badge.id}
                  glow={earned ? 'soft' : 'none'}
                  glowOnHover={earned}
                  padding="16px"
                >
                  <div style={badgeCardInnerStyle}>
                    <div style={{
                      ...badgeIconWrapperStyle,
                      opacity: earned ? 1 : 0.25,
                    }}>
                      <IconComponent
                        size={24}
                        color="#ffffff"
                        style={{ opacity: earned ? 1 : 0.4 }}
                      />
                      {!earned && (
                        <span style={lockIconStyle}>
                          <Lock size={10} color={colours.neutral[400]} />
                        </span>
                      )}
                    </div>

                    <div style={{
                      ...badgeNameStyle,
                      color: earned ? colours.neutral[900] : colours.neutral[400],
                    }}>
                      {badge.name}
                    </div>

                    <div style={{
                      ...badgeSubStyle,
                      color: colours.neutral[500],
                    }}>
                      {earned
                        ? badge.awarded_at
                          ? new Date(badge.awarded_at).toLocaleDateString()
                          : 'Earned'
                        : badge.description
                      }
                    </div>
                  </div>
                </GlowCard>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={statsColumnStyle} className="journey-stats-col">
          <h2 style={sectionTitleStyle}>
            <BarChart3 size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Your Stats
          </h2>
          <GlowCard padding="0">
            <div style={statsListStyle}>
              <StatRow label="Tasks Completed" value={tasksCompleted} />
              <StatRow label="Average Rating" value={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : '\u2014'}
                  <span style={{ letterSpacing: '1px' }}>
                    {avgRating > 0 && renderStars(avgRating)}
                  </span>
                  {avgRating > 0 && <span style={{ color: colours.neutral[500], fontSize: '13px' }}> / 5</span>}
                </span>
              } />
              <StatRow label="Current Rate Range" value={rateLabel} />
              <StatRow label="Categories Worked" value={categoriesWorked} />
              <StatRow label="Total XP" value={totalXp.toLocaleString()} />
            </div>
          </GlowCard>
        </div>
      </section>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 768px) {
          .journey-bottom { flex-direction: column !important; }
          .journey-badge-col { width: 100% !important; }
          .journey-stats-col { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}

function renderStars(rating) {
  const filled = Math.round(rating)
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        size={13}
        color="#ffffff"
        fill={i <= filled ? colours.neutral[900] : 'transparent'}
        style={{ opacity: i <= filled ? 1 : 0.25 }}
      />
    )
  }
  return stars
}

function StatRow({ label, value }) {
  return (
    <div style={statRowStyle}>
      <span style={statLabelStyle}>{label}</span>
      <span style={statValueStyle}>{value}</span>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────

const pageStyle = {
  fontFamily: typography.fontFamily.sans,
}

const circleSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: spacing[10],
  paddingTop: spacing[4],
}

const circleContainerStyle = {
  marginBottom: spacing[6],
}

const xpBarContainerStyle = {
  width: '100%',
  maxWidth: '400px',
  marginBottom: spacing[3],
}

const rateLabelStyle = {
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
  marginBottom: spacing[2],
}

const fireStageLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  fontSize: typography.fontSize.sm,
  color: colours.neutral[500],
  fontStyle: 'italic',
}

const sectionStyle = {
  marginBottom: spacing[10],
}

const sectionTitleStyle = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: colours.neutral[900],
  marginBottom: spacing[4],
  marginTop: 0,
  display: 'flex',
  alignItems: 'center',
}

const bottomSectionStyle = {
  display: 'flex',
  gap: spacing[6],
  alignItems: 'flex-start',
}

const badgeColumnStyle = {
  width: '60%',
  minWidth: 0,
}

const statsColumnStyle = {
  width: '40%',
  minWidth: 0,
}

const badgeGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: spacing[3],
}

const badgeCardInnerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '6px',
}

const badgeIconWrapperStyle = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '2px',
}

const lockIconStyle = {
  position: 'absolute',
  bottom: '-4px',
  right: '-8px',
}

const badgeNameStyle = {
  fontSize: '13px',
  fontWeight: typography.fontWeight.semibold,
  lineHeight: 1.2,
}

const badgeSubStyle = {
  fontSize: '11px',
  lineHeight: 1.3,
}

const statsListStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const statRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${spacing[3]} ${spacing[4]}`,
  borderBottom: '1px solid #1a1a1a',
}

const statLabelStyle = {
  fontSize: '13px',
  color: colours.neutral[500],
}

const statValueStyle = {
  fontSize: '16px',
  fontWeight: typography.fontWeight.bold,
  color: colours.neutral[900],
}
