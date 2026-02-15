import { useState, useEffect } from 'react'
import { CreditCard, Package, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Gift, Fish } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Spinner from '@/components/ui/Spinner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { apiFetch } from '@/services/apiFetch'
import { colours, spacing, typography, shadows } from '@/config/tokens'

export default function ClientCredits() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [creditsJson, packsJson] = await Promise.all([
          apiFetch('/credits/me'),
          apiFetch('/credits/packs'),
        ])
        if (creditsJson.success) {
          setBalance(creditsJson.data)
          setTransactions(creditsJson.data.transactions || [])
        }
        if (packsJson.success) setPacks(packsJson.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  const handlePurchase = async (pack) => {
    setPurchasing(pack.id)
    try {
      const json = await apiFetch('/credits/purchase', {
        method: 'POST',
        body: JSON.stringify({ pack_id: pack.id }),
      })
      if (json.success) {
        addToast(`${pack.credits.toLocaleString()} credits added!`, 'success')
        // Refresh
        const refresh = await apiFetch('/credits/me')
        if (refresh.success) {
          setBalance(refresh.data)
          setTransactions(refresh.data.transactions || [])
        }
      } else {
        addToast(json.error || 'Purchase failed', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) return <Spinner label="Loading credits..." />

  const available = balance?.available_credits || 0
  const held = balance?.held_credits || 0
  const total = balance?.total_credits || 0

  return (
    <div>
      <PageHeader title="Credits" subtitle="Manage your credit balance and purchase packs" />

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[4], marginBottom: spacing[6] }}>
        <Card>
          <div style={{ padding: spacing[4] }}>
            <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginBottom: spacing[1] }}>Available Credits</div>
            <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
              {available.toLocaleString()}
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: spacing[4] }}>
            <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginBottom: spacing[1] }}>Held (In-Progress Tasks)</div>
            <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
              {held.toLocaleString()}
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ padding: spacing[4] }}>
            <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginBottom: spacing[1] }}>Total Purchased</div>
            <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900] }}>
              {total.toLocaleString()}
            </div>
          </div>
        </Card>
      </div>

      {/* Credit Packs */}
      <div style={{ marginBottom: spacing[6] }}>
        <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[4] }}>
          Credit Packs
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: spacing[4] }}>
          {packs.map(pack => (
            <Card key={pack.id}>
              <div style={{ padding: spacing[4] }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
                  <div>
                    <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
                      {pack.name}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                      Tier {pack.tier}
                    </div>
                  </div>
                  {pack.savings_percent > 17 && (
                    <span style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      backgroundColor: colours.brand.primary + '15',
                      color: colours.brand.primary,
                      padding: `2px ${spacing[2]}`,
                      borderRadius: '6px',
                    }}>
                      Save {pack.savings_percent}%
                    </span>
                  )}
                </div>
                <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colours.neutral[900], marginBottom: spacing[1] }}>
                  {pack.credits.toLocaleString()} <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.normal, color: colours.neutral[500] }}>credits</span>
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600], marginBottom: spacing[2] }}>
                  ${pack.price.toLocaleString()} <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[400] }}>({pack.hours_per_week}hrs/week)</span>
                </div>
                <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[400], marginBottom: spacing[3] }}>
                  {pack.description}
                </div>
                <Button
                  onClick={() => handlePurchase(pack)}
                  disabled={purchasing === pack.id}
                  variant="primary"
                  size="sm"
                  style={{ width: '100%' }}
                >
                  {purchasing === pack.id ? 'Processing...' : 'Purchase'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[4] }}>
          Transaction History
        </h3>
        {transactions.length === 0 ? (
          <Card>
            <div style={{ padding: spacing[6], textAlign: 'center', color: colours.neutral[400] }}>
              No transactions yet. Purchase a credit pack to get started.
            </div>
          </Card>
        ) : (
          <Card>
            <div style={{ overflow: 'auto' }}>
              {transactions.map(tx => {
                const isPositive = tx.amount > 0
                return (
                  <div key={tx.id} style={{
                    padding: `${spacing[3]} ${spacing[4]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${colours.neutral[100]}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: isPositive ? colours.brand.primary + '15' : colours.neutral[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isPositive ? <ArrowUpRight size={14} color={colours.brand.primary} /> : <ArrowDownRight size={14} color={colours.neutral[500]} />}
                      </div>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[900] }}>
                          {tx.description || tx.type.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[400] }}>
                          {new Date(tx.created_at + 'Z').toLocaleDateString()}
                          {tx.task_title && ` · ${tx.task_title}`}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: isPositive ? colours.brand.primary : colours.neutral[600],
                    }}>
                      {isPositive ? '+' : ''}{tx.amount.toLocaleString()}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
