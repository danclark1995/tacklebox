import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, DollarSign, AlertTriangle, Plus, X, Zap } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, PageHeader, Button, Spinner } from '@/components/ui'
import { apiFetch } from '@/services/apiFetch'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 7am to 5pm
const HOUR_HEIGHT = 60 // px per hour

function getWeekDays(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d.setDate(diff))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toLocal(iso) {
  return new Date(iso)
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const priorityColor = {
  urgent: colours.neutral[900],
  high: colours.neutral[700],
  medium: colours.neutral[500],
  low: colours.neutral[400],
}

export default function CalendarPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedule, setSchedule] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showTaskPicker, setShowTaskPicker] = useState(false)

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekStart = weekDays[0].toISOString()
  const weekEnd = new Date(weekDays[6].getTime() + 24 * 60 * 60 * 1000).toISOString()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [schedJson, taskJson] = await Promise.all([
        apiFetch(`/schedule?start=${weekStart}&end=${weekEnd}`),
        apiFetch('/tasks?status=assigned,in_progress'),
      ])
      if (schedJson.success) setSchedule(schedJson.data || [])
      if (taskJson.success) setTasks((taskJson.data || []).filter(t => 
        user.role === 'admin' || t.contractor_id === user.id
      ))
    } catch (err) {
      console.error('Calendar fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd, user])

  useEffect(() => { fetchData() }, [fetchData])

  const fetchSuggestions = async (taskId) => {
    setLoadingSuggestions(true)
    try {
      const json = await apiFetch(`/schedule/suggestions/${taskId}`)
      if (json.success) setSuggestions(json.data.suggestions || [])
    } catch (err) {
      console.error('Suggestions error:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleScheduleBlock = async (taskId, startTime, endTime) => {
    try {
      const json = await apiFetch('/schedule', {
        method: 'POST',
        body: JSON.stringify({ task_id: taskId, start_time: startTime, end_time: endTime }),
      })
      if (json.success) {
        addToast('Task scheduled', 'success')
        setSelectedTask(null)
        setSuggestions([])
        setShowTaskPicker(false)
        fetchData()
      } else {
        addToast(json.error || 'Failed', 'error')
      }
    } catch (err) {
      addToast('Failed to schedule', 'error')
    }
  }

  const handleDeleteBlock = async (blockId) => {
    try {
      const json = await apiFetch(`/schedule/${blockId}`, {
        method: 'DELETE',
      })
      if (json.success) {
        addToast('Block removed', 'success')
        fetchData()
      }
    } catch (err) {
      addToast('Failed to remove', 'error')
    }
  }

  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const today = new Date()

  // Unscheduled tasks
  const scheduledTaskIds = new Set(schedule.map(s => s.task_id))
  const unscheduled = tasks.filter(t => !scheduledTaskIds.has(t.id))

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}><Spinner size="lg" /></div>

  return (
    <div style={{ padding: spacing[6], maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
        <PageHeader title="Calendar" subtitle="Schedule your work blocks" />
        <Button variant="primary" size="sm" onClick={() => setShowTaskPicker(!showTaskPicker)}>
          <Plus size={16} /> Schedule Task
        </Button>
      </div>

      {/* Task Picker + Suggestions */}
      {showTaskPicker && (
        <GlowCard style={{ marginBottom: spacing[4] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
            <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
              <Zap size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: spacing[2] }} />
              Smart Schedule
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setShowTaskPicker(false); setSelectedTask(null); setSuggestions([]) }}>
              <X size={16} />
            </Button>
          </div>

          {!selectedTask ? (
            <div>
              <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[3] }}>
                Pick a task to schedule — we'll find the best time slots for you.
              </div>
              {unscheduled.length === 0 ? (
                <div style={{ color: colours.neutral[500], textAlign: 'center', padding: spacing[4] }}>
                  All assigned tasks are already scheduled!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {unscheduled.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { setSelectedTask(t); fetchSuggestions(t.id) }}
                      style={{
                        padding: `${spacing[3]} ${spacing[4]}`, borderRadius: radii.md,
                        backgroundColor: colours.neutral[50], cursor: 'pointer',
                        border: `1px solid ${colours.neutral[200]}`,
                        transition: `background-color ${transitions.fast}`,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[50]}
                    >
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>
                          {t.title}
                        </div>
                        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                          {t.client_name || t.category_name}
                          {t.estimated_hours && ` · ${t.estimated_hours}h`}
                          {t.total_payout && ` · $${t.total_payout}`}
                        </div>
                      </div>
                      {t.deadline && (
                        <div style={{ fontSize: typography.fontSize.xs, color: new Date(t.deadline) < new Date(Date.now() + 3*86400000) ? colours.neutral[900] : colours.neutral[500] }}>
                          Due {new Date(t.deadline).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(null); setSuggestions([]) }}>
                  <ChevronLeft size={16} /> Back
                </Button>
                <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
                  {selectedTask.title}
                </div>
              </div>

              <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[3] }}>
                Recommended time slots based on your existing schedule:
              </div>

              {loadingSuggestions ? (
                <div style={{ textAlign: 'center', padding: spacing[4] }}><Spinner size="md" /></div>
              ) : suggestions.length === 0 ? (
                <div style={{ color: colours.neutral[500], textAlign: 'center', padding: spacing[4] }}>
                  No available slots found this week.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => handleScheduleBlock(selectedTask.id, s.start_time, s.end_time)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: `${spacing[3]} ${spacing[4]}`, borderRadius: radii.md,
                        backgroundColor: colours.neutral[50], cursor: 'pointer',
                        border: `1px solid ${s.fit === 'urgent' ? colours.neutral[700] : colours.neutral[200]}`,
                        transition: `background-color ${transitions.fast}`,
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[50]}
                    >
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
                          {s.day_label}
                        </div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600] }}>
                          {s.time_label}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        {s.fit === 'urgent' && <AlertTriangle size={14} style={{ color: colours.neutral[700] }} />}
                        <span style={{
                          fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium,
                          padding: `2px ${spacing[2]}`, borderRadius: radii.full,
                          backgroundColor: s.fit === 'urgent' ? colours.neutral[800] : s.fit === 'soon' ? colours.neutral[300] : colours.neutral[200],
                          color: s.fit === 'urgent' ? colours.neutral[100] : colours.neutral[700],
                        }}>
                          {s.fit === 'urgent' ? 'Urgent' : s.fit === 'soon' ? 'Due soon' : 'Good fit'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </GlowCard>
      )}

      {/* Week Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[4] }}>
        <Button variant="ghost" size="sm" onClick={prevWeek}><ChevronLeft size={18} /></Button>
        <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
          {weekDays[0].toLocaleDateString('en-NZ', { month: 'long', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-NZ', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <Button variant="ghost" size="sm" onClick={nextWeek}><ChevronRight size={18} /></Button>
      </div>

      {/* Calendar Grid */}
      <GlowCard style={{ padding: 0, overflow: 'hidden' }}>
        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: `1px solid ${colours.neutral[200]}` }}>
          <div style={{ padding: spacing[2], borderRight: `1px solid ${colours.neutral[200]}` }} />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            return (
              <div key={i} style={{
                padding: spacing[3], textAlign: 'center',
                borderRight: i < 6 ? `1px solid ${colours.neutral[200]}` : 'none',
                backgroundColor: isToday ? colours.neutral[100] : isWeekend ? colours.neutral[50] : 'transparent',
              }}>
                <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], textTransform: 'uppercase' }}>
                  {day.toLocaleDateString('en-NZ', { weekday: 'short' })}
                </div>
                <div style={{
                  fontSize: typography.fontSize.lg, fontWeight: isToday ? typography.fontWeight.bold : typography.fontWeight.medium,
                  color: isToday ? colours.neutral[900] : colours.neutral[600],
                }}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', position: 'relative' }}>
          {/* Hour labels */}
          <div>
            {HOURS.map(h => (
              <div key={h} style={{
                height: HOUR_HEIGHT, borderBottom: `1px solid ${colours.neutral[100]}`,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                paddingRight: spacing[2], paddingTop: 2,
                fontSize: '11px', color: colours.neutral[400],
                borderRight: `1px solid ${colours.neutral[200]}`,
              }}>
                {h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayBlocks = schedule.filter(s => isSameDay(toLocal(s.start_time), day))
            const isWeekend = day.getDay() === 0 || day.getDay() === 6

            return (
              <div key={dayIdx} style={{
                position: 'relative',
                borderRight: dayIdx < 6 ? `1px solid ${colours.neutral[200]}` : 'none',
                backgroundColor: isWeekend ? colours.neutral[50] : 'transparent',
              }}>
                {/* Hour grid lines */}
                {HOURS.map(h => (
                  <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${colours.neutral[100]}` }} />
                ))}

                {/* Schedule blocks */}
                {dayBlocks.map(block => {
                  const start = toLocal(block.start_time)
                  const end = toLocal(block.end_time)
                  const startHour = start.getHours() + start.getMinutes() / 60
                  const endHour = end.getHours() + end.getMinutes() / 60
                  const top = (startHour - HOURS[0]) * HOUR_HEIGHT
                  const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 24)

                  return (
                    <div
                      key={block.id}
                      style={{
                        position: 'absolute', top, left: 2, right: 2, height,
                        backgroundColor: colours.neutral[800], borderRadius: radii.sm,
                        padding: `${spacing[1]} ${spacing[2]}`, overflow: 'hidden',
                        borderLeft: `3px solid ${priorityColor[block.priority] || colours.neutral[600]}`,
                        cursor: 'pointer', zIndex: 1,
                      }}
                      title={`${block.task_title}\n${start.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <div style={{
                        fontSize: '11px', fontWeight: typography.fontWeight.semibold,
                        color: colours.neutral[100], lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {block.task_title}
                      </div>
                      {height >= 40 && (
                        <div style={{ fontSize: '10px', color: colours.neutral[400], marginTop: 2 }}>
                          {block.client_name}
                          {block.total_payout && ` · $${block.total_payout}`}
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id) }}
                        style={{
                          position: 'absolute', top: 2, right: 2, background: 'none',
                          border: 'none', cursor: 'pointer', color: colours.neutral[400],
                          padding: 2, lineHeight: 1,
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </GlowCard>

      {/* Unscheduled tasks list */}
      {unscheduled.length > 0 && (
        <GlowCard style={{ marginTop: spacing[4] }}>
          <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], marginBottom: spacing[3] }}>
            Unscheduled Tasks ({unscheduled.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            {unscheduled.map(t => (
              <div
                key={t.id}
                onClick={() => { setShowTaskPicker(true); setSelectedTask(t); fetchSuggestions(t.id) }}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`, borderRadius: radii.md,
                  backgroundColor: colours.neutral[100], cursor: 'pointer',
                  border: `1px solid ${colours.neutral[200]}`, fontSize: typography.fontSize.xs,
                  display: 'flex', alignItems: 'center', gap: spacing[2],
                  transition: `background-color ${transitions.fast}`,
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[200]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
              >
                <Clock size={12} style={{ color: colours.neutral[500] }} />
                <span style={{ color: colours.neutral[900], fontWeight: typography.fontWeight.medium }}>{t.title}</span>
                {t.estimated_hours && <span style={{ color: colours.neutral[500] }}>{t.estimated_hours}h</span>}
                {t.total_payout && <span style={{ color: colours.neutral[600] }}>${t.total_payout}</span>}
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  )
}
