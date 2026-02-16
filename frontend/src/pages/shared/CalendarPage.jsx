import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, X, Zap, Layers, Moon, Phone, MapPin } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, PageHeader, Button, Spinner } from '@/components/ui'
import { getCalendarData, createCalendarEvent, deleteCalendarEvent } from '@/services/calendar'
import { createBlock, deleteBlock, getSuggestions } from '@/services/schedule'
import { listTasks } from '@/services/tasks'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 48
const WORK_START = 9
const WORK_END = 17

const EVENT_COLORS = {
  slate:  { bg: '#334155', border: '#64748b', text: '#f1f5f9' },
  red:    { bg: '#7f1d1d', border: '#dc2626', text: '#fef2f2' },
  orange: { bg: '#7c2d12', border: '#ea580c', text: '#fff7ed' },
  amber:  { bg: '#78350f', border: '#d97706', text: '#fffbeb' },
  green:  { bg: '#14532d', border: '#16a34a', text: '#f0fdf4' },
  teal:   { bg: '#134e4a', border: '#14b8a6', text: '#f0fdfa' },
  blue:   { bg: '#1e3a5f', border: '#3b82f6', text: '#eff6ff' },
  purple: { bg: '#3b0764', border: '#a855f7', text: '#faf5ff' },
  pink:   { bg: '#831843', border: '#ec4899', text: '#fdf2f8' },
}

const priorityColour = { urgent: '#e5e5e5', high: '#a3a3a3', medium: '#737373', low: '#525252' }

function getWeekDays(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(monday)
    nd.setDate(monday.getDate() + i)
    return nd
  })
}

function toLocal(iso) { return new Date(iso) }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }
function formatHour(h) { if (h === 0 || h === 24) return '12am'; if (h === 12) return '12pm'; return h > 12 ? `${h - 12}pm` : `${h}am` }
function formatTime(date) { return date.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: true }) }

// ======================== CREATE EVENT MODAL ========================
function CreateEventModal({ day, hour, onClose, onCreate }) {
  const [eventType, setEventType] = useState('personal')
  const [title, setTitle] = useState('')
  const [startH, setStartH] = useState(hour)
  const [startM, setStartM] = useState(0)
  const [endH, setEndH] = useState(Math.min(hour + 1, 23))
  const [endM, setEndM] = useState(0)
  const [color, setColor] = useState('slate')
  const [location, setLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [recurrence, setRecurrence] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const start = new Date(day)
    start.setHours(startH, startM, 0, 0)
    const end = new Date(day)
    end.setHours(endH, endM, 0, 0)
    if (end <= start) end.setDate(end.getDate() + 1)
    await onCreate({
      event_type: eventType,
      title: title.trim(),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      color: eventType === 'appointment' ? 'blue' : color,
      location: location || undefined,
      meeting_link: meetingLink || undefined,
      recurrence: recurrence || undefined,
    })
    setSaving(false)
  }

  const labelStyle = { fontSize: '12px', color: colours.neutral[500], marginBottom: '4px', display: 'block' }
  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: radii.md, border: `1px solid ${colours.neutral[300]}`, backgroundColor: colours.neutral[50], color: colours.neutral[900], fontSize: '13px', outline: 'none' }
  const selectStyle = { ...inputStyle, appearance: 'auto' }
  const tabStyle = (active) => ({
    flex: 1, padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 600,
    borderRadius: radii.md, cursor: 'pointer', border: 'none',
    backgroundColor: active ? colours.neutral[800] : colours.neutral[100],
    color: active ? colours.neutral[50] : colours.neutral[600],
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing[4] }} onClick={onClose}>
      <div style={{ backgroundColor: colours.surface, borderRadius: radii.lg, padding: spacing[5], width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: `1px solid ${colours.neutral[200]}` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>New Event</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colours.neutral[500], padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: spacing[4] }}>
          <button style={tabStyle(eventType === 'personal')} onClick={() => setEventType('personal')}>
            <Moon size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Personal
          </button>
          <button style={tabStyle(eventType === 'appointment')} onClick={() => setEventType('appointment')}>
            <Phone size={12} style={{ marginRight: 4, verticalAlign: -2 }} />Appointment
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
              placeholder={eventType === 'personal' ? 'e.g. Lunch, Gym, Focus time' : 'e.g. Client call, Team sync'} autoFocus />
          </div>

          <div style={{ display: 'flex', gap: spacing[3] }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select style={{ ...selectStyle, flex: 1 }} value={startH} onChange={e => setStartH(+e.target.value)}>
                  {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
                <select style={{ ...selectStyle, width: 60 }} value={startM} onChange={e => setStartM(+e.target.value)}>
                  {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select style={{ ...selectStyle, flex: 1 }} value={endH} onChange={e => setEndH(+e.target.value)}>
                  {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
                <select style={{ ...selectStyle, width: 60 }} value={endM} onChange={e => setEndM(+e.target.value)}>
                  {[0, 15, 30, 45].map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>
          </div>

          {eventType === 'personal' && (
            <div>
              <label style={labelStyle}>Colour</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.keys(EVENT_COLORS).map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 28, height: 28, borderRadius: radii.full,
                    border: color === c ? '2px solid white' : '2px solid transparent',
                    backgroundColor: EVENT_COLORS[c].border, cursor: 'pointer',
                    boxShadow: color === c ? `0 0 0 2px ${EVENT_COLORS[c].bg}` : 'none',
                  }} />
                ))}
              </div>
            </div>
          )}

          {eventType === 'appointment' && (
            <>
              <div>
                <label style={labelStyle}>Location</label>
                <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="Office, Zoom, etc." />
              </div>
              <div>
                <label style={labelStyle}>Meeting Link</label>
                <input style={inputStyle} value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Repeat</label>
            <select style={selectStyle} value={recurrence} onChange={e => setRecurrence(e.target.value)}>
              <option value="">No repeat</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Every weekday</option>
              <option value="weekly">Every week</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[5] }}>
          <Button variant="ghost" size="sm" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!title.trim() || saving} style={{ flex: 1 }}>
            {saving ? 'Saving...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ======================== MAIN CALENDAR ========================
export default function CalendarPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showTaskPicker, setShowTaskPicker] = useState(false)
  const [createModal, setCreateModal] = useState(null)
  const gridRef = useRef(null)

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekStart = weekDays[0].toISOString()
  const weekEnd = new Date(weekDays[6].getTime() + 24 * 60 * 60 * 1000).toISOString()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [calData, taskData] = await Promise.all([
        getCalendarData(weekStart, weekEnd),
        listTasks({ status: 'assigned,in_progress' }),
      ])
      setEvents(calData || [])
      setTasks((taskData || []).filter(t =>
        (user.level || 0) >= 7 || t.contractor_id === user.id
      ))
    } catch (err) {
      console.error('Calendar fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd, user])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!loading && gridRef.current) {
      const now = new Date()
      gridRef.current.scrollTop = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT)
    }
  }, [loading])

  const fetchSuggestions = async (taskId) => {
    setLoadingSuggestions(true)
    try { const data = await getSuggestions(taskId); setSuggestions(data.suggestions || []) }
    catch { /* */ } finally { setLoadingSuggestions(false) }
  }

  const handleScheduleBlock = async (taskId, startTime, endTime) => {
    try {
      await createBlock({ task_id: taskId, start_time: startTime, end_time: endTime })
      addToast('Task scheduled', 'success')
      setSelectedTask(null); setSuggestions([]); setShowTaskPicker(false)
      fetchData()
    } catch { addToast('Failed to schedule', 'error') }
  }

  const handleDeleteEvent = async (evt) => {
    try {
      if (evt.event_type === 'task') { await deleteBlock(evt.id) }
      else { await deleteCalendarEvent(evt._recurring_parent_id || evt.id) }
      addToast('Removed', 'success'); fetchData()
    } catch { addToast('Failed to remove', 'error') }
  }

  const handleCreateEvent = async (eventData) => {
    try {
      await createCalendarEvent(eventData)
      addToast(`${eventData.event_type === 'appointment' ? 'Appointment' : 'Block'} created`, 'success')
      setCreateModal(null); fetchData()
    } catch { addToast('Failed to create', 'error') }
  }

  const scheduledTaskIds = new Set(events.filter(e => e.event_type === 'task').map(e => e.task_id))
  const unscheduled = tasks.filter(t => !scheduledTaskIds.has(t.id))

  const handleCellClick = (dayIdx, hour) => { setCreateModal({ day: weekDays[dayIdx], hour }); setShowTaskPicker(false) }

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }
  const goToday = () => setCurrentDate(new Date())

  const today = new Date()
  const isThisWeek = weekDays.some(d => isSameDay(d, today))
  const nowHour = today.getHours() + today.getMinutes() / 60
  const nowTop = nowHour * HOUR_HEIGHT
  const nowDayIdx = weekDays.findIndex(d => isSameDay(d, today))

  const taskDeadlinesByDay = weekDays.map(day =>
    tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), day))
  )

  const taskBlockCount = events.filter(e => e.event_type === 'task').length
  const personalCount = events.filter(e => e.event_type === 'personal').length
  const appointmentCount = events.filter(e => e.event_type === 'appointment').length

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}><Spinner size="lg" /></div>

  return (
    <div style={{ padding: spacing[6], maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4], flexWrap: 'wrap', gap: spacing[3] }}>
        <PageHeader
          title="Calendar"
          subtitle={[taskBlockCount && `${taskBlockCount} task blocks`, personalCount && `${personalCount} personal`, appointmentCount && `${appointmentCount} appointments`].filter(Boolean).join(' \u00b7 ') || 'No events this week'}
        />
        <div style={{ display: 'flex', gap: spacing[2] }}>
          {!isThisWeek && <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>}
          <Button variant="secondary" size="sm" onClick={() => setCreateModal({ day: today, hour: Math.min(today.getHours() + 1, 23) })}>
            <Plus size={14} /> Event
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setShowTaskPicker(!showTaskPicker); setCreateModal(null) }}>
            <Zap size={14} /> Smart Schedule
          </Button>
        </div>
      </div>

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
                Pick a task — we'll find the best time slots.
              </div>
              {unscheduled.length === 0 ? (
                <div style={{ color: colours.neutral[500], textAlign: 'center', padding: spacing[4] }}>All tasks are scheduled.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {unscheduled.map(t => (
                    <div key={t.id} onClick={() => { setSelectedTask(t); fetchSuggestions(t.id) }}
                      style={{ padding: `${spacing[3]} ${spacing[4]}`, borderRadius: radii.md, backgroundColor: colours.neutral[50], cursor: 'pointer', border: `1px solid ${colours.neutral[200]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: `background-color ${transitions.fast}` }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[50]}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {t.complexity_level != null && <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: colours.neutral[200], color: colours.neutral[900], padding: '1px 6px', borderRadius: '4px' }}>L{t.complexity_level}</span>}
                          <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{t.title}</span>
                        </div>
                        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginTop: '2px' }}>
                          {[t.client_name, t.category_name].filter(Boolean).join(' \u00b7 ')}{t.estimated_hours && ` \u00b7 ${t.estimated_hours}h`}{t.total_payout && ` \u00b7 $${Number(t.total_payout).toFixed(0)}`}
                        </div>
                      </div>
                      {t.deadline && <div style={{ fontSize: typography.fontSize.xs, color: new Date(t.deadline) < new Date(Date.now() + 3 * 86400000) ? colours.neutral[900] : colours.neutral[500] }}>Due {new Date(t.deadline).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}</div>}
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
                    {selectedTask.estimated_hours && `${selectedTask.estimated_hours}h`}{selectedTask.total_payout && ` \u00b7 $${Number(selectedTask.total_payout).toFixed(0)}`}{selectedTask.deadline && ` \u00b7 Due ${new Date(selectedTask.deadline).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}`}
                  </div>
                </div>
              </div>
              {loadingSuggestions ? (
                <div style={{ textAlign: 'center', padding: spacing[4] }}><Spinner size="md" /></div>
              ) : suggestions.length === 0 ? (
                <div style={{ color: colours.neutral[500], textAlign: 'center', padding: spacing[4] }}>No slots found. Click a time on the calendar.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {suggestions.map((s, i) => (
                    <div key={i} onClick={() => handleScheduleBlock(selectedTask.id, s.start_time, s.end_time)}
                      style={{ padding: `${spacing[3]} ${spacing[4]}`, borderRadius: radii.md, backgroundColor: colours.neutral[50], cursor: 'pointer', border: `1px solid ${colours.neutral[200]}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: `background-color ${transitions.fast}` }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = colours.neutral[50]}
                    >
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{s.day_label}</div>
                        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>{s.time_label}</div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: s.fit === 'urgent' ? '#7f1d1d' : s.fit === 'soon' ? '#78350f' : colours.neutral[200], color: s.fit === 'urgent' || s.fit === 'soon' ? '#fff' : colours.neutral[900] }}>
                        {s.fit === 'urgent' ? 'Urgent' : s.fit === 'soon' ? 'Soon' : 'Good fit'}
                      </span>
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
        <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', borderBottom: `1px solid ${colours.neutral[200]}`, position: 'sticky', top: 0, zIndex: 5, backgroundColor: colours.surface }}>
          <div style={{ padding: spacing[2], borderRight: `1px solid ${colours.neutral[200]}` }} />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const deadlines = taskDeadlinesByDay[i]
            return (
              <div key={i} style={{ padding: `${spacing[2]} ${spacing[1]}`, textAlign: 'center', borderRight: i < 6 ? `1px solid ${colours.neutral[200]}` : 'none', backgroundColor: isToday ? colours.neutral[100] : isWeekend ? colours.neutral[50] : 'transparent' }}>
                <div style={{ fontSize: '11px', color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.5px' }}>{day.toLocaleDateString('en-NZ', { weekday: 'short' })}</div>
                <div style={{ fontSize: typography.fontSize.xl, width: 32, height: 32, lineHeight: '32px', margin: '2px auto', borderRadius: radii.full, backgroundColor: isToday ? colours.neutral[900] : 'transparent', color: isToday ? colours.neutral[50] : colours.neutral[600], fontWeight: isToday ? typography.fontWeight.bold : typography.fontWeight.medium }}>{day.getDate()}</div>
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

        {/* Time Grid — full 24h */}
        <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', position: 'relative', maxHeight: 700, overflowY: 'auto' }}>
          {/* Hour labels */}
          <div>
            {HOURS.map(h => {
              const isWork = h >= WORK_START && h < WORK_END
              return (
                <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${colours.neutral[100]}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '6px', paddingTop: 2, fontSize: '10px', fontWeight: isWork ? 500 : 400, color: isWork ? colours.neutral[500] : colours.neutral[300], borderRight: `1px solid ${colours.neutral[200]}` }}>
                  {formatHour(h)}
                </div>
              )
            })}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents = events.filter(e => isSameDay(toLocal(e.start_time), day))
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            const isDayToday = isSameDay(day, today)

            return (
              <div key={dayIdx} style={{ position: 'relative', borderRight: dayIdx < 6 ? `1px solid ${colours.neutral[200]}` : 'none' }}>
                {HOURS.map(h => {
                  const isWork = h >= WORK_START && h < WORK_END
                  const isNight = h < 6 || h >= 22
                  const baseBg = isNight ? 'rgba(0,0,0,0.25)' : isWeekend ? colours.neutral[50] : (!isWork ? 'rgba(10,10,10,0.15)' : 'transparent')
                  return (
                    <div key={h} onClick={() => handleCellClick(dayIdx, h)}
                      style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${h === WORK_START - 1 || h === WORK_END - 1 ? colours.neutral[200] : colours.neutral[100]}`, cursor: 'pointer', backgroundColor: baseBg, transition: `background-color ${transitions.fast}` }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = colours.neutral[100]}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = baseBg}
                    />
                  )
                })}

                {/* Now indicator */}
                {isDayToday && (
                  <div style={{ position: 'absolute', top: nowTop, left: -1, right: 0, height: 2, backgroundColor: '#ef4444', zIndex: 4, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  </div>
                )}

                {/* Event blocks */}
                {dayEvents.map((evt, idx) => {
                  const start = toLocal(evt.start_time)
                  const end = toLocal(evt.end_time)
                  const startH = start.getHours() + start.getMinutes() / 60
                  const endH = end.getHours() + end.getMinutes() / 60
                  const top = startH * HOUR_HEIGHT
                  const height = Math.max((endH - startH) * HOUR_HEIGHT, 20)
                  const isTask = evt.event_type === 'task'
                  const isAppointment = evt.event_type === 'appointment'
                  const colorSet = EVENT_COLORS[evt.color] || EVENT_COLORS.slate
                  const bgColor = isTask ? colours.neutral[800] : colorSet.bg
                  const borderColor = isTask ? (priorityColour[evt.priority] || '#525252') : (isAppointment ? EVENT_COLORS.blue.border : colorSet.border)
                  const textColor = isTask ? colours.neutral[100] : colorSet.text

                  return (
                    <div key={evt.id + '-' + idx}
                      style={{ position: 'absolute', top, left: 3, right: 3, height, backgroundColor: bgColor, borderRadius: radii.md, padding: `3px 8px`, overflow: 'hidden', borderLeft: `3px solid ${borderColor}`, cursor: 'default', zIndex: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                      title={`${evt.title}\n${formatTime(start)} - ${formatTime(end)}${evt.location ? '\n' + evt.location : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isAppointment && <Phone size={10} style={{ color: textColor, opacity: 0.7, flexShrink: 0 }} />}
                        {!isTask && !isAppointment && <Moon size={10} style={{ color: textColor, opacity: 0.7, flexShrink: 0 }} />}
                        <div style={{ fontSize: '11px', fontWeight: 600, color: textColor, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{evt.title}</div>
                      </div>
                      {height >= 32 && <div style={{ fontSize: '10px', color: textColor, opacity: 0.7, marginTop: 1 }}>{formatTime(start)} – {formatTime(end)}</div>}
                      {height >= 48 && isTask && <div style={{ fontSize: '10px', color: textColor, opacity: 0.6, marginTop: 1 }}>{evt.client_name}{evt.total_payout && ` \u00b7 $${Number(evt.total_payout).toFixed(0)}`}</div>}
                      {height >= 48 && isAppointment && evt.location && <div style={{ fontSize: '10px', color: textColor, opacity: 0.6, marginTop: 1, display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={8} />{evt.location}</div>}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt) }}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', color: textColor, opacity: 0.4, padding: 2, lineHeight: 1, borderRadius: radii.sm }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
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
              <Layers size={16} /> Unscheduled Tasks ({unscheduled.length})
            </div>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Click a time slot or use Smart Schedule</span>
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

      {tasks.length === 0 && events.length === 0 && (
        <GlowCard style={{ marginTop: spacing[4], textAlign: 'center', padding: spacing[8] }}>
          <Clock size={32} style={{ color: colours.neutral[400], margin: '0 auto 12px' }} />
          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[700], marginBottom: spacing[2] }}>Your calendar is empty</div>
          <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500] }}>Click any time slot to block personal time, or use Smart Schedule for tasks.</div>
        </GlowCard>
      )}

      {createModal && <CreateEventModal day={createModal.day} hour={createModal.hour} onClose={() => setCreateModal(null)} onCreate={handleCreateEvent} />}
    </div>
  )
}
