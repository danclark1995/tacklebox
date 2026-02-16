import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, DollarSign, AlertTriangle, Plus, X, Zap, Layers } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, PageHeader, Button, Spinner } from '@/components/ui'
import { listBlocks, createBlock, deleteBlock, getSuggestions } from '@/services/schedule'
import { listTasks } from '@/services/tasks'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const HOUR_START = 6
const HOUR_END = 22
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => i + HOUR_START)
const HOUR_HEIGHT = 56
const WORK_START = 9
const WORK_END = 17

function getWeekDays(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(monday)
    nd.setDate(monday.getDate() + i)
    return nd
  })
}

function toLocal(iso) { return new Date(iso) }

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatHour(h) {
  if (h === 0 || h === 24) return '12am'
  if (h === 12) return '12pm'
  return h > 12 ? `${h - 12}pm` : `${h}am`
}

function formatTime(date) {
  return date.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const priorityColour = {
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
  const [quickSchedule, setQuickSchedule] = useState(null)
  const gridRef = useRef(null)
  const nowRef = useRef(null)

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekStart = weekDays[0].toISOString()
  const weekEnd = new Date(weekDays[6].getTime() + 24 * 60 * 60 * 1000).toISOString()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [schedData, taskData] = await Promise.all([
        listBlocks(weekStart, weekEnd),
        listTasks({ status: 'assigned,in_progress' }),
      ])
      setSchedule(schedData || [])
      setTasks((taskData || []).filter(t =>
        user.role === 'admin' || t.contractor_id === user.id
      ))
    } catch (err) {
      console.error('Calendar fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd, user])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!loading && nowRef.current) {
      nowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [loading])

  const fetchSuggestions = async (taskId) => {
    setLoadingSuggestions(true)
    try {
      const suggestData = await getSuggestions(taskId)
      setSuggestions(suggestData.suggestions || [])
    } catch (err) {
      console.error('Suggestions error:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleScheduleBlock = async (taskId, startTime, endTime) => {
    try {
      await createBlock({ task_id: taskId, start_time: startTime, end_time: endTime })
      addToast('Task scheduled', 'success')
      setSelectedTask(null)
      setSuggestions([])
      setShowTaskPicker(false)
      setQuickSchedule(null)
      fetchData()
    } catch (err) {
      addToast('Failed to schedule', 'error')
    }
  }

  const handleDeleteBlock = async (blockId) => {
    try {
      await deleteBlock(blockId)
      addToast('Block removed', 'success')
      fetchData()
    } catch (err) {
      addToast('Failed to remove', 'error')
    }
  }

  const scheduledTaskIds = new Set(schedule.map(s => s.task_id))
  const unscheduled = tasks.filter(t => !scheduledTaskIds.has(t.id))

  const handleCellClick = (dayIdx, hour) => {
    if (unscheduled.length === 0) {
      addToast('No unscheduled tasks available', 'info')
      return
    }
    setQuickSchedule({ dayIdx, hour })
    setShowTaskPicker(false)
  }

  const handleQuickAssign = async (task) => {
    if (!quickSchedule) return
    const day = weekDays[quickSchedule.dayIdx]
    const start = new Date(day)
    start.setHours(quickSchedule.hour, 0, 0, 0)
    const hours = task.estimated_hours || 1
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
    await handleScheduleBlock(task.id, start.toISOString(), end.toISOString())
  }

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }
  const goToday = () => setCurrentDate(new Date())

  const today = new Date()
  const isThisWeek = weekDays.some(d => isSameDay(d, today))
  const nowHour = today.getHours() + today.getMinutes() / 60
  const nowTop = (nowHour - HOUR_START) * HOUR_HEIGHT
  const nowDayIdx = weekDays.findIndex(d => isSameDay(d, today))

  const taskDeadlinesByDay = weekDays.map(day =>
    tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), day))
  )

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}><Spinner size="lg" /></div>

  return (
    <div style={{ padding: spacing[6], maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4], flexWrap: 'wrap', gap: spacing[3] }}>
        <PageHeader title="Calendar" subtitle={`${tasks.length} active tasks · ${schedule.length} scheduled blocks`} />
        <div style={{ display: 'flex', gap: spacing[2] }}>
          {!isThisWeek && <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>}
          <Button variant="primary" size="sm" onClick={() => { setShowTaskPicker(!showTaskPicker); setQuickSchedule(null) }}>
            <Zap size={14} /> Smart Schedule
          </Button>
        </div>
      </div>

      {/* Quick Schedule Picker */}
      {quickSchedule && (
        <GlowCard style={{ marginBottom: spacing[4] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>
              Schedule for {weekDays[quickSchedule.dayIdx].toLocaleDateString('en-NZ', { weekday: 'long', month: 'short', day: 'numeric' })} at {formatHour(quickSchedule.hour)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setQuickSchedule(null)}><X size={14} /></Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {unscheduled.map(t => (
              <div
                key={t.id}
                onClick={() => handleQuickAssign(t)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: `${spacing[2]} ${spacing[3]}`, borderRadius: radii.md,
                  backgroundColor: colours.neutral[50], cursor: 'pointer',
                  border: `1px solid ${colours.neutral[200]}`, transition: `background-color ${transitions.fast}`,
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[50]}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                  <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{t.title}</span>
                  {t.complexity_level != null && <span style={{ fontSize: '10px', color: colours.neutral[500], padding: '1px 4px', border: `1px solid ${colours.neutral[300]}`, borderRadius: '3px' }}>L{t.complexity_level}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                  {t.estimated_hours && <span>{t.estimated_hours}h</span>}
                  {t.total_payout && <span>${Number(t.total_payout).toFixed(0)}</span>}
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Smart Schedule Panel */}
      {showTaskPicker && (
        <GlowCard style={{ marginBottom: spacing[4] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
            <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <Zap size={18} /> Smart Schedule
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setShowTaskPicker(false); setSelectedTask(null); setSuggestions([]) }}><X size={16} /></Button>
          </div>
          {!selectedTask ? (
            <div>
              <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[3] }}>
                Pick a task — we will find the best time slots based on your schedule and deadlines.
              </div>
              {unscheduled.length === 0 ? (
                <div style={{ color: colours.neutral[500], textAlign: 'center', padding: spacing[4] }}>All assigned tasks are already scheduled.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {unscheduled.map(t => (
                    <div key={t.id} onClick={() => { setSelectedTask(t); fetchSuggestions(t.id) }}
                      style={{ padding: `${spacing[3]} ${spacing[4]}`, borderRadius: radii.md, backgroundColor: colours.neutral[50], cursor: 'pointer', border: `1px solid ${colours.neutral[200]}`, transition: `background-color ${transitions.fast}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[50]}
                    >
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{t.title}</div>
                        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginTop: '2px' }}>
                          {t.client_name || t.category_name}{t.estimated_hours && ` · ${t.estimated_hours}h`}{t.total_payout && ` · $${Number(t.total_payout).toFixed(0)}`}
                        </div>
                      </div>
                      {t.deadline && (
                        <div style={{ fontSize: typography.fontSize.xs, color: new Date(t.deadline) < new Date(Date.now() + 3 * 86400000) ? colours.neutral[900] : colours.neutral[500] }}>
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
                <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(null); setSuggestions([]) }}><ChevronLeft size={16} /> Back</Button>
                <div>
                  <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>{selectedTask.title}</div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>
                    {selectedTask.estimated_hours && `${selectedTask.estimated_hours}h`}{selectedTask.total_payout && ` · $${Number(selectedTask.total_payout).toFixed(0)}`}{selectedTask.deadline && ` · Due ${new Date(selectedTask.deadline).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}`}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[3] }}>Recommended time slots:</div>
              {loadingSuggestions ? (
                <div style={{ textAlign: 'center', padding: spacing[4] }}><Spinner size="md" /></div>
              ) : suggestions.length === 0 ? (
                <div style={{ color: colours.neutral[500], textAlign: 'center', padding: spacing[4] }}>No available slots found. Try clicking an empty time slot on the calendar.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {suggestions.map((s, i) => (
                    <div key={i} onClick={() => handleScheduleBlock(selectedTask.id, s.start_time, s.end_time)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing[3]} ${spacing[4]}`, borderRadius: radii.md, backgroundColor: colours.neutral[50], cursor: 'pointer', border: `1px solid ${s.fit === 'urgent' ? colours.neutral[700] : colours.neutral[200]}`, transition: `background-color ${transitions.fast}` }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[50]}
                    >
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>{s.day_label}</div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600] }}>{s.time_label}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        {s.fit === 'urgent' && <AlertTriangle size={14} style={{ color: colours.neutral[700] }} />}
                        <span style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, padding: `2px ${spacing[2]}`, borderRadius: radii.full, backgroundColor: s.fit === 'urgent' ? colours.neutral[800] : s.fit === 'soon' ? colours.neutral[300] : colours.neutral[200], color: s.fit === 'urgent' ? colours.neutral[100] : colours.neutral[700] }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[4], marginBottom: spacing[4] }}>
        <Button variant="ghost" size="sm" onClick={prevWeek}><ChevronLeft size={18} /></Button>
        <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], minWidth: 280, textAlign: 'center' }}>
          {weekDays[0].toLocaleDateString('en-NZ', { month: 'long', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-NZ', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <Button variant="ghost" size="sm" onClick={nextWeek}><ChevronRight size={18} /></Button>
      </div>

      {/* Calendar Grid */}
      <GlowCard style={{ padding: 0, overflow: 'hidden' }}>
        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: `1px solid ${colours.neutral[200]}` }}>
          <div style={{ padding: spacing[2], borderRight: `1px solid ${colours.neutral[200]}` }} />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const deadlines = taskDeadlinesByDay[i]
            return (
              <div key={i} style={{ padding: `${spacing[2]} ${spacing[1]}`, textAlign: 'center', borderRight: i < 6 ? `1px solid ${colours.neutral[200]}` : 'none', backgroundColor: isToday ? colours.neutral[100] : isWeekend ? colours.neutral[50] : 'transparent' }}>
                <div style={{ fontSize: '11px', color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {day.toLocaleDateString('en-NZ', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: typography.fontSize.xl, width: 32, height: 32, lineHeight: '32px', margin: '2px auto', borderRadius: radii.full, backgroundColor: isToday ? colours.neutral[900] : 'transparent', color: isToday ? colours.neutral[50] : colours.neutral[600], fontWeight: isToday ? typography.fontWeight.bold : typography.fontWeight.medium }}>
                  {day.getDate()}
                </div>
                {deadlines.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center', marginTop: '2px' }}>
                    {deadlines.slice(0, 2).map(t => (
                      <span key={t.id} style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: colours.neutral[200], color: colours.neutral[700], maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {t.title.length > 12 ? t.title.substring(0, 12) + '...' : t.title}
                      </span>
                    ))}
                    {deadlines.length > 2 && <span style={{ fontSize: '9px', color: colours.neutral[500] }}>+{deadlines.length - 2}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Time Grid */}
        <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', position: 'relative', maxHeight: 600, overflowY: 'auto' }}>
          {/* Hour labels */}
          <div>
            {HOURS.map(h => (
              <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${colours.neutral[100]}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: spacing[2], paddingTop: 2, fontSize: '11px', color: h >= WORK_START && h < WORK_END ? colours.neutral[500] : colours.neutral[300], fontWeight: h >= WORK_START && h < WORK_END ? 500 : 400, borderRight: `1px solid ${colours.neutral[200]}` }}>
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayBlocks = schedule.filter(s => isSameDay(toLocal(s.start_time), day))
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const isDayToday = isSameDay(day, today)

            return (
              <div key={dayIdx} style={{ position: 'relative', borderRight: dayIdx < 6 ? `1px solid ${colours.neutral[200]}` : 'none', backgroundColor: isWeekend ? colours.neutral[50] : 'transparent' }}>
                {HOURS.map(h => {
                  const isWork = h >= WORK_START && h < WORK_END
                  return (
                    <div key={h} onClick={() => handleCellClick(dayIdx, h)}
                      style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${h === WORK_START - 1 || h === WORK_END - 1 ? colours.neutral[200] : colours.neutral[100]}`, cursor: 'pointer', backgroundColor: !isWork && !isWeekend ? 'rgba(10,10,10,0.3)' : 'transparent', transition: `background-color ${transitions.fast}` }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = !isWork && !isWeekend ? 'rgba(10,10,10,0.3)' : 'transparent' }}
                    />
                  )
                })}

                {/* Now indicator */}
                {isDayToday && nowHour >= HOUR_START && nowHour <= HOUR_END && (
                  <div ref={nowRef} style={{ position: 'absolute', top: nowTop, left: -1, right: 0, height: 2, backgroundColor: colours.status.danger, zIndex: 3, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: colours.status.danger }} />
                  </div>
                )}

                {/* Schedule blocks */}
                {dayBlocks.map(block => {
                  const start = toLocal(block.start_time)
                  const end = toLocal(block.end_time)
                  const startHour = start.getHours() + start.getMinutes() / 60
                  const endHour = end.getHours() + end.getMinutes() / 60
                  const top = (startHour - HOUR_START) * HOUR_HEIGHT
                  const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 24)

                  return (
                    <div key={block.id} style={{ position: 'absolute', top, left: 3, right: 3, height, backgroundColor: colours.neutral[800], borderRadius: radii.md, padding: `4px ${spacing[2]}`, overflow: 'hidden', borderLeft: `3px solid ${priorityColour[block.priority] || colours.neutral[600]}`, cursor: 'default', zIndex: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                      title={`${block.task_title}\n${formatTime(start)} - ${formatTime(end)}`}
                    >
                      <div style={{ fontSize: '11px', fontWeight: typography.fontWeight.semibold, color: colours.neutral[100], lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {block.task_title}
                      </div>
                      {height >= 36 && <div style={{ fontSize: '10px', color: colours.neutral[400], marginTop: 1 }}>{formatTime(start)} – {formatTime(end)}</div>}
                      {height >= 52 && <div style={{ fontSize: '10px', color: colours.neutral[500], marginTop: 1 }}>{block.client_name}{block.total_payout && ` · $${Number(block.total_payout).toFixed(0)}`}</div>}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id) }}
                        style={{ position: 'absolute', top: 3, right: 3, background: 'none', border: 'none', cursor: 'pointer', color: colours.neutral[500], padding: 2, lineHeight: 1, borderRadius: radii.sm }}
                        onMouseEnter={e => e.currentTarget.style.color = colours.neutral[900]}
                        onMouseLeave={e => e.currentTarget.style.color = colours.neutral[500]}
                      ><X size={10} /></button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </GlowCard>

      {/* Unscheduled Tasks */}
      {unscheduled.length > 0 && (
        <GlowCard style={{ marginTop: spacing[4] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <Layers size={16} /> Unscheduled ({unscheduled.length})
            </div>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Click a time slot on the calendar to schedule</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            {unscheduled.map(t => (
              <div key={t.id} onClick={() => { setShowTaskPicker(true); setSelectedTask(t); fetchSuggestions(t.id) }}
                style={{ padding: `${spacing[2]} ${spacing[3]}`, borderRadius: radii.md, backgroundColor: colours.neutral[100], cursor: 'pointer', border: `1px solid ${colours.neutral[200]}`, fontSize: typography.fontSize.xs, display: 'flex', alignItems: 'center', gap: spacing[2], transition: `background-color ${transitions.fast}` }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[200]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
              >
                <Clock size={12} style={{ color: colours.neutral[500] }} />
                <span style={{ color: colours.neutral[900], fontWeight: typography.fontWeight.medium }}>{t.title}</span>
                {t.complexity_level != null && <span style={{ color: colours.neutral[500] }}>L{t.complexity_level}</span>}
                {t.estimated_hours && <span style={{ color: colours.neutral[500] }}>{t.estimated_hours}h</span>}
                {t.total_payout && <span style={{ color: colours.neutral[600] }}>${Number(t.total_payout).toFixed(0)}</span>}
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {tasks.length === 0 && (
        <GlowCard style={{ marginTop: spacing[4], textAlign: 'center', padding: spacing[8] }}>
          <Clock size={32} style={{ color: colours.neutral[400], margin: '0 auto 12px' }} />
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[700], marginBottom: spacing[2] }}>No active tasks to schedule</div>
          <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>Tasks in "assigned" or "in progress" status will appear here for scheduling.</div>
        </GlowCard>
      )}
    </div>
  )
}
