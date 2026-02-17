import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, X, Zap, Layers, Moon, Phone, MapPin, CalendarDays, Copy, Trash2 } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, PageHeader, Button, Spinner, Modal, Input, Select, Tabs, EmptyState } from '@/components/ui'
import { getCalendarData, createCalendarEvent, deleteCalendarEvent } from '@/services/calendar'
import { createBlock, deleteBlock, getSuggestions } from '@/services/schedule'
import { listTasks } from '@/services/tasks'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

/* ─── Constants ─── */
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 52
const GRID_HEIGHT = 680

// Generate combined time options: "12:00 am", "12:15 am", ... "11:45 pm"
const TIME_OPTIONS = (() => {
  const opts = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const val = h * 60 + m // minutes since midnight
      const hr = h === 0 ? 12 : h > 12 ? h - 12 : h
      const ampm = h < 12 ? 'am' : 'pm'
      opts.push({ value: String(val), label: `${hr}:${String(m).padStart(2, '0')} ${ampm}` })
    }
  }
  return opts
})()

const RECURRENCE_OPTIONS = [
  { value: '', label: 'No repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday' },
  { value: 'weekly', label: 'Every week' },
]

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

const PRIORITY_BORDER = { urgent: '#e5e5e5', high: '#a3a3a3', medium: '#737373', low: '#525252' }

/* ─── Helpers ─── */
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
function fmtHour(h) { if (h === 0 || h === 24) return '12 am'; if (h === 12) return '12 pm'; return h > 12 ? `${h - 12} pm` : `${h} am` }
function fmtTime(date) { return date.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: true }) }
function minsToTimeVal(h, m) { return String(h * 60 + (m || 0)) }
function timeValToHM(val) { const v = +val; return { h: Math.floor(v / 60), m: v % 60 } }

/* ━━━━━━━━━━━━━━━━━ EVENT CONTEXT MENU ━━━━━━━━━━━━━━━━━ */
function EventMenu({ x, y, onDuplicate, onDelete, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
    fontSize: '13px', cursor: 'pointer', color: colours.neutral[700],
    transition: `background-color 100ms ease`, backgroundColor: 'transparent', border: 'none', width: '100%', textAlign: 'left',
  }

  return (
    <div ref={ref} style={{
      position: 'fixed', left: x, top: y, zIndex: 100,
      backgroundColor: colours.surface, border: `1px solid ${colours.neutral[300]}`,
      borderRadius: radii.lg, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      overflow: 'hidden', minWidth: 160,
    }}>
      <button style={itemStyle} onClick={onDuplicate}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
        <Copy size={14} /> Duplicate
      </button>
      <div style={{ borderTop: `1px solid ${colours.neutral[200]}` }} />
      <button style={{ ...itemStyle, color: '#ef4444' }} onClick={onDelete}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
        <Trash2 size={14} /> Delete
      </button>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━ CREATE EVENT MODAL ━━━━━━━━━━━━━━━━━ */
function CreateEventModal({ isOpen, day, startMin, endMin, onClose, onCreate, editData }) {
  const [eventType, setEventType] = useState(editData?.event_type || 'personal')
  const [title, setTitle] = useState(editData?.title || '')
  const [startVal, setStartVal] = useState(String(startMin))
  const [endVal, setEndVal] = useState(String(endMin))
  const [color, setColor] = useState(editData?.color || 'slate')
  const [location, setLocation] = useState(editData?.location || '')
  const [meetingLink, setMeetingLink] = useState(editData?.meeting_link || '')
  const [recurrence, setRecurrence] = useState(editData?.recurrence || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle(editData?.title || '')
      setStartVal(String(startMin))
      setEndVal(String(endMin))
      setColor(editData?.color || 'slate')
      setLocation(editData?.location || '')
      setMeetingLink(editData?.meeting_link || '')
      setRecurrence(editData?.recurrence || '')
      setEventType(editData?.event_type || 'personal')
    }
  }, [isOpen, startMin, endMin, editData])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const { h: sh, m: sm } = timeValToHM(startVal)
    const { h: eh, m: em } = timeValToHM(endVal)
    const start = new Date(day); start.setHours(sh, sm, 0, 0)
    const end = new Date(day); end.setHours(eh, em, 0, 0)
    if (end <= start) end.setDate(end.getDate() + 1)
    await onCreate({
      event_type: eventType, title: title.trim(),
      start_time: start.toISOString(), end_time: end.toISOString(),
      color: eventType === 'appointment' ? 'blue' : color,
      location: location || undefined, meeting_link: meetingLink || undefined,
      recurrence: recurrence || undefined,
    })
    setSaving(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? 'Duplicate Event' : 'New Event'} size="sm">
      <Tabs tabs={[{ key: 'personal', label: 'Personal' }, { key: 'appointment', label: 'Appointment' }]} activeTab={eventType} onChange={setEventType} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4], marginTop: spacing[4] }}>
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)}
          placeholder={eventType === 'personal' ? 'e.g. Lunch, Gym, Focus time' : 'e.g. Client call, Team sync'}
          size="md" autoFocus />

        {/* Time — two clean selects */}
        <div style={{ display: 'flex', gap: spacing[4] }}>
          <div style={{ flex: 1 }}>
            <Select label="Start" value={startVal} onChange={e => setStartVal(e.target.value)} options={TIME_OPTIONS} />
          </div>
          <div style={{ flex: 1 }}>
            <Select label="End" value={endVal} onChange={e => setEndVal(e.target.value)} options={TIME_OPTIONS} />
          </div>
        </div>

        {eventType === 'personal' && (
          <div>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[500], marginBottom: spacing[2] }}>Colour</div>
            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
              {Object.keys(EVENT_COLORS).map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 30, height: 30, borderRadius: radii.full,
                  border: color === c ? `2px solid ${colours.neutral[900]}` : `2px solid transparent`,
                  backgroundColor: EVENT_COLORS[c].border, cursor: 'pointer',
                  boxShadow: color === c ? `0 0 0 2px ${EVENT_COLORS[c].bg}, 0 0 8px ${EVENT_COLORS[c].border}40` : 'none',
                }} />
              ))}
            </div>
          </div>
        )}

        {eventType === 'appointment' && (
          <>
            <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Office, Zoom, etc." size="md" icon={<MapPin size={16} />} />
            <Input label="Meeting Link" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://..." size="md" />
          </>
        )}

        <Select label="Repeat" value={recurrence} onChange={e => setRecurrence(e.target.value)} options={RECURRENCE_OPTIONS} />
      </div>

      <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[6], justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim() || saving}>
          {saving ? 'Saving...' : editData ? 'Duplicate' : 'Create Event'}
        </Button>
      </div>
    </Modal>
  )
}

/* ━━━━━━━━━━━━━━━━━ MAIN CALENDAR ━━━━━━━━━━━━━━━━━ */
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
  const [createModal, setCreateModal] = useState(null) // { day, startMin, endMin, editData? }
  const [contextMenu, setContextMenu] = useState(null) // { x, y, event }
  const gridRef = useRef(null)

  // Drag state
  const [dragState, setDragState] = useState(null) // { dayIdx, startRow, currentRow }
  const isDragging = useRef(false)

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
      setTasks((taskData || []).filter(t => (user.level || 0) >= 7 || t.contractor_id === user.id))
    } catch (err) { console.error('Calendar fetch error:', err) }
    finally { setLoading(false) }
  }, [weekStart, weekEnd, user])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!loading && gridRef.current) {
      gridRef.current.scrollTop = Math.max(0, (new Date().getHours() - 2) * HOUR_HEIGHT)
    }
  }, [loading])

  // Close context menu on scroll/click
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [contextMenu])

  const fetchSuggestions = async (taskId) => {
    setLoadingSuggestions(true)
    try { const data = await getSuggestions(taskId); setSuggestions(data.suggestions || []) }
    catch { /* */ } finally { setLoadingSuggestions(false) }
  }

  const handleScheduleBlock = async (taskId, startTime, endTime) => {
    try {
      await createBlock({ task_id: taskId, start_time: startTime, end_time: endTime })
      addToast('Task scheduled', 'success')
      setSelectedTask(null); setSuggestions([]); setShowTaskPicker(false); fetchData()
    } catch { addToast('Failed to schedule', 'error') }
  }

  const handleDeleteEvent = async (evt) => {
    try {
      if (evt.event_type === 'task') await deleteBlock(evt.id)
      else await deleteCalendarEvent(evt._recurring_parent_id || evt.id)
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

  const handleDuplicateEvent = (evt) => {
    setContextMenu(null)
    const start = toLocal(evt.start_time)
    const end = toLocal(evt.end_time)
    setCreateModal({
      day: start, startMin: start.getHours() * 60 + start.getMinutes(), endMin: end.getHours() * 60 + end.getMinutes(),
      editData: { title: evt.title + ' (copy)', event_type: evt.event_type, color: evt.color, location: evt.location, meeting_link: evt.meeting_link, recurrence: evt.recurrence },
    })
  }

  // ─── Drag-to-create ───
  const getRowFromY = (clientY, colEl) => {
    const rect = colEl.getBoundingClientRect()
    const y = clientY - rect.top + (gridRef.current?.scrollTop || 0) - (colEl.offsetTop - (colEl.parentElement?.children[0]?.offsetHeight || 0))
    return Math.max(0, Math.min(23, Math.floor(clientY / 1))) // simplified
  }

  const handleDragStart = (dayIdx, hour) => {
    isDragging.current = true
    setDragState({ dayIdx, startRow: hour, currentRow: hour })
  }

  const handleDragMove = (hour) => {
    if (!isDragging.current || !dragState) return
    setDragState(prev => prev ? { ...prev, currentRow: hour } : null)
  }

  const handleDragEnd = () => {
    if (!isDragging.current || !dragState) { isDragging.current = false; setDragState(null); return }
    isDragging.current = false
    const minRow = Math.min(dragState.startRow, dragState.currentRow)
    const maxRow = Math.max(dragState.startRow, dragState.currentRow) + 1
    setCreateModal({ day: weekDays[dragState.dayIdx], startMin: minRow * 60, endMin: maxRow * 60 })
    setDragState(null)
    setShowTaskPicker(false)
  }

  // Global mouseup to end drag
  useEffect(() => {
    const up = () => { if (isDragging.current) handleDragEnd() }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [dragState])

  const scheduledTaskIds = new Set(events.filter(e => e.event_type === 'task').map(e => e.task_id))
  const unscheduled = tasks.filter(t => !scheduledTaskIds.has(t.id))

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }
  const goToday = () => setCurrentDate(new Date())

  const today = new Date()
  const isThisWeek = weekDays.some(d => isSameDay(d, today))
  const nowTop = (today.getHours() + today.getMinutes() / 60) * HOUR_HEIGHT

  const taskDeadlinesByDay = weekDays.map(day => tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), day)))

  const taskBlockCount = events.filter(e => e.event_type === 'task').length
  const personalCount = events.filter(e => e.event_type === 'personal').length
  const appointmentCount = events.filter(e => e.event_type === 'appointment').length
  const subtitleParts = [
    taskBlockCount && `${taskBlockCount} task block${taskBlockCount > 1 ? 's' : ''}`,
    personalCount && `${personalCount} personal`,
    appointmentCount && `${appointmentCount} appointment${appointmentCount > 1 ? 's' : ''}`,
  ].filter(Boolean)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: spacing[12], minHeight: '60vh' }}><Spinner size="lg" /></div>

  return (
    <div style={{ padding: spacing[6], maxWidth: 1400, margin: '0 auto' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[5], flexWrap: 'wrap', gap: spacing[3] }}>
        <PageHeader title="Calendar" subtitle={subtitleParts.length ? subtitleParts.join(' · ') : 'No events this week'} />
        <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
          {!isThisWeek && <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>}
          <Button variant="secondary" size="sm" onClick={() => { const h = Math.min(today.getHours() + 1, 23); setCreateModal({ day: today, startMin: h * 60, endMin: (h + 1) * 60 }) }}>
            <Plus size={14} /> Event
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setShowTaskPicker(!showTaskPicker); setCreateModal(null) }}>
            <Zap size={14} /> Smart Schedule
          </Button>
        </div>
      </div>

      {/* ─── Smart Schedule Panel ─── */}
      {showTaskPicker && (
        <GlowCard style={{ marginBottom: spacing[4] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <Zap size={18} style={{ color: colours.neutral[900] }} />
              <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>Smart Schedule</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setShowTaskPicker(false); setSelectedTask(null); setSuggestions([]) }}><X size={16} /></Button>
          </div>
          {!selectedTask ? (
            <>
              <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[4], marginTop: 0 }}>
                Pick a task and we'll suggest the best time slots based on your schedule and deadlines.
              </p>
              {tasks.length === 0 ? (
                <EmptyState icon={<CalendarDays size={40} style={{ color: colours.neutral[400] }} />} title="No active tasks" description="You don't have any tasks assigned yet. Once you're assigned work, you can schedule it here." />
              ) : unscheduled.length === 0 ? (
                <EmptyState icon={<Zap size={40} style={{ color: colours.neutral[400] }} />} title="All caught up" description="Every assigned task already has a time block. Nice work!" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {unscheduled.map(t => (
                    <GlowCard key={t.id} padding="12px 16px" onClick={() => { setSelectedTask(t); fetchSuggestions(t.id) }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                          {t.complexity_level != null && <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: colours.neutral[200], color: colours.neutral[900], padding: '2px 6px', borderRadius: radii.sm }}>L{t.complexity_level}</span>}
                          <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{t.title}</span>
                        </div>
                        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500], marginTop: '3px' }}>
                          {[t.client_name, t.category_name].filter(Boolean).join(' · ')}{t.estimated_hours && ` · ${t.estimated_hours}h`}{t.total_payout && ` · $${Number(t.total_payout).toFixed(0)}`}
                        </div>
                      </div>
                      {t.deadline && <span style={{ fontSize: typography.fontSize.xs, fontWeight: 500, color: new Date(t.deadline) < new Date(Date.now() + 3 * 86400000) ? colours.neutral[900] : colours.neutral[500] }}>Due {new Date(t.deadline).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}</span>}
                    </GlowCard>
                  ))}
                </div>
              )}
            </>
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
              {loadingSuggestions ? <div style={{ textAlign: 'center', padding: spacing[6] }}><Spinner size="md" /></div>
              : suggestions.length === 0 ? <EmptyState icon={<Clock size={36} style={{ color: colours.neutral[400] }} />} title="No suggestions found" description="Drag across a time range on the calendar to schedule manually." />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {suggestions.map((s, i) => (
                    <GlowCard key={i} padding="12px 16px" onClick={() => handleScheduleBlock(selectedTask.id, s.start_time, s.end_time)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[900] }}>{s.day_label}</div>
                        <div style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>{s.time_label}{s.context && <span style={{ marginLeft: spacing[2], fontStyle: 'italic', color: colours.neutral[600] }}>{s.context}</span>}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        {s.pattern_score != null && <span style={{ fontSize: '11px', color: colours.neutral[500] }}>{s.pattern_score}%</span>}
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: radii.full, backgroundColor: s.fit === 'urgent' ? '#7f1d1d' : s.fit === 'soon' ? '#78350f' : colours.surfaceRaised, color: s.fit === 'urgent' || s.fit === 'soon' ? '#fff' : colours.neutral[900] }}>
                          {s.fit === 'urgent' ? 'Urgent' : s.fit === 'soon' ? 'Soon' : 'Good fit'}
                        </span>
                      </div>
                    </GlowCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </GlowCard>
      )}

      {/* ─── Week Navigation ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[4], marginBottom: spacing[4] }}>
        <Button variant="ghost" size="sm" onClick={prevWeek}><ChevronLeft size={18} /></Button>
        <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], minWidth: 300, textAlign: 'center' }}>
          {weekDays[0].toLocaleDateString('en-NZ', { month: 'long', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-NZ', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <Button variant="ghost" size="sm" onClick={nextWeek}><ChevronRight size={18} /></Button>
      </div>

      {/* ─── Calendar Grid ─── */}
      <GlowCard style={{ padding: 0, overflow: 'hidden', userSelect: 'none' }}>
        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '54px repeat(7, 1fr)', borderBottom: `1px solid ${colours.neutral[300]}`, position: 'sticky', top: 0, zIndex: 5, backgroundColor: colours.surfaceRaised }}>
          <div style={{ padding: spacing[2], borderRight: `1px solid ${colours.neutral[300]}` }} />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            const deadlines = taskDeadlinesByDay[i]
            return (
              <div key={i} style={{ padding: `${spacing[3]} ${spacing[1]}`, textAlign: 'center', borderRight: i < 6 ? `1px solid ${colours.neutral[300]}` : 'none', backgroundColor: isToday ? 'rgba(255,255,255,0.04)' : 'transparent' }}>
                <div style={{ fontSize: '11px', color: colours.neutral[500], textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{day.toLocaleDateString('en-NZ', { weekday: 'short' })}</div>
                <div style={{ fontSize: typography.fontSize.xl, width: 36, height: 36, lineHeight: '36px', margin: '4px auto 0', borderRadius: radii.full, backgroundColor: isToday ? colours.neutral[900] : 'transparent', color: isToday ? '#000' : colours.neutral[600], fontWeight: isToday ? typography.fontWeight.bold : typography.fontWeight.medium }}>{day.getDate()}</div>
                {deadlines.length > 0 && (
                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                    {deadlines.slice(0, 2).map(t => <span key={t.id} style={{ fontSize: '9px', padding: '1px 5px', borderRadius: radii.sm, backgroundColor: colours.surfaceRaised, color: colours.neutral[600], border: `1px solid ${colours.neutral[300]}`, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title.length > 10 ? t.title.substring(0, 10) + '\u2026' : t.title}</span>)}
                    {deadlines.length > 2 && <span style={{ fontSize: '9px', color: colours.neutral[500] }}>+{deadlines.length - 2}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Time Grid */}
        <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: '54px repeat(7, 1fr)', position: 'relative', maxHeight: GRID_HEIGHT, overflowY: 'auto' }}>
          {/* Hour labels */}
          <div style={{ borderRight: `1px solid ${colours.neutral[300]}` }}>
            {HOURS.map(h => (
              <div key={h} style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${colours.neutral[200]}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: spacing[2], paddingTop: 3, fontSize: '11px', fontWeight: 500, color: (h < 5 || h >= 23) ? colours.neutral[400] : colours.neutral[500] }}>
                {fmtHour(h)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents = events.filter(e => isSameDay(toLocal(e.start_time), day))
            const isDayToday = isSameDay(day, today)

            return (
              <div key={dayIdx} style={{ position: 'relative', borderRight: dayIdx < 6 ? `1px solid ${colours.neutral[300]}` : 'none' }}>
                {/* Hour cells — drag-to-create */}
                {HOURS.map(h => {
                  const isNight = h < 5 || h >= 23
                  const isDragHighlight = dragState && dragState.dayIdx === dayIdx && h >= Math.min(dragState.startRow, dragState.currentRow) && h <= Math.max(dragState.startRow, dragState.currentRow)
                  return (
                    <div key={h}
                      onMouseDown={(e) => { if (e.button === 0) { e.preventDefault(); handleDragStart(dayIdx, h) } }}
                      onMouseEnter={() => { if (isDragging.current) handleDragMove(h) }}
                      style={{
                        height: HOUR_HEIGHT, borderBottom: `1px solid ${colours.neutral[200]}`, cursor: 'crosshair',
                        backgroundColor: isDragHighlight ? 'rgba(59,130,246,0.15)' : isNight ? 'rgba(0,0,0,0.15)' : isDayToday ? 'rgba(255,255,255,0.015)' : 'transparent',
                        transition: isDragging.current ? 'none' : 'background-color 100ms ease',
                      }}
                      onMouseEnter2={e => { if (!isDragging.current) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                    />
                  )
                })}

                {/* Now indicator */}
                {isDayToday && (
                  <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, height: 2, backgroundColor: '#ef4444', zIndex: 4, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  </div>
                )}

                {/* Drag preview */}
                {dragState && dragState.dayIdx === dayIdx && (
                  <div style={{
                    position: 'absolute', left: 4, right: 4, pointerEvents: 'none', zIndex: 3,
                    top: Math.min(dragState.startRow, dragState.currentRow) * HOUR_HEIGHT,
                    height: (Math.abs(dragState.currentRow - dragState.startRow) + 1) * HOUR_HEIGHT,
                    backgroundColor: 'rgba(59,130,246,0.2)', border: '2px dashed rgba(59,130,246,0.6)',
                    borderRadius: radii.md,
                  }}>
                    <div style={{ padding: '4px 8px', fontSize: '11px', color: '#93c5fd', fontWeight: 600 }}>
                      {fmtHour(Math.min(dragState.startRow, dragState.currentRow))} – {fmtHour(Math.max(dragState.startRow, dragState.currentRow) + 1)}
                    </div>
                  </div>
                )}

                {/* Event blocks */}
                {dayEvents.map((evt, idx) => {
                  const start = toLocal(evt.start_time)
                  const end = toLocal(evt.end_time)
                  const sH = start.getHours() + start.getMinutes() / 60
                  const eH = end.getHours() + end.getMinutes() / 60
                  const top = sH * HOUR_HEIGHT
                  const height = Math.max((eH - sH) * HOUR_HEIGHT, 22)
                  const isTask = evt.event_type === 'task'
                  const isAppt = evt.event_type === 'appointment'
                  const cs = EVENT_COLORS[evt.color] || EVENT_COLORS.slate
                  const bg = isTask ? colours.neutral[800] : cs.bg
                  const bdr = isTask ? (PRIORITY_BORDER[evt.priority] || '#525252') : (isAppt ? EVENT_COLORS.blue.border : cs.border)
                  const txt = isTask ? colours.neutral[100] : cs.text

                  return (
                    <div key={evt.id + '-' + idx}
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, event: evt }) }}
                      style={{
                        position: 'absolute', top, left: 4, right: 4, height,
                        backgroundColor: bg, borderRadius: radii.md, padding: '4px 8px', overflow: 'hidden',
                        borderLeft: `3px solid ${bdr}`, cursor: 'context-menu', zIndex: 2,
                        boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
                      }}
                      title={`${evt.title}\n${fmtTime(start)} – ${fmtTime(end)}${evt.location ? '\n\ud83d\udccd ' + evt.location : ''}\nRight-click for options`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isAppt && <Phone size={10} style={{ color: txt, opacity: 0.7, flexShrink: 0 }} />}
                        {!isTask && !isAppt && <Moon size={10} style={{ color: txt, opacity: 0.7, flexShrink: 0 }} />}
                        <span style={{ fontSize: '11px', fontWeight: 600, color: txt, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{evt.title}</span>
                      </div>
                      {height >= 36 && <div style={{ fontSize: '10px', color: txt, opacity: 0.6, marginTop: 2 }}>{fmtTime(start)} – {fmtTime(end)}</div>}
                      {height >= 52 && isTask && <div style={{ fontSize: '10px', color: txt, opacity: 0.5, marginTop: 1 }}>{evt.client_name}{evt.total_payout && ` · $${Number(evt.total_payout).toFixed(0)}`}</div>}
                      {height >= 52 && isAppt && evt.location && <div style={{ fontSize: '10px', color: txt, opacity: 0.5, marginTop: 1, display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={8} />{evt.location}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </GlowCard>

      {/* ─── Unscheduled Tasks ─── */}
      {unscheduled.length > 0 && (
        <GlowCard style={{ marginTop: spacing[4] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <Layers size={16} style={{ color: colours.neutral[500] }} />
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900] }}>Unscheduled Tasks ({unscheduled.length})</span>
            </div>
            <span style={{ fontSize: typography.fontSize.xs, color: colours.neutral[500] }}>Drag across a time range or use Smart Schedule</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
            {unscheduled.map(t => (
              <GlowCard key={t.id} padding="8px 14px" onClick={() => { setShowTaskPicker(true); setSelectedTask(t); fetchSuggestions(t.id) }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: typography.fontSize.xs }}>
                <Clock size={12} style={{ color: colours.neutral[500] }} />
                <span style={{ color: colours.neutral[900], fontWeight: typography.fontWeight.medium }}>{t.title}</span>
                {t.complexity_level != null && <span style={{ color: colours.neutral[500], fontSize: '10px', fontWeight: 700, backgroundColor: colours.neutral[200], padding: '1px 5px', borderRadius: radii.sm }}>L{t.complexity_level}</span>}
                {t.estimated_hours && <span style={{ color: colours.neutral[500] }}>{t.estimated_hours}h</span>}
                {t.total_payout && <span style={{ color: colours.neutral[600], fontWeight: 600 }}>${Number(t.total_payout).toFixed(0)}</span>}
              </GlowCard>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Empty state */}
      {tasks.length === 0 && events.length === 0 && (
        <GlowCard style={{ marginTop: spacing[4] }}>
          <EmptyState icon={<CalendarDays size={48} style={{ color: colours.neutral[400] }} />} title="Your calendar is empty" description="Drag across a time range to create an event, or use + Event to add one." action={{ label: '+ New Event', onClick: () => { const h = Math.min(today.getHours() + 1, 23); setCreateModal({ day: today, startMin: h * 60, endMin: (h + 1) * 60 }) } }} />
        </GlowCard>
      )}

      {/* ─── Create / Duplicate Modal ─── */}
      <CreateEventModal
        isOpen={!!createModal}
        day={createModal?.day || today}
        startMin={createModal?.startMin ?? 540}
        endMin={createModal?.endMin ?? 600}
        editData={createModal?.editData}
        onClose={() => setCreateModal(null)}
        onCreate={handleCreateEvent}
      />

      {/* ─── Context Menu ─── */}
      {contextMenu && (
        <EventMenu
          x={contextMenu.x} y={contextMenu.y}
          onDuplicate={() => handleDuplicateEvent(contextMenu.event)}
          onDelete={() => { handleDeleteEvent(contextMenu.event); setContextMenu(null) }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
