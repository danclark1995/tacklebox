import { useState, useEffect } from 'react'
import {
  Compass, BarChart3, Star, Lock,
  Flame, Layers, Zap, HeartHandshake, Sparkles, Fish,
  Tent, TreePine, Trees, Award, FireExtinguisher,
  DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle, Wallet,
} from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import GlowCard from '@/components/ui/GlowCard'
import EmberLoader from '@/components/ui/EmberLoader'
import CircleProgress from '@/components/ui/CircleProgress'
import WaveProgressBar from '@/components/ui/WaveProgressBar'
import FlameIcon from '@/components/ui/FlameIcon'
import FireStageTimeline from '@/components/features/gamification/FireStageTimeline'
import { getContractorXP, getLevels, getBadges, getMyGamification } from '@/services/gamification'
import { getMyEarnings } from '@/services/earnings'
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

export default function AdminJourney() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [data, setData] = useState(null)
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [gamData, earnData] = await Promise.all([
          getMyGamification(),
          getMyEarnings().catch(() => null),
        ])
        setData(gamData)
        setEarnings(earnData)
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

  const currentLevel = data.current_level || 7
  const totalXp = data.total_xp || 0
  const currentTier = SCALING_TIERS.find(t => t.level === currentLevel) || SCALING_TIERS[7]
  const nextTier = SCALING_TIERS.find(t => t.level === currentLevel + 1)

  const currentXpRequired = currentTier.xpRequired
  const nextXpRequired = nextTier ? nextTier.xpRequired : currentXpRequired
  const xpIntoLevel = totalXp - currentXpRequired
  const xpNeeded = nextXpRequired - currentXpRequired
  const progressPercent = xpNeeded > 0 ? Math.min((xpIntoLevel / xpNeeded) * 100, 100) : 100

  const levelName = data.current_level_details?.name || currentTier.name
  const fireStage = data.current_level_details?.fire_stage || currentTier.fireStage
  const rateLabel = '$120/hr'

  const levels = SCALING_TIERS.filter(t => t.level > 0).map(t => ({ level: t.level, name: t.name }))

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
      {/* Circle */}
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

      {/* Earnings & Balance */}
      {(() => {
        const totalEarned = earnings?.total_earnings || data?.total_earnings || 0
        const availableBalance = earnings?.available_balance || data?.available_balance || 0
        const cashouts = earnings?.cashouts || []
        const totalCashedOut = cashouts.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.amount || 0), 0)
        const pendingCashouts = cashouts.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0)
        const earningsHistory = earnings?.earnings || []

        return (
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Wallet size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Earnings & Balance
            </h2>

            {/* Balance cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: spacing[4], marginBottom: spacing[6] }}>
              <GlowCard padding="20px" glow="soft">
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
                  <div style={{ width: 36, height: 36, borderRadius: radii.full, backgroundColor: '#065f46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={18} color="#34d399" />
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Available</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: typography.fontWeight.bold, color: '#34d399' }}>
                  ${availableBalance.toFixed(2)}
                </div>
              </GlowCard>

              <GlowCard padding="20px">
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
                  <div style={{ width: 36, height: 36, borderRadius: radii.full, backgroundColor: colours.surfaceRaised, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} color={colours.neutral[600]} />
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total Earned</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
                  ${totalEarned.toFixed(2)}
                </div>
              </GlowCard>

              <GlowCard padding="20px">
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
                  <div style={{ width: 36, height: 36, borderRadius: radii.full, backgroundColor: colours.surfaceRaised, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowUpCircle size={18} color={colours.neutral[600]} />
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Cashed Out</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
                  ${totalCashedOut.toFixed(2)}
                </div>
              </GlowCard>

              {pendingCashouts > 0 && (
                <GlowCard padding="20px">
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] }}>
                    <div style={{ width: 36, height: 36, borderRadius: radii.full, backgroundColor: '#78350f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowDownCircle size={18} color="#fbbf24" />
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Pending</div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: typography.fontWeight.bold, color: '#fbbf24' }}>
                    ${pendingCashouts.toFixed(2)}
                  </div>
                </GlowCard>
              )}
            </div>

            {/* Recent transactions */}
            {earningsHistory.length > 0 && (
              <GlowCard padding="0">
                <div style={{ padding: `${spacing[3]} ${spacing[4]}`, borderBottom: `1px solid ${colours.surfaceRaised}` }}>
                  <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>Recent Transactions</span>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {earningsHistory.slice(0, 10).map((e, i) => (
                    <div key={e.id || i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderBottom: i < Math.min(earningsHistory.length, 10) - 1 ? `1px solid ${colours.surfaceRaised}` : 'none',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[900], fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.task_title || e.description || e.type}
                        </div>
                        <div style={{ fontSize: '11px', color: colours.neutral[500], marginTop: 2 }}>
                          {e.type === 'task_completion' ? 'Task payout' : e.type === 'bonus_cash' ? 'Bonus' : e.type === 'bonus_xp' ? 'XP Bonus' : e.type}
                          {e.awarded_by_name && ` · from ${e.awarded_by_name}`}
                          {e.created_at && ` · ${new Date(e.created_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: spacing[3] }}>
                        {e.amount > 0 && <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: '#34d399' }}>+${Number(e.amount).toFixed(2)}</div>}
                        {e.xp_amount > 0 && <div style={{ fontSize: '11px', color: colours.neutral[500] }}>+{e.xp_amount} XP</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </GlowCard>
            )}

            {/* Cashout history */}
            {cashouts.length > 0 && (
              <div style={{ marginTop: spacing[4] }}>
                <GlowCard padding="0">
                  <div style={{ padding: `${spacing[3]} ${spacing[4]}`, borderBottom: `1px solid ${colours.surfaceRaised}` }}>
                    <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>Cashout History</span>
                  </div>
                  {cashouts.slice(0, 5).map((c, i) => (
                    <div key={c.id || i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: `${spacing[3]} ${spacing[4]}`,
                      borderBottom: i < Math.min(cashouts.length, 5) - 1 ? `1px solid ${colours.surfaceRaised}` : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[900], fontWeight: 500 }}>
                          Cashout request
                        </div>
                        <div style={{ fontSize: '11px', color: colours.neutral[500], marginTop: 2 }}>
                          {c.created_at && new Date(c.created_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {c.processed_at && ` · Processed ${new Date(c.processed_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>${Number(c.amount).toFixed(2)}</div>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: radii.full, textTransform: 'uppercase',
                          backgroundColor: c.status === 'completed' ? '#065f46' : c.status === 'pending' ? '#78350f' : '#7f1d1d',
                          color: c.status === 'completed' ? '#34d399' : c.status === 'pending' ? '#fbbf24' : '#f87171',
                        }}>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </GlowCard>
              </div>
            )}

            {/* Empty state */}
            {earningsHistory.length === 0 && cashouts.length === 0 && (
              <GlowCard padding="32px" style={{ textAlign: 'center' }}>
                <DollarSign size={32} style={{ color: colours.neutral[400], marginBottom: spacing[2] }} />
                <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>No earnings yet. Complete tasks to start building your balance.</div>
              </GlowCard>
            )}
          </section>
        )
      })()}

      {/* Fire Stages */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>The Journey</h2>
        <GlowCard padding="24px 16px">
          <FireStageTimeline
            currentStage={fireStage}
            currentLevel={currentLevel}
          />
        </GlowCard>
      </section>

      {/* Badges & Stats */}
      <section style={bottomSectionStyle} className="journey-bottom">
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
                        color={colours.neutral[900]}
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

        <div style={statsColumnStyle} className="journey-stats-col">
          <h2 style={sectionTitleStyle}>
            <BarChart3 size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Your Stats
          </h2>
          <GlowCard padding="0">
            <div style={statsListStyle}>
              <StatRow label="Tasks Created" value={data.tasks_created || 0} />
              <StatRow label="Tasks Reviewed" value={data.tasks_reviewed || 0} />
              <StatRow label="Campers Managed" value={data.campers_managed || 0} />
              <StatRow label="Total XP" value={totalXp.toLocaleString()} />
            </div>
          </GlowCard>
        </div>
      </section>

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

function StatRow({ label, value }) {
  return (
    <div style={statRowStyle}>
      <span style={statLabelStyle}>{label}</span>
      <span style={statValueStyle}>{value}</span>
    </div>
  )
}

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
  borderBottom: `1px solid ${colours.surfaceRaised}`,
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
