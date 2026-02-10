import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { Card, Select, DatePicker, Spinner, PageHeader, DataTable, Button } from '@/components/ui'
import StatCard from '@/components/features/analytics/StatCard'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import {
  getTaskOverview,
  getTurnaround,
  getCategoryBreakdown,
  getProjectProgress,
  getContractorPerformance,
  getTimeTracking,
  getReviewInsights,
} from '@/services/analytics'
import { colours, spacing, typography, radii, shadows, breakpoints } from '@/config/tokens'

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
  return `${fmtDecimal(n, 1)}%`
}

// ── Chart colour palettes ─────────────────────────────────────────
const STATUS_COLOURS = [
  colours.neutral[900],
  colours.neutral[700],
  colours.neutral[700],
  colours.neutral[700],
  colours.neutral[700],
  colours.neutral[700],
  colours.neutral[400],
  colours.neutral[600],
]

const PRIORITY_COLOUR_MAP = {
  urgent: colours.neutral[700],
  high: colours.neutral[700],
  medium: colours.neutral[700],
  low: colours.neutral[400],
}

// ── Custom Recharts tooltip ───────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div style={{
      backgroundColor: colours.white,
      border: `1px solid ${colours.neutral[200]}`,
      borderRadius: radii.md,
      padding: spacing[3],
      boxShadow: shadows.md,
      fontFamily: typography.fontFamily.sans,
      fontSize: typography.fontSize.sm,
    }}>
      {label && (
        <p style={{ fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], margin: 0, marginBottom: spacing[1] }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || colours.neutral[700], margin: 0 }}>
          {entry.name}: {typeof entry.value === 'number' ? fmtDecimal(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <Card padding="md">
      <h3 style={{
        fontFamily: typography.fontFamily.sans,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colours.neutral[900],
        margin: 0,
        marginBottom: spacing[4],
      }}>
        {title}
      </h3>
      {children}
    </Card>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function AdminAnalytics() {
  const { user } = useAuth()
  const { addToast } = useToast()

  // Filter state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [clientId, setClientId] = useState('')
  const [contractorId, setContractorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [projectId, setProjectId] = useState('')

  // Filter options (loaded once)
  const [clients, setClients] = useState([])
  const [contractors, setContractors] = useState([])
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])

  // Analytics data
  const [taskData, setTaskData] = useState(null)
  const [turnaroundData, setTurnaroundData] = useState(null)
  const [categoryData, setCategoryData] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [contractorData, setContractorData] = useState(null)
  const [timeData, setTimeData] = useState(null)
  const [reviewData, setReviewData] = useState(null)

  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Build filters object from state
  const buildFilters = useCallback(() => {
    const filters = {}
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo) filters.date_to = dateTo
    if (clientId) filters.client_id = clientId
    if (contractorId) filters.contractor_id = contractorId
    if (categoryId) filters.category_id = categoryId
    if (projectId) filters.project_id = projectId
    return filters
  }, [dateFrom, dateTo, clientId, contractorId, categoryId, projectId])

  // Load filter options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [usersRes, catsRes, projRes] = await Promise.all([
          fetch(apiEndpoint('/users'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/categories'), { headers: { ...getAuthHeaders() } }),
          fetch(apiEndpoint('/projects'), { headers: { ...getAuthHeaders() } }),
        ])

        const usersJson = await usersRes.json()
        const catsJson = await catsRes.json()
        const projJson = await projRes.json()

        if (usersJson.success) {
          setClients(usersJson.data.filter(u => u.role === 'client'))
          setContractors(usersJson.data.filter(u => u.role === 'contractor'))
        }
        if (catsJson.success) setCategories(catsJson.data || [])
        if (projJson.success) setProjects(projJson.data || [])
      } catch (err) {
        addToast('Failed to load filter options', 'error')
      }
    }
    loadFilterOptions()
  }, [addToast])

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    const filters = buildFilters()

    try {
      const [tasks, turnaround, cats, projs, contrs, time, reviews] = await Promise.all([
        getTaskOverview(filters),
        getTurnaround(filters),
        getCategoryBreakdown(filters),
        getProjectProgress(filters),
        getContractorPerformance(filters),
        getTimeTracking(filters),
        getReviewInsights(filters),
      ])

      setTaskData(tasks)
      setTurnaroundData(turnaround)
      setCategoryData(cats)
      setProjectData(projs)
      setContractorData(contrs)
      setTimeData(time)
      setReviewData(reviews)
    } catch (err) {
      addToast(err.message || 'Failed to load analytics', 'error')
    } finally {
      setLoading(false)
    }
  }, [buildFilters, addToast])

  // Load on mount
  useEffect(() => {
    fetchAnalytics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    fetchAnalytics()
  }

  // ── Sorting helper for tables ─────────────────────────────────
  function sortData(data, config) {
    if (!config.key || !data) return data
    return [...data].sort((a, b) => {
      const aVal = a[config.key]
      const bVal = b[config.key]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return config.direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return config.direction === 'asc' ? -1 : 1
      if (aStr > bStr) return config.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  function handleSort(key) {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function sortableHeader(label, key) {
    const isActive = sortConfig.key === key
    const arrow = isActive ? (sortConfig.direction === 'asc' ? ' \u2191' : ' \u2193') : ''
    return (
      <span
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => handleSort(key)}
      >
        {label}{arrow}
      </span>
    )
  }

  // ── Styles ────────────────────────────────────────────────────
  const pageStyles = {
    fontFamily: typography.fontFamily.sans,
  }

  const filtersBarStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
    alignItems: 'end',
  }

  const summaryRowStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[8],
  }

  const chartGridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(1, 1fr)',
    gap: spacing[6],
  }

  const chartContainerStyles = {
    minHeight: '300px',
    width: '100%',
  }

  const statsRowStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: spacing[3],
    marginBottom: spacing[4],
  }

  const twoColStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: spacing[4],
  }

  // ── Responsive media query injection via style tag ─────────
  const responsiveStyles = `
    @media (min-width: ${breakpoints.lg}) {
      .analytics-chart-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .analytics-two-col { grid-template-columns: 1fr 1fr !important; }
    }
  `

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pageStyles}>
        <PageHeader
          title="Analytics Dashboard"
          subtitle="Comprehensive overview of task, project, and camper performance"
        />
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[16] }}>
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  // ── Build chart data ──────────────────────────────────────────
  const byMonthData = taskData?.by_month || []
  const byStatusData = taskData?.by_status || []
  const turnaroundByPriority = turnaroundData?.by_priority || []
  const categoryTableData = categoryData?.data || []
  const projectTableData = projectData?.data || []
  const contractorTableData = contractorData?.data || []
  const timeByContractor = (timeData?.by_contractor || []).slice(0, 10)

  // ── Category table columns ────────────────────────────────────
  const categoryColumns = [
    { key: 'category_name', label: 'Category' },
    {
      key: 'task_count',
      label: 'Tasks',
      render: (val) => fmtCount(val),
    },
    {
      key: 'avg_hours',
      label: 'Avg Hours',
      render: (val) => fmtDecimal(val),
    },
    {
      key: 'avg_quality',
      label: 'Avg Quality',
      render: (val) => val != null ? `${fmtDecimal(val)} / 5` : '-',
    },
  ]

  // ── Project table columns ─────────────────────────────────────
  const projectColumns = [
    {
      key: 'project_name',
      label: sortableHeader('Project', 'project_name'),
    },
    {
      key: 'total_tasks',
      label: sortableHeader('Total Tasks', 'total_tasks'),
      render: (val) => fmtCount(val),
    },
    {
      key: 'completed_tasks',
      label: sortableHeader('Completed', 'completed_tasks'),
      render: (val) => fmtCount(val),
    },
    {
      key: 'completion_pct',
      label: sortableHeader('Completion %', 'completion_pct'),
      render: (val) => fmtPct(val),
    },
    {
      key: 'total_hours',
      label: sortableHeader('Total Hours', 'total_hours'),
      render: (val) => fmtDecimal(val),
    },
  ]

  // ── Contractor table columns ──────────────────────────────────
  const contractorColumns = [
    { key: 'display_name', label: 'Camper' },
    {
      key: 'tasks_completed',
      label: sortableHeader('Tasks', 'tasks_completed'),
      render: (val) => fmtCount(val),
    },
    {
      key: 'on_time_pct',
      label: sortableHeader('On-Time %', 'on_time_pct'),
      render: (val) => fmtPct(val),
    },
    {
      key: 'avg_quality',
      label: sortableHeader('Avg Quality', 'avg_quality'),
      render: (val) => {
        if (val == null) return '-'
        const stars = Math.round(val)
        const filled = '\u2605'
        const empty = '\u2606'
        return (
          <span style={{ color: colours.neutral[600], letterSpacing: '1px' }}>
            {filled.repeat(stars)}{empty.repeat(5 - stars)}
            <span style={{ color: colours.neutral[600], marginLeft: spacing[1], letterSpacing: 'normal' }}>
              {fmtDecimal(val)}
            </span>
          </span>
        )
      },
    },
    {
      key: 'total_hours',
      label: sortableHeader('Hours', 'total_hours'),
      render: (val) => fmtDecimal(val),
    },
    {
      key: 'level',
      label: sortableHeader('Level', 'level'),
      render: (val) => fmtCount(val),
    },
    {
      key: 'total_xp',
      label: sortableHeader('XP', 'total_xp'),
      render: (val) => fmtCount(val),
    },
  ]

  const sortedProjectData = sortData(projectTableData, sortConfig)
  const sortedContractorData = sortData(contractorTableData, sortConfig)

  return (
    <div style={pageStyles}>
      <style>{responsiveStyles}</style>

      <PageHeader
        title="Analytics Dashboard"
        subtitle="Comprehensive overview of task, project, and camper performance"
      />

      {/* ── Filters Bar ──────────────────────────────────────── */}
      <Card padding="md">
        <div style={filtersBarStyles}>
          <DatePicker
            label="Date From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <DatePicker
            label="Date To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="All Clients"
            options={[
              { value: '', label: 'All Clients' },
              ...clients.map(c => ({
                value: c.id,
                label: c.display_name || c.name,
              })),
            ]}
          />
          <Select
            label="Camper"
            value={contractorId}
            onChange={(e) => setContractorId(e.target.value)}
            placeholder="All Campers"
            options={[
              { value: '', label: 'All Campers' },
              ...contractors.map(c => ({
                value: c.id,
                label: c.display_name || c.name,
              })),
            ]}
          />
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="All Categories"
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(c => ({
                value: c.id,
                label: c.name,
              })),
            ]}
          />
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="All Projects"
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map(p => ({
                value: p.id,
                label: p.name,
              })),
            ]}
          />
          <Button variant="primary" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </Card>

      <div style={{ height: spacing[6] }} />

      {/* ── Summary Stats Row ────────────────────────────────── */}
      <div style={summaryRowStyles}>
        <StatCard
          label="Total Tasks"
          value={fmtCount(taskData?.total)}
          colour={colours.neutral[900]}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
        />
        <StatCard
          label="Avg Turnaround"
          value={`${fmtDecimal(turnaroundData?.avg_days_overall)} days`}
          colour={colours.neutral[700]}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Total Hours Logged"
          value={fmtDecimal(timeData?.total_hours)}
          colour={colours.neutral[700]}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Avg Quality Rating"
          value={`${fmtDecimal(reviewData?.avg_quality)} / 5`}
          colour={colours.neutral[700]}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        />
      </div>

      {/* ── Charts Grid ──────────────────────────────────────── */}
      <div style={chartGridStyles} className="analytics-chart-grid">

        {/* Section 1: Task Overview */}
        <Section title="Task Overview">
          <div style={statsRowStyles}>
            <StatCard
              label="Total Tasks"
              value={fmtCount(taskData?.total)}
              colour={colours.neutral[900]}
            />
            {byStatusData.map((s, i) => (
              <StatCard
                key={s.status}
                label={s.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                value={fmtCount(s.count)}
                colour={STATUS_COLOURS[i % STATUS_COLOURS.length]}
              />
            ))}
          </div>

          <div style={twoColStyles} className="analytics-two-col">
            {/* Line chart: volume over time */}
            <div style={chartContainerStyles}>
              <h4 style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colours.neutral[700],
                marginBottom: spacing[2],
              }}>
                Task Volume Over Time
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={byMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colours.neutral[200]} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: colours.neutral[600] }}
                    stroke={colours.neutral[300]}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: colours.neutral[600] }}
                    stroke={colours.neutral[300]}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Tasks"
                    stroke={colours.neutral[900]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: colours.neutral[900] }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Donut chart: status distribution */}
            <div style={chartContainerStyles}>
              <h4 style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colours.neutral[700],
                marginBottom: spacing[2],
              }}>
                Status Distribution
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byStatusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    label={({ status, count }) => `${status} (${count})`}
                  >
                    {byStatusData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLOURS[i % STATUS_COLOURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        {/* Section 2: Turnaround */}
        <Section title="Turnaround">
          <div style={statsRowStyles}>
            <StatCard
              label="Average Turnaround"
              value={`${fmtDecimal(turnaroundData?.avg_days_overall)} days`}
              colour={colours.neutral[700]}
            />
          </div>

          <div style={chartContainerStyles}>
            <h4 style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colours.neutral[700],
              marginBottom: spacing[2],
            }}>
              Average Turnaround by Priority
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={turnaroundByPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke={colours.neutral[200]} />
                <XAxis
                  dataKey="priority"
                  tick={{ fontSize: 12, fill: colours.neutral[600] }}
                  stroke={colours.neutral[300]}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: colours.neutral[600] }}
                  stroke={colours.neutral[300]}
                  label={{
                    value: 'Days',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: colours.neutral[500] },
                  }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="avg_days" name="Avg Days" radius={[4, 4, 0, 0]}>
                  {turnaroundByPriority.map((entry) => (
                    <Cell
                      key={entry.priority}
                      fill={PRIORITY_COLOUR_MAP[entry.priority] || colours.neutral[400]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Section 3: Category Breakdown */}
        <Section title="Category Breakdown">
          <div style={twoColStyles} className="analytics-two-col">
            <div style={chartContainerStyles}>
              <h4 style={{
                fontFamily: typography.fontFamily.sans,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colours.neutral[700],
                marginBottom: spacing[2],
              }}>
                Tasks per Category
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categoryTableData}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={colours.neutral[200]} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: colours.neutral[600] }}
                    stroke={colours.neutral[300]}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category_name"
                    tick={{ fontSize: 12, fill: colours.neutral[600] }}
                    stroke={colours.neutral[300]}
                    width={75}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="task_count" name="Tasks" fill={colours.neutral[900]} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="avg_hours" name="Avg Hours" fill={colours.neutral[700]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <DataTable
                columns={categoryColumns}
                data={categoryTableData}
                emptyMessage="No category data available"
              />
            </div>
          </div>
        </Section>

        {/* Section 4: Project Progress */}
        <Section title="Project Progress">
          <DataTable
            columns={projectColumns}
            data={sortedProjectData}
            emptyMessage="No project data available"
          />
        </Section>

        {/* Section 5: Contractor Performance */}
        <Section title="Camper Performance">
          <DataTable
            columns={contractorColumns}
            data={sortedContractorData}
            emptyMessage="No camper data available"
          />
        </Section>

        {/* Section 6: Time Tracking */}
        <Section title="Time Tracking">
          <div style={statsRowStyles}>
            <StatCard
              label="Total Hours"
              value={fmtDecimal(timeData?.total_hours)}
              colour={colours.neutral[700]}
            />
            <StatCard
              label="Avg Hours per Task"
              value={fmtDecimal(timeData?.avg_per_task)}
              colour={colours.neutral[700]}
            />
          </div>

          <div style={chartContainerStyles}>
            <h4 style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colours.neutral[700],
              marginBottom: spacing[2],
            }}>
              Hours by Camper (Top 10)
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeByContractor}>
                <CartesianGrid strokeDasharray="3 3" stroke={colours.neutral[200]} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: colours.neutral[600] }}
                  stroke={colours.neutral[300]}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: colours.neutral[600] }}
                  stroke={colours.neutral[300]}
                  label={{
                    value: 'Hours',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: colours.neutral[500] },
                  }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="hours" name="Hours" fill={colours.neutral[900]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Section 7: Review Insights */}
        <Section title="Review Insights">
          <div style={statsRowStyles}>
            <StatCard
              label="Total Reviews"
              value={fmtCount(reviewData?.total_reviews)}
              colour={colours.neutral[900]}
            />
            <StatCard
              label="Completion Rate"
              value={fmtPct(reviewData?.completion_rate)}
              colour={colours.neutral[700]}
            />
            <StatCard
              label="Avg Difficulty"
              value={`${fmtDecimal(reviewData?.avg_difficulty)} / 5`}
              colour={colours.neutral[700]}
            />
            <StatCard
              label="Avg Quality"
              value={`${fmtDecimal(reviewData?.avg_quality)} / 5`}
              colour={colours.neutral[700]}
            />
          </div>
        </Section>
      </div>
    </div>
  )
}
