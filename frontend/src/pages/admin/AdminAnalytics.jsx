import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { CheckCircle, Clock, Users, Star, TrendingUp, Calendar, Gift, DollarSign } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, EmberLoader, PageHeader, DatePicker, Button, Select, Input } from '@/components/ui'
import {
  getTaskOverview,
  getTurnaround,
  getContractorPerformance,
  getTimeTracking,
  getReviewInsights,
} from '@/services/analytics'
import { getAnalytics as getEarningsAnalytics, awardBonus } from '@/services/earnings'
import { listUsers } from '@/services/users'
import { colours, spacing, typography, radii } from '@/config/tokens'

// ── Formatting helpers ────────────────────────────────────────────
function fmtCount(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString('en-AU', { maximumFractionDigits: 0 })
}

function fmtDecimal(n, decimals = 1) {
  if (n == null) return '0.0'
  return Number(n).toLocaleString('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtPct(n) {
  if (n == null) return '0%'
  return `${fmtDecimal(n, 0)}%`
}

// ── Stat tile ───────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, sublabel }) {
  return (
    <GlowCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
        <div style={{
          width: 44, height: 44, borderRadius: radii.lg,
          backgroundColor: colours.neutral[100],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: colours.neutral[600], flexShrink: 0,
        }}>
          <Icon size={22} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: colours.neutral[900],
            lineHeight: typography.lineHeight.tight,
          }}>
            {value}
          </div>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colours.neutral[500],
            marginTop: '2px',
          }}>
            {label}
          </div>
          {sublabel && (
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colours.neutral[400],
              marginTop: '2px',
            }}>
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </GlowCard>
  )
}

// ── Custom Recharts tooltip ───────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div style={{
      backgroundColor: colours.neutral[100],
      border: `1px solid ${colours.neutral[200]}`,
      borderRadius: radii.md,
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: typography.fontSize.sm,
      color: colours.neutral[900],
    }}>
      <div style={{ fontWeight: typography.fontWeight.semibold, marginBottom: '2px' }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: colours.neutral[700] }}>
          {entry.name}: {typeof entry.value === 'number' ? fmtDecimal(entry.value) : entry.value}
        </div>
      ))}
    </div>
  )
}

// ── Status bar (horizontal stacked) ─────────────────────────────
function StatusBar({ data }) {
  if (!data || data.length === 0) return null

  const total = data.reduce((sum, s) => sum + (s.count || 0), 0)
  if (total === 0) return null

  const shades = {
    completed: colours.neutral[900],
    in_review: colours.neutral[700],
    in_progress: colours.neutral[500],
    assigned: colours.neutral[400],
    pending: colours.neutral[300],
  }

  return (
    <div>
      <div style={{
        display: 'flex', height: 12, borderRadius: radii.lg, overflow: 'hidden',
        backgroundColor: colours.neutral[100],
      }}>
        {data.map((s) => {
          const pct = (s.count / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={s.status}
              style={{
                width: `${pct}%`,
                backgroundColor: shades[s.status] || colours.neutral[400],
                transition: 'width 0.3s ease',
              }}
              title={`${s.status.replace(/_/g, ' ')}: ${s.count}`}
            />
          )
        })}
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: `${spacing[2]} ${spacing[5]}`,
        marginTop: spacing[3],
      }}>
        {data.map((s) => (
          <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: shades[s.status] || colours.neutral[400],
            }} />
            <span style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600] }}>
              {s.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
            <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[800] }}>
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Camper row ───────────────────────────────────────────────────
function CamperRow({ camper, rank }) {
  const quality = camper.avg_quality != null ? Number(camper.avg_quality) : null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 1fr 80px 80px 80px',
      gap: spacing[3],
      alignItems: 'center',
      padding: `${spacing[3]} 0`,
      borderBottom: `1px solid ${colours.neutral[100]}`,
    }}>
      <span style={{
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: colours.neutral[400],
        textAlign: 'center',
      }}>
        {rank}
      </span>
      <div>
        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>
          {camper.display_name}
        </div>
        {camper.level != null && (
          <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
            Lv. {camper.level} / {fmtCount(camper.total_xp)} XP
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
          {fmtCount(camper.tasks_completed)}
        </div>
        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>tasks</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
          {fmtPct(camper.on_time_pct)}
        </div>
        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>on time</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
          {quality != null ? fmtDecimal(quality) : '-'}
        </div>
        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>quality</div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function AdminAnalytics() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [taskData, setTaskData] = useState(null)
  const [turnaroundData, setTurnaroundData] = useState(null)
  const [contractorData, setContractorData] = useState(null)
  const [timeData, setTimeData] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  const [earningsAnalytics, setEarningsAnalytics] = useState(null)
  const [campersList, setCampersList] = useState([])

  // Reward form
  const [rewardUser, setRewardUser] = useState('')
  const [rewardType, setRewardType] = useState('bonus_cash')
  const [rewardAmount, setRewardAmount] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [rewardSubmitting, setRewardSubmitting] = useState(false)

  const [loading, setLoading] = useState(true)

  const buildFilters = useCallback(() => {
    const filters = {}
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo) filters.date_to = dateTo
    return filters
  }, [dateFrom, dateTo])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    const filters = buildFilters()

    try {
      const [tasks, turnaround, contrs, time, reviews] = await Promise.all([
        getTaskOverview(filters),
        getTurnaround(filters),
        getContractorPerformance(filters),
        getTimeTracking(filters),
        getReviewInsights(filters),
      ])

      setTaskData(tasks)
      setTurnaroundData(turnaround)
      setContractorData(contrs)
      setTimeData(time)
      setReviewData(reviews)

      // Fetch earnings analytics and campers list
      try {
        const [earningsData, usersData] = await Promise.all([
          getEarningsAnalytics(),
          listUsers(),
        ])
        setEarningsAnalytics(earningsData)
        setCampersList((usersData || []).filter(u => u.role === 'contractor'))
      } catch (e) { /* non-critical */ }
    } catch (err) {
      addToast(err.message || 'Failed to load analytics', 'error')
    } finally {
      setLoading(false)
    }
  }, [buildFilters, addToast])

  useEffect(() => {
    fetchAnalytics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ fontFamily: typography.fontFamily.sans }}>
        <PageHeader title="Analytics" subtitle="Platform performance at a glance" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[16] }}>
          <EmberLoader size="lg" />
        </div>
      </div>
    )
  }

  const byStatusData = taskData?.by_status || []
  const byMonthData = taskData?.by_month || []
  const campers = (contractorData?.data || [])
    .sort((a, b) => (b.tasks_completed || 0) - (a.tasks_completed || 0))
    .slice(0, 8)

  const completedCount = byStatusData.find(s => s.status === 'completed')?.count || 0
  const totalTasks = taskData?.total || 0
  const completionRate = totalTasks > 0 ? ((completedCount / totalTasks) * 100) : 0

  return (
    <div style={{ fontFamily: typography.fontFamily.sans }}>
      <PageHeader title="Analytics" subtitle="Platform performance at a glance" />

      {/* Date filter */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: spacing[3],
        marginBottom: spacing[6],
      }}>
        <DatePicker label="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <DatePicker label="To" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <Button variant="primary" onClick={() => fetchAnalytics()}>Apply</Button>
        {(dateFrom || dateTo) && (
          <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); setTimeout(fetchAnalytics, 0) }}>Clear</Button>
        )}
      </div>

      {/* Top stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: spacing[4],
        marginBottom: spacing[6],
      }}>
        <StatTile icon={CheckCircle} label="Total Tasks" value={fmtCount(totalTasks)} />
        <StatTile icon={TrendingUp} label="Completion Rate" value={fmtPct(completionRate)} sublabel={`${fmtCount(completedCount)} completed`} />
        <StatTile icon={Clock} label="Avg Turnaround" value={`${fmtDecimal(turnaroundData?.avg_days_overall)} days`} />
        <StatTile icon={Star} label="Avg Quality" value={reviewData?.avg_quality != null ? `${fmtDecimal(reviewData.avg_quality)} / 5` : '-'} />
        <StatTile icon={Calendar} label="Hours Logged" value={fmtDecimal(timeData?.total_hours)} sublabel={`${fmtDecimal(timeData?.avg_per_task)} avg per task`} />
      </div>

      {/* Two-column: Status breakdown + Task volume */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: spacing[4],
        marginBottom: spacing[6],
      }}>
        <GlowCard padding="24px">
          <h3 style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colours.neutral[900],
            margin: 0, marginBottom: spacing[5],
          }}>
            Task Status
          </h3>
          <StatusBar data={byStatusData} />
        </GlowCard>

        <GlowCard padding="24px">
          <h3 style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colours.neutral[900],
            margin: 0, marginBottom: spacing[5],
          }}>
            Task Volume
          </h3>
          {byMonthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={byMonthData} barCategoryGap="20%">
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: colours.neutral[500] }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Tasks" fill={colours.neutral[800]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], padding: spacing[6], textAlign: 'center' }}>
              No task data for this period
            </div>
          )}
        </GlowCard>
      </div>

      {/* Camper leaderboard */}
      <GlowCard padding="24px">
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: spacing[4],
        }}>
          <h3 style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            color: colours.neutral[900],
            margin: 0, display: 'flex', alignItems: 'center', gap: spacing[2],
          }}>
            <Users size={18} />
            Camper Performance
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '28px 1fr 80px 80px 80px',
          gap: spacing[3],
          padding: `0 0 ${spacing[2]} 0`,
          borderBottom: `1px solid ${colours.neutral[200]}`,
        }}>
          <span />
          <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>Camper</span>
          <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Tasks</span>
          <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>On Time</span>
          <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Quality</span>
        </div>

        {campers.length > 0 ? (
          campers.map((camper, i) => (
            <CamperRow key={camper.contractor_id || i} camper={camper} rank={i + 1} />
          ))
        ) : (
          <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], padding: spacing[6], textAlign: 'center' }}>
            No camper data available
          </div>
        )}
      </GlowCard>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Level Breakdown */}
      {earningsAnalytics?.by_level && earningsAnalytics.by_level.length > 0 && (
        <GlowCard style={{ marginTop: spacing[6] }}>
          <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[4] }}>
            Tasks by Level
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px 80px', gap: spacing[2], padding: `0 0 ${spacing[2]} 0`, borderBottom: `1px solid ${colours.neutral[200]}` }}>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase' }}>Level</span>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase' }}>Name</span>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', textAlign: 'right' }}>Active</span>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', textAlign: 'right' }}>Done</span>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', textAlign: 'right' }}>Value</span>
          </div>
          {earningsAnalytics.by_level.map((row) => (
            <div key={row.level} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 60px 80px', gap: spacing[2], padding: `${spacing[2]} 0`, borderBottom: `1px solid ${colours.neutral[100]}` }}>
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>Lv. {row.level}</span>
              <span style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600] }}>{row.level_name || '—'}</span>
              <span style={{ fontSize: typography.fontSize.sm, color: colours.neutral[900], textAlign: 'right' }}>{row.active}</span>
              <span style={{ fontSize: typography.fontSize.sm, color: colours.neutral[900], textAlign: 'right' }}>{row.completed}</span>
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], textAlign: 'right' }}>
                {row.total_value > 0 ? `$${Number(row.total_value).toLocaleString()}` : '—'}
              </span>
            </div>
          ))}
        </GlowCard>
      )}

      {/* Earnings Summary */}
      {earningsAnalytics?.earnings_summary && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing[4], marginTop: spacing[6] }}>
          <StatTile
            icon={DollarSign}
            label="Task Earnings"
            value={`$${fmtCount(earningsAnalytics.earnings_summary.task_earnings || 0)}`}
            sublabel="paid for completed tasks"
          />
          <StatTile
            icon={Gift}
            label="Bonus Cash"
            value={`$${fmtCount(earningsAnalytics.earnings_summary.bonus_earnings || 0)}`}
            sublabel="awarded as bonuses"
          />
          <StatTile
            icon={Star}
            label="Bonus XP"
            value={fmtCount(earningsAnalytics.earnings_summary.total_bonus_xp || 0)}
            sublabel={`to ${earningsAnalytics.earnings_summary.unique_earners || 0} campers`}
          />
        </div>
      )}

      {/* Kickback Breakdown (Director-only view) */}
      {earningsAnalytics?.earnings_summary?.total_campsite_share > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginTop: spacing[4] }}>
          <StatTile
            icon={DollarSign}
            label="Campsite Share (40%)"
            value={`$${fmtCount(earningsAnalytics.earnings_summary.total_campsite_share || 0)}`}
            sublabel="from Level 7+ tasks"
          />
          <StatTile
            icon={DollarSign}
            label="Camper Share (60%)"
            value={`$${fmtCount(earningsAnalytics.earnings_summary.total_camper_share || 0)}`}
            sublabel="paid to camp leaders"
          />
        </div>
      )}

      {/* Reward Panel */}
      <GlowCard style={{ marginTop: spacing[6] }}>
        <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[4] }}>
          <Gift size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: spacing[2] }} />
          Award Bonus
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4] }}>
          <div>
            <label style={{ display: 'block', fontSize: typography.fontSize.sm, color: colours.neutral[600], marginBottom: spacing[1] }}>Camper</label>
            <Select
              value={rewardUser}
              onChange={(e) => setRewardUser(e.target.value)}
              options={[
                { value: '', label: 'Select camper...' },
                ...campersList.map(c => ({ value: c.id, label: c.display_name }))
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: typography.fontSize.sm, color: colours.neutral[600], marginBottom: spacing[1] }}>Type</label>
            <Select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              options={[
                { value: 'bonus_cash', label: 'Cash Bonus ($)' },
                { value: 'bonus_xp', label: 'XP Bonus' },
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: typography.fontSize.sm, color: colours.neutral[600], marginBottom: spacing[1] }}>
              {rewardType === 'bonus_cash' ? 'Amount ($)' : 'XP Amount'}
            </label>
            <Input
              type="number"
              min="1"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder={rewardType === 'bonus_cash' ? 'e.g. 50' : 'e.g. 500'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: typography.fontSize.sm, color: colours.neutral[600], marginBottom: spacing[1] }}>Reason</label>
            <Input
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder="Great work on the logo redesign"
            />
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={!rewardUser || !rewardAmount || !rewardDescription || rewardSubmitting}
          onClick={async () => {
            setRewardSubmitting(true)
            try {
              const body = {
                target_user_id: rewardUser,
                type: rewardType,
                description: rewardDescription,
              }
              if (rewardType === 'bonus_cash') body.amount = Number(rewardAmount)
              else body.xp_amount = Number(rewardAmount)

              await awardBonus(body)
              addToast('Bonus awarded!', 'success')
              setRewardUser('')
              setRewardAmount('')
              setRewardDescription('')
              fetchAnalytics()
            } catch (err) {
              addToast('Failed to award bonus', 'error')
            } finally {
              setRewardSubmitting(false)
            }
          }}
          style={{ marginTop: spacing[4] }}
        >
          {rewardSubmitting ? 'Awarding...' : 'Award Bonus'}
        </Button>
      </GlowCard>
    </div>
  )
}
