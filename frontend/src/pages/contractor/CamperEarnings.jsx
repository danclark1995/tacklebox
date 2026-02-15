import { useState, useEffect, useCallback } from 'react'
import { DollarSign, ArrowUpRight, ArrowDownRight, Gift, Clock, CheckCircle, XCircle } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, PageHeader, Button, Spinner } from '@/components/ui'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { colours, spacing, typography, radii } from '@/config/tokens'

export default function CamperEarnings() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCashout, setShowCashout] = useState(false)

  const fetchEarnings = useCallback(async () => {
    try {
      const res = await fetch(apiEndpoint('/earnings/me'), { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (err) {
      console.error('Fetch earnings error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEarnings() }, [fetchEarnings])

  const handleCashout = async () => {
    const amount = parseFloat(cashoutAmount)
    if (!amount || amount <= 0) return addToast('Enter a valid amount', 'error')
    if (amount > (data?.available_balance || 0)) return addToast('Insufficient balance', 'error')

    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint('/earnings/cashout'), {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const json = await res.json()
      if (json.success) {
        addToast(`Cashout of $${amount.toFixed(2)} requested`, 'success')
        setCashoutAmount('')
        setShowCashout(false)
        fetchEarnings()
      } else {
        addToast(json.error || 'Failed', 'error')
      }
    } catch (err) {
      addToast('Failed to request cashout', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}><Spinner size="lg" /></div>

  const balance = data?.available_balance || 0
  const totalEarned = data?.total_earnings || 0
  const earnings = data?.earnings || []
  const cashouts = data?.cashouts || []

  const typeIcon = {
    task_completion: <CheckCircle size={16} style={{ color: colours.neutral[600] }} />,
    bonus_cash: <Gift size={16} style={{ color: colours.neutral[600] }} />,
    bonus_xp: <ArrowUpRight size={16} style={{ color: colours.neutral[600] }} />,
  }

  const statusBadge = (status) => {
    const map = {
      pending: { bg: colours.neutral[200], color: colours.neutral[600], label: 'Pending' },
      processing: { bg: colours.neutral[300], color: colours.neutral[700], label: 'Processing' },
      completed: { bg: colours.neutral[800], color: colours.neutral[100], label: 'Completed' },
      rejected: { bg: colours.neutral[300], color: colours.neutral[500], label: 'Rejected' },
    }
    const s = map[status] || map.pending
    return (
      <span style={{
        fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium,
        padding: `2px ${spacing[2]}`, borderRadius: radii.full,
        backgroundColor: s.bg, color: s.color,
      }}>{s.label}</span>
    )
  }

  return (
    <div style={{ padding: spacing[6], maxWidth: 800, margin: '0 auto' }}>
      <PageHeader title="Earnings" subtitle="Track your income and request cashouts" />

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[6] }}>
        <GlowCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div style={{ width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colours.neutral[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} style={{ color: colours.neutral[700] }} />
            </div>
            <div>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</div>
              <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
                ${balance.toFixed(2)}
              </div>
            </div>
          </div>
          {balance > 0 && (
            <Button variant="primary" size="sm" onClick={() => setShowCashout(!showCashout)} style={{ marginTop: spacing[3], width: '100%' }}>
              Cash Out
            </Button>
          )}
        </GlowCard>

        <GlowCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div style={{ width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colours.neutral[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={24} style={{ color: colours.neutral[700] }} />
            </div>
            <div>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earned</div>
              <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
                ${totalEarned.toFixed(2)}
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Cashout Form */}
      {showCashout && (
        <GlowCard style={{ marginBottom: spacing[6] }}>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[3] }}>
            Request Cashout
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[4] }}>
            Enter the amount you'd like to withdraw. Cashouts are processed within 2-3 business days via Stripe.
          </div>
          <div style={{ display: 'flex', gap: spacing[3], alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colours.neutral[500] }}>$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={balance}
                value={cashoutAmount}
                onChange={e => setCashoutAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', padding: `${spacing[3]} ${spacing[3]} ${spacing[3]} ${spacing[6]}`,
                  backgroundColor: colours.neutral[100], border: `1px solid ${colours.neutral[200]}`,
                  borderRadius: radii.md, color: colours.neutral[900], fontSize: typography.fontSize.lg,
                  fontFamily: typography.fontFamily.sans, outline: 'none',
                }}
              />
            </div>
            <Button variant="primary" onClick={handleCashout} disabled={submitting}>
              {submitting ? 'Processing...' : 'Submit'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowCashout(false); setCashoutAmount('') }}>Cancel</Button>
          </div>
        </GlowCard>
      )}

      {/* Cashout History */}
      {cashouts.length > 0 && (
        <GlowCard style={{ marginBottom: spacing[6] }}>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[4] }}>
            Cashout Requests
          </div>
          {cashouts.map(c => (
            <div key={c.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: `${spacing[3]} 0`, borderBottom: `1px solid ${colours.neutral[100]}`,
            }}>
              <div>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>
                  ${c.amount.toFixed(2)}
                </div>
                <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                  {new Date(c.created_at).toLocaleDateString('en-NZ')}
                </div>
              </div>
              {statusBadge(c.status)}
            </div>
          ))}
        </GlowCard>
      )}

      {/* Earnings History */}
      <GlowCard>
        <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[4] }}>
          Earnings History
        </div>
        {earnings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing[6], color: colours.neutral[500] }}>
            No earnings yet. Complete tasks to start earning!
          </div>
        ) : earnings.map(e => (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'center', gap: spacing[3],
            padding: `${spacing[3]} 0`, borderBottom: `1px solid ${colours.neutral[100]}`,
          }}>
            {typeIcon[e.type] || <DollarSign size={16} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>
                {e.description || e.task_title || 'Earning'}
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                {new Date(e.created_at).toLocaleDateString('en-NZ')}
                {e.awarded_by_name && ` · Awarded by ${e.awarded_by_name}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {e.amount > 0 && (
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
                  +${e.amount.toFixed(2)}
                </div>
              )}
              {e.xp_amount > 0 && (
                <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[600] }}>
                  +{e.xp_amount} XP
                </div>
              )}
            </div>
          </div>
        ))}
      </GlowCard>
    </div>
  )
}
