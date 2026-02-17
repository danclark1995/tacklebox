import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, Plus, X, Zap, Layers, Moon, Phone, MapPin, CalendarDays, Copy, Trash2, ExternalLink, Video, Edit3, Link2, GripVertical } from 'lucide-react'
import useAuth from '@/hooks/useAuth'
import useToast from '@/hooks/useToast'
import { GlowCard, PageHeader, Button, Spinner, Modal, Input, Select, Tabs, EmptyState } from '@/components/ui'
import { getCalendarData, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/services/calendar'
import { createBlock, updateBlock, deleteBlock, getSuggestions } from '@/services/schedule'
import { listTasks } from '@/services/tasks'
import { colours, spacing, typography, radii, transitions } from '@/config/tokens'

/* ─── Constants ─── */
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 52
const QUARTER = HOUR_HEIGHT / 4 // 13px per 15min
const GRID_HEIGHT = 680

const TIME_OPTIONS = (() => {
  const opts = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const val = h * 60 + m
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
  const d = new Date(date); const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d); mon.setDate(diff); mon.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => { const nd = new Date(mon); nd.setDate(mon.getDate() + i); return nd })
}
function toLocal(iso) { return new Date(iso) }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }
function fmtHour(h) { if (h === 0 || h === 24) return '12 am'; if (h === 12) return '12 pm'; return h > 12 ? `${h - 12} pm` : `${h} am` }
function fmtMinutes(totalMins) { const h = Math.floor(totalMins / 60); const m = totalMins % 60; const hr = h === 0 ? 12 : h > 12 ? h - 12 : h; const ampm = h < 12 ? 'am' : 'pm'; return `${hr}:${String(m).padStart(2, '0')} ${ampm}` }
function fmtTime(date) { const h = date.getHours(); const m = date.getMinutes(); return fmtMinutes(h * 60 + m) }
function timeValToHM(val) { const v = +val; return { h: Math.floor(v / 60), m: v % 60 } }
function snapTo15(mins) { return Math.round(mins / 15) * 15 }
function yToMinutes(y) { return snapTo15(Math.max(0, Math.min(24 * 60 - 15, (y / HOUR_HEIGHT) * 60))) }
function minutesToY(mins) { return (mins / 60) * HOUR_HEIGHT }
function generateMeetLink() { const id = Math.random().toString(36).substring(2, 10); return `https://meet.jit.si/tacklebox-${id}` }

/* ─── Overlap Layout (Google Calendar style columns) ─── */
function layoutOverlappingEvents(dayEvents) {
  if (dayEvents.length === 0) return []
  // Convert to time ranges
  const items = dayEvents.map(evt => {
    const s = toLocal(evt.start_time), e = toLocal(evt.end_time)
    return { evt, startM: s.getHours() * 60 + s.getMinutes(), endM: e.getHours() * 60 + e.getMinutes() }
  }).sort((a, b) => a.startM - b.startM || a.endM - b.endM)

  // Assign columns: greedy left-to-right
  const columns = [] // each column = array of items with their endM
  const result = []
  for (const item of items) {
    let placed = false
    for (let c = 0; c < columns.length; c++) {
      if (columns[c] <= item.startM) {
        columns[c] = item.endM
        result.push({ ...item, col: c })
        placed = true
        break
      }
    }
    if (!placed) {
      result.push({ ...item, col: columns.length })
      columns.push(item.endM)
    }
  }

  // Now determine how many columns each group of overlapping events uses
  // Group overlapping events: events overlap if they share any column-time range
  const groups = [] // array of { indices[], maxCol }
  const assigned = new Set()
  for (let i = 0; i < result.length; i++) {
    if (assigned.has(i)) continue
    const group = [i]
    assigned.add(i)
    let groupEnd = result[i].endM
    // Find all events that overlap with anyone in this group
    let changed = true
    while (changed) {
      changed = false
      for (let j = 0; j < result.length; j++) {
        if (assigned.has(j)) continue
        // Check if j overlaps with any event in the group
        const overlaps = group.some(gi => result[j].startM < result[gi].endM && result[j].endM > result[gi].startM)
        if (overlaps) {
          group.push(j)
          assigned.add(j)
          groupEnd = Math.max(groupEnd, result[j].endM)
          changed = true
        }
      }
    }
    const maxCol = Math.max(...group.map(gi => result[gi].col)) + 1
    group.forEach(gi => { result[gi].totalCols = maxCol })
  }

  return result // each: { evt, startM, endM, col, totalCols }
}

/* ━━━━━━━━━━━━━━━━━ EVENT POPOVER ━━━━━━━━━━━━━━━━━ */
function EventPopover({ event, x, y, onClose, onEdit, onDuplicate, onDelete }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.closest('input')) { onDelete(); onClose() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); onDuplicate() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, onDelete, onDuplicate])

  // Position: keep within viewport
  const popW = 380, popH = 320
  const left = Math.min(x, window.innerWidth - popW - 20)
  const top = Math.min(y, window.innerHeight - popH - 20)

  const start = toLocal(event.start_time)
  const end = toLocal(event.end_time)
  const cs = EVENT_COLORS[event.color] || EVENT_COLORS.slate
  const isTask = event.event_type === 'task'

  const isAppt = event.event_type === 'appointment'
  const durationH = Math.round((end - start) / 3600000 * 10) / 10

  return (
    <div ref={ref} style={{
      position: 'fixed', left, top, zIndex: 100, width: popW,
      backgroundColor: colours.surface, border: `1px solid ${colours.neutral[300]}`,
      borderRadius: radii.xl, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    }}>
      {/* Header strip */}
      <div style={{ height: 4, backgroundColor: isTask ? (PRIORITY_BORDER[event.priority] || '#525252') : cs.border }} />

      <div style={{ padding: '16px' }}>
        {/* Title + close */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cs.border, flexShrink: 0, marginTop: 5 }} />
          <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colours.neutral[900], flex: 1, lineHeight: 1.3 }}>{event.title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colours.neutral[500], padding: 2 }}><X size={16} /></button>
        </div>

        {/* Time + duration */}
        <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600], marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} />
          <span>{fmtTime(start)} – {fmtTime(end)}</span>
          <span style={{ color: colours.neutral[400] }}>·</span>
          <span>{start.toLocaleDateString('en-NZ', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span style={{ color: colours.neutral[400] }}>·</span>
          <span style={{ fontWeight: 600 }}>{durationH}h</span>
        </div>

        {/* Type badges */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: radii.full, backgroundColor: isTask ? colours.neutral[800] : cs.bg, color: isTask ? colours.neutral[100] : cs.text, border: `1px solid ${isTask ? colours.neutral[600] : cs.border}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {event.event_type}
          </span>
          {event.recurrence && <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: radii.full, backgroundColor: colours.surfaceRaised, color: colours.neutral[600] }}>Repeats {event.recurrence}</span>}
          {isTask && event.complexity_level != null && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: radii.full, backgroundColor: colours.neutral[200], color: colours.neutral[900] }}>L{event.complexity_level}</span>}
          {isTask && event.priority && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: radii.full, backgroundColor: event.priority === 'urgent' ? '#7f1d1d' : event.priority === 'high' ? '#78350f' : colours.surfaceRaised, color: event.priority === 'urgent' || event.priority === 'high' ? '#fff' : colours.neutral[600], textTransform: 'capitalize' }}>{event.priority}</span>}
        </div>

        {/* Detail rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          {event.location && (
            <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[600], display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} style={{ flexShrink: 0, color: colours.neutral[500] }} />
              <span>{event.location}</span>
            </div>
          )}
          {event.meeting_link && (
            <div style={{ fontSize: typography.fontSize.sm, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={14} style={{ flexShrink: 0, color: colours.neutral[500] }} />
              <a href={event.meeting_link} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{event.meeting_link}</a>
              <button onClick={() => { navigator.clipboard.writeText(event.meeting_link) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colours.neutral[500], padding: 2 }} title="Copy link"><Link2 size={12} /></button>
            </div>
          )}
          {isTask && (
            <div style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={14} style={{ flexShrink: 0, color: colours.neutral[500] }} />
              <span>{[event.client_name, event.category_name].filter(Boolean).join(' · ')}{event.estimated_hours && ` · ${event.estimated_hours}h est.`}{event.total_payout && ` · $${Number(event.total_payout).toFixed(0)}`}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${colours.neutral[200]}`, margin: '0 0 12px 0' }} />

        {/* Actions — using platform Button component */}
        <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
          {!isTask && <Button variant="secondary" size="sm" onClick={onEdit}><Edit3 size={13} /> Edit</Button>}
          <Button variant="secondary" size="sm" onClick={onDuplicate}><Copy size={13} /> Duplicate</Button>
          <Button variant="danger" size="sm" onClick={() => { onDelete(); onClose() }}><Trash2 size={13} /> Delete</Button>
        </div>

        {/* Keyboard hints */}
        <div style={{ marginTop: '8px', fontSize: '10px', color: colours.neutral[400], display: 'flex', gap: '12px' }}>
          <span>⌘D duplicate</span>
          <span>⌫ delete</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  )
}

/* ━━━━━━━━━━━━━━━━━ CREATE/EDIT EVENT MODAL ━━━━━━━━━━━━━━━━━ */
function EventModal({ isOpen, day, startMin, endMin, onClose, onSave, editData, mode }) {
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
    await onSave({
      event_type: eventType, title: title.trim(),
      start_time: start.toISOString(), end_time: end.toISOString(),
      color: eventType === 'appointment' ? 'blue' : color,
      location: location || undefined, meeting_link: meetingLink || undefined,
      recurrence: recurrence || undefined,
    })
    setSaving(false)
  }

  const modalTitle = mode === 'edit' ? 'Edit Event' : mode === 'duplicate' ? 'Duplicate Event' : 'New Event'
  const saveLabel = mode === 'edit' ? 'Save Changes' : mode === 'duplicate' ? 'Duplicate' : 'Create Event'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="sm">
      <Tabs tabs={[{ key: 'personal', label: 'Personal' }, { key: 'appointment', label: 'Appointment' }]} activeTab={eventType} onChange={setEventType} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4], marginTop: spacing[4] }}>
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)}
          placeholder={eventType === 'personal' ? 'e.g. Lunch, Gym, Focus time' : 'e.g. Client call, Team sync'}
          size="md" autoFocus />

        {/* Time — two clean selects */}
        <div style={{ display: 'flex', gap: spacing[4] }}>
          <div style={{ flex: 1 }}><Select label="Start" value={startVal} onChange={e => setStartVal(e.target.value)} options={TIME_OPTIONS} /></div>
          <div style={{ flex: 1 }}><Select label="End" value={endVal} onChange={e => setEndVal(e.target.value)} options={TIME_OPTIONS} /></div>
        </div>

        {eventType === 'personal' && (
          <div>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[500], marginBottom: spacing[2] }}>Colour</div>
            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
              {Object.keys(EVENT_COLORS).map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: radii.full,
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                <label style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colours.neutral[500] }}>Meeting Link</label>
                <button onClick={() => setMeetingLink(generateMeetLink())} style={{
                  fontSize: '11px', color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <Video size={12} /> Generate free link
                </button>
              </div>
              <Input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." size="md" icon={<Link2 size={16} />} />
              {meetingLink && (
                <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[1] }}>
                  <a href={meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '3px' }}><ExternalLink size={10} /> Open</a>
                  <button onClick={() => navigator.clipboard.writeText(meetingLink)} style={{ fontSize: '11px', color: colours.neutral[500], background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}><Copy size={10} /> Copy</button>
                </div>
              )}
            </div>
          </>
        )}

        <Select label="Repeat" value={recurrence} onChange={e => setRecurrence(e.target.value)} options={RECURRENCE_OPTIONS} />
      </div>

      <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[6], justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim() || saving}>
          {saving ? 'Saving...' : saveLabel}
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
  const [modal, setModal] = useState(null) // { day, startMin, endMin, editData?, mode }
  const [popover, setPopover] = useState(null) // { event, x, y }
  const [focusedEventId, setFocusedEventId] = useState(null) // expanded event
  const gridRef = useRef(null)

  // Interaction states
  const [dragCreate, setDragCreate] = useState(null) // { dayIdx, startMins, currentMins }
  const [dragMove, setDragMove] = useState(null) // { event, dayIdx, offsetMins, currentDayIdx, currentMins }
  const [dragResize, setDragResize] = useState(null) // { event, edge, currentMins }
  const interacting = useRef(null) // 'create' | 'move' | 'resize' | null
  const pendingDrag = useRef(null) // { type, startX, startY, ...data } — holds mousedown until threshold
  const DRAG_THRESHOLD = 5 // pixels before drag activates

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
    if (!loading && gridRef.current) gridRef.current.scrollTop = Math.max(0, (new Date().getHours() - 2) * HOUR_HEIGHT)
  }, [loading])

  // Close popover + clear focus on scroll
  useEffect(() => {
    if (!popover) return
    const close = () => { setPopover(null); setFocusedEventId(null) }
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [popover])

  /* ─── API Handlers ─── */
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
      addToast('Removed', 'success'); setPopover(null); fetchData()
    } catch { addToast('Failed to remove', 'error') }
  }

  const handleCreateEvent = async (eventData) => {
    try {
      await createCalendarEvent(eventData)
      addToast(`${eventData.event_type === 'appointment' ? 'Appointment' : 'Block'} created`, 'success')
      setModal(null); fetchData()
    } catch { addToast('Failed to create', 'error') }
  }

  const handleUpdateEvent = async (eventData) => {
    if (!modal?.editData?.id) return
    try {
      const id = modal.editData._recurring_parent_id || modal.editData.id
      await updateCalendarEvent(id, eventData)
      addToast('Updated', 'success'); setModal(null); fetchData()
    } catch { addToast('Failed to update', 'error') }
  }

  const handleMoveEvent = async (evt, newDayIdx, newStartMins) => {
    const oldStart = toLocal(evt.start_time)
    const oldEnd = toLocal(evt.end_time)
    const durationMins = (oldEnd - oldStart) / 60000
    const newDay = weekDays[newDayIdx]
    const newStart = new Date(newDay); newStart.setHours(0, newStartMins, 0, 0)
    const newEnd = new Date(newStart.getTime() + durationMins * 60000)
    try {
      if (evt.event_type === 'task') await updateBlock(evt.id, { start_time: newStart.toISOString(), end_time: newEnd.toISOString() })
      else await updateCalendarEvent(evt._recurring_parent_id || evt.id, { start_time: newStart.toISOString(), end_time: newEnd.toISOString() })
      addToast('Moved', 'success'); fetchData()
    } catch { addToast('Failed to move', 'error') }
  }

  const handleResizeEvent = async (evt, newEndMins) => {
    const start = toLocal(evt.start_time)
    const newEnd = new Date(start); newEnd.setHours(0, newEndMins, 0, 0)
    if (newEnd <= start) return
    try {
      if (evt.event_type === 'task') await updateBlock(evt.id, { end_time: newEnd.toISOString() })
      else await updateCalendarEvent(evt._recurring_parent_id || evt.id, { end_time: newEnd.toISOString() })
      addToast('Resized', 'success'); fetchData()
    } catch { addToast('Failed to resize', 'error') }
  }

  const openDuplicate = (evt) => {
    setPopover(null)
    const start = toLocal(evt.start_time); const end = toLocal(evt.end_time)
    setModal({
      day: start, startMin: start.getHours() * 60 + start.getMinutes(), endMin: end.getHours() * 60 + end.getMinutes(), mode: 'duplicate',
      editData: { title: evt.title + ' (copy)', event_type: evt.event_type, color: evt.color, location: evt.location, meeting_link: evt.meeting_link, recurrence: evt.recurrence },
    })
  }

  const openEdit = (evt) => {
    setPopover(null)
    const start = toLocal(evt.start_time); const end = toLocal(evt.end_time)
    setModal({
      day: start, startMin: start.getHours() * 60 + start.getMinutes(), endMin: end.getHours() * 60 + end.getMinutes(), mode: 'edit',
      editData: { id: evt.id, _recurring_parent_id: evt._recurring_parent_id, title: evt.title, event_type: evt.event_type, color: evt.color, location: evt.location, meeting_link: evt.meeting_link, recurrence: evt.recurrence },
    })
  }

  /* ─── Pixel → Minutes for column ─── */
  const getMinutesFromY = useCallback((clientY, colEl) => {
    if (!colEl) return 0
    const colRect = colEl.getBoundingClientRect()
    const relY = clientY - colRect.top // getBoundingClientRect already accounts for scroll
    return yToMinutes(relY)
  }, [])

  const getDayIdxFromX = useCallback((clientX) => {
    if (!gridRef.current) return 0
    const gridRect = gridRef.current.getBoundingClientRect()
    const labelWidth = 54
    const colWidth = (gridRect.width - labelWidth) / 7
    const x = clientX - gridRect.left - labelWidth
    return Math.max(0, Math.min(6, Math.floor(x / colWidth)))
  }, [])

  /* ─── Drag-to-Create (with threshold) ─── */
  const handleGridMouseDown = (e, dayIdx) => {
    if (e.button !== 0) return
    const col = e.currentTarget.closest ? e.currentTarget.closest('[data-col]') || e.currentTarget : e.currentTarget
    const mins = getMinutesFromY(e.clientY, col)
    pendingDrag.current = { type: 'create', startX: e.clientX, startY: e.clientY, dayIdx, mins, col }
    setPopover(null)
    e.preventDefault()
  }

  /* ─── Drag-to-Move (with threshold) ─── */
  const handleEventMouseDown = (e, evt, dayIdx) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const col = e.currentTarget.closest('[data-col]')
    const mins = getMinutesFromY(e.clientY, col)
    const startMins = toLocal(evt.start_time).getHours() * 60 + toLocal(evt.start_time).getMinutes()
    pendingDrag.current = { type: 'move', startX: e.clientX, startY: e.clientY, evt, dayIdx, offsetMins: mins - startMins, startMins }
    e.preventDefault()
  }

  /* ─── Drag-to-Resize (with threshold) ─── */
  const handleResizeMouseDown = (e, evt) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const endTime = toLocal(evt.end_time)
    pendingDrag.current = { type: 'resize', startX: e.clientX, startY: e.clientY, evt, endMins: endTime.getHours() * 60 + endTime.getMinutes() }
    e.preventDefault()
  }

  /* ─── Right-click / Click to open detail ─── */
  const handleEventClick = (e, evt) => {
    e.stopPropagation()
    setPopover({ event: evt, x: e.clientX, y: e.clientY })
  }
  const handleEventContextMenu = (e, evt) => {
    e.preventDefault()
    e.stopPropagation()
    setPopover({ event: evt, x: e.clientX, y: e.clientY })
  }

  /* ─── Global Mouse Handlers (threshold-aware) ─── */
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Check pending drag threshold
      if (pendingDrag.current && !interacting.current) {
        const dx = e.clientX - pendingDrag.current.startX
        const dy = e.clientY - pendingDrag.current.startY
        if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
          const pd = pendingDrag.current
          if (pd.type === 'create') {
            interacting.current = 'create'
            setDragCreate({ dayIdx: pd.dayIdx, startMins: pd.mins, currentMins: pd.mins })
          } else if (pd.type === 'move') {
            interacting.current = 'move'
            setDragMove({ event: pd.evt, dayIdx: pd.dayIdx, offsetMins: pd.offsetMins, currentDayIdx: pd.dayIdx, currentMins: pd.startMins })
            setPopover(null)
          } else if (pd.type === 'resize') {
            interacting.current = 'resize'
            setDragResize({ event: pd.evt, edge: 'bottom', currentMins: pd.endMins })
            setPopover(null)
          }
          pendingDrag.current = null
        }
      }

      // Active drag updates
      if (interacting.current === 'create' && dragCreate) {
        const col = gridRef.current?.querySelector(`[data-col="${dragCreate.dayIdx}"]`)
        if (col) { const mins = getMinutesFromY(e.clientY, col); setDragCreate(prev => prev ? { ...prev, currentMins: mins } : null) }
      }
      if (interacting.current === 'move' && dragMove) {
        const dayIdx = getDayIdxFromX(e.clientX)
        const col = gridRef.current?.querySelector(`[data-col="${dayIdx}"]`)
        if (col) {
          const mins = getMinutesFromY(e.clientY, col)
          const startMins = snapTo15(mins - dragMove.offsetMins)
          setDragMove(prev => prev ? { ...prev, currentDayIdx: dayIdx, currentMins: Math.max(0, startMins) } : null)
        }
      }
      if (interacting.current === 'resize' && dragResize) {
        const evt = dragResize.event
        const start = toLocal(evt.start_time)
        const dayIdx = weekDays.findIndex(d => isSameDay(d, start))
        const col = gridRef.current?.querySelector(`[data-col="${dayIdx}"]`)
        if (col) {
          const mins = getMinutesFromY(e.clientY, col)
          const startMins = start.getHours() * 60 + start.getMinutes()
          setDragResize(prev => prev ? { ...prev, currentMins: Math.max(startMins + 15, mins) } : null)
        }
      }
    }

    const handleMouseUp = (e) => {
      // If pending drag never reached threshold = it was a click
      if (pendingDrag.current && !interacting.current) {
        const pd = pendingDrag.current
        pendingDrag.current = null
        if (pd.type === 'move') {
          // Click on event → open detail panel + focus/expand it
          setFocusedEventId(prev => prev === pd.evt.id ? null : pd.evt.id)
          setPopover({ event: pd.evt, x: e.clientX, y: e.clientY })
        } else if (pd.type === 'create') {
          // Single click on grid → open create modal at that time
          setModal({ day: weekDays[pd.dayIdx], startMin: pd.mins, endMin: pd.mins + 60, mode: 'create' })
          setShowTaskPicker(false)
        }
        return
      }

      if (interacting.current === 'create' && dragCreate) {
        const minM = Math.min(dragCreate.startMins, dragCreate.currentMins)
        const maxM = Math.max(dragCreate.startMins, dragCreate.currentMins) + 15
        if (maxM - minM >= 15) {
          setModal({ day: weekDays[dragCreate.dayIdx], startMin: minM, endMin: maxM, mode: 'create' })
          setShowTaskPicker(false)
        }
        setDragCreate(null)
      }
      if (interacting.current === 'move' && dragMove) {
        handleMoveEvent(dragMove.event, dragMove.currentDayIdx, dragMove.currentMins)
        setDragMove(null)
      }
      if (interacting.current === 'resize' && dragResize) {
        handleResizeEvent(dragResize.event, dragResize.currentMins)
        setDragResize(null)
      }
      interacting.current = null
      pendingDrag.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
  }, [dragCreate, dragMove, dragResize])

  /* ─── Derived State ─── */
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

  // Weekly hours breakdown by type
  const hoursByType = useMemo(() => {
    const buckets = {}
    events.forEach(evt => {
      const start = toLocal(evt.start_time)
      const end = toLocal(evt.end_time)
      const hours = Math.round((end - start) / 3600000 * 10) / 10
      if (hours <= 0) return
      let label
      if (evt.event_type === 'task') {
        label = evt.client_name || evt.category_name || 'Tasks'
      } else if (evt.event_type === 'appointment') {
        label = 'Meetings'
      } else {
        // Group personal events by title keyword
        const t = (evt.title || '').toLowerCase()
        if (t.includes('gym') || t.includes('workout') || t.includes('exercise') || t.includes('run') || t.includes('fitness')) label = 'Fitness'
        else if (t.includes('lunch') || t.includes('breakfast') || t.includes('dinner') || t.includes('meal')) label = 'Meals'
        else if (t.includes('focus') || t.includes('deep work')) label = 'Focus time'
        else label = 'Personal'
      }
      buckets[label] = (buckets[label] || 0) + hours
    })
    return Object.entries(buckets).sort((a, b) => b[1] - a[1])
  }, [events])

  const totalHours = hoursByType.reduce((sum, [, h]) => sum + h, 0)
  const subtitleParts = hoursByType.length > 0
    ? hoursByType.slice(0, 4).map(([label, h]) => `${h}h ${label}`).concat(totalHours > 0 ? [`${Math.round(totalHours * 10) / 10}h total`] : [])
    : []

  const isDragging = interacting.current != null || dragCreate || dragMove || dragResize

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: spacing[12], minHeight: '60vh' }}><Spinner size="lg" /></div>

  return (
    <div style={{ padding: spacing[6], maxWidth: 1400, margin: '0 auto' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[5], flexWrap: 'wrap', gap: spacing[3] }}>
        <PageHeader title="Calendar" subtitle={subtitleParts.length ? subtitleParts.join(' · ') : 'No events this week'} />
        <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
          {!isThisWeek && <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>}
          <Button variant="secondary" size="sm" onClick={() => { const h = Math.min(today.getHours() + 1, 23); setModal({ day: today, startMin: h * 60, endMin: (h + 1) * 60, mode: 'create' }) }}>
            <Plus size={14} /> Event
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setShowTaskPicker(!showTaskPicker); setModal(null) }}>
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
              <p style={{ fontSize: typography.fontSize.sm, color: colours.neutral[500], marginBottom: spacing[4], marginTop: 0 }}>Pick a task and we'll suggest the best time slots.</p>
              {tasks.length === 0 ? (
                <EmptyState icon={<CalendarDays size={40} style={{ color: colours.neutral[400] }} />} title="No active tasks" description="You don't have any tasks assigned yet." />
              ) : unscheduled.length === 0 ? (
                <EmptyState icon={<Zap size={40} style={{ color: colours.neutral[400] }} />} title="All caught up" description="Every assigned task already has a time block." />
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
      <GlowCard style={{ padding: 0, overflow: 'hidden', userSelect: isDragging ? 'none' : 'auto' }}>
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
              <div key={dayIdx} data-col={dayIdx} style={{ position: 'relative', borderRight: dayIdx < 6 ? `1px solid ${colours.neutral[300]}` : 'none', cursor: isDragging ? 'ns-resize' : 'default' }}>

                {/* Hour grid lines + clickable cells */}
                {HOURS.map(h => {
                  const isNight = h < 5 || h >= 23
                  return (
                    <div key={h} data-gridcell="true"
                      onMouseDown={(e) => { if (e.button === 0) { e.preventDefault(); handleGridMouseDown(e, dayIdx) } }}
                      style={{ height: HOUR_HEIGHT, borderBottom: `1px solid ${colours.neutral[200]}`, backgroundColor: isNight ? 'rgba(0,0,0,0.15)' : isDayToday ? 'rgba(255,255,255,0.015)' : 'transparent' }}
                    />
                  )
                })}

                {/* Drag-to-create preview */}
                {dragCreate && dragCreate.dayIdx === dayIdx && (() => {
                  const minM = Math.min(dragCreate.startMins, dragCreate.currentMins)
                  const maxM = Math.max(dragCreate.startMins, dragCreate.currentMins) + 15
                  return (
                    <div style={{
                      position: 'absolute', left: 4, right: 4, pointerEvents: 'none', zIndex: 3,
                      top: minutesToY(minM), height: minutesToY(maxM) - minutesToY(minM),
                      backgroundColor: 'rgba(59,130,246,0.18)', border: '2px dashed rgba(59,130,246,0.5)', borderRadius: radii.md,
                    }}>
                      <div style={{ padding: '3px 8px', fontSize: '11px', color: '#93c5fd', fontWeight: 600 }}>{fmtMinutes(minM)} – {fmtMinutes(maxM)}</div>
                    </div>
                  )
                })()}

                {/* Drag-to-move ghost */}
                {dragMove && dragMove.currentDayIdx === dayIdx && (() => {
                  const evt = dragMove.event
                  const oldStart = toLocal(evt.start_time); const oldEnd = toLocal(evt.end_time)
                  const durationMins = (oldEnd - oldStart) / 60000
                  const cs = EVENT_COLORS[evt.color] || EVENT_COLORS.slate
                  return (
                    <div style={{
                      position: 'absolute', left: 4, right: 4, pointerEvents: 'none', zIndex: 6,
                      top: minutesToY(dragMove.currentMins), height: minutesToY(durationMins),
                      backgroundColor: cs.bg, borderLeft: `3px solid ${cs.border}`, borderRadius: radii.md,
                      opacity: 0.7, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}>
                      <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, color: cs.text }}>{evt.title}</div>
                      <div style={{ padding: '0 8px', fontSize: '10px', color: cs.text, opacity: 0.7 }}>{fmtMinutes(dragMove.currentMins)} – {fmtMinutes(dragMove.currentMins + durationMins)}</div>
                    </div>
                  )
                })()}

                {/* Now indicator */}
                {isDayToday && (
                  <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, height: 2, backgroundColor: '#ef4444', zIndex: 4, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  </div>
                )}

                {/* Event blocks (overlap-aware layout) */}
                {layoutOverlappingEvents(dayEvents).map(({ evt, startM: sM, endM: eM, col, totalCols }) => {
                  const start = toLocal(evt.start_time); const end = toLocal(evt.end_time)
                  const isTask = evt.event_type === 'task'
                  const isAppt = evt.event_type === 'appointment'
                  const cs = EVENT_COLORS[evt.color] || EVENT_COLORS.slate
                  const bg = isTask ? colours.neutral[800] : cs.bg
                  const bdr = isTask ? (PRIORITY_BORDER[evt.priority] || '#525252') : (isAppt ? EVENT_COLORS.blue.border : cs.border)
                  const txt = isTask ? colours.neutral[100] : cs.text

                  // During resize, show updated height
                  const isResizing = dragResize && (dragResize.event.id === evt.id)
                  const displayEM = isResizing ? dragResize.currentMins : eM
                  const top = minutesToY(sM)
                  const height = Math.max(minutesToY(displayEM - sM), QUARTER)

                  // During move, hide original
                  const isMoving = dragMove && dragMove.event.id === evt.id
                  if (isMoving) return null

                  // Focus: when clicked, expand to full width
                  const isFocused = focusedEventId === evt.id
                  const colWidth = 100 / totalCols
                  const leftPct = isFocused ? '0%' : `${col * colWidth}%`
                  const widthPct = isFocused ? '100%' : `${colWidth}%`

                  return (
                    <div key={evt.id}
                      onContextMenu={(e) => handleEventContextMenu(e, evt)}
                      onMouseDown={(e) => handleEventMouseDown(e, evt, dayIdx)}
                      style={{
                        position: 'absolute', top, height,
                        left: `calc(${leftPct} + 2px)`, width: `calc(${widthPct} - 4px)`,
                        backgroundColor: bg, borderRadius: radii.md, padding: '4px 8px', overflow: 'hidden',
                        borderLeft: `3px solid ${bdr}`, cursor: isDragging ? 'ns-resize' : 'pointer',
                        zIndex: isFocused ? 10 : 2,
                        boxShadow: isFocused ? '0 4px 20px rgba(0,0,0,0.6)' : '0 1px 6px rgba(0,0,0,0.4)',
                        transition: isResizing ? 'none' : 'left 200ms, width 200ms, box-shadow 150ms, z-index 0ms',
                        opacity: totalCols > 1 && !isFocused ? 0.92 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isAppt && <Phone size={10} style={{ color: txt, opacity: 0.7, flexShrink: 0 }} />}
                        {!isTask && !isAppt && <Moon size={10} style={{ color: txt, opacity: 0.7, flexShrink: 0 }} />}
                        <span style={{ fontSize: '11px', fontWeight: 600, color: txt, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{evt.title}</span>
                      </div>
                      {height >= 36 && <div style={{ fontSize: '10px', color: txt, opacity: 0.6, marginTop: 2 }}>{fmtTime(start)} – {isResizing ? fmtMinutes(dragResize.currentMins) : fmtTime(end)}</div>}
                      {height >= 52 && isTask && <div style={{ fontSize: '10px', color: txt, opacity: 0.5, marginTop: 1 }}>{evt.client_name}{evt.total_payout && ` · $${Number(evt.total_payout).toFixed(0)}`}</div>}
                      {height >= 52 && isAppt && evt.location && <div style={{ fontSize: '10px', color: txt, opacity: 0.5, marginTop: 1, display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={8} />{evt.location}</div>}
                      {height >= 52 && evt.meeting_link && <div style={{ fontSize: '10px', color: '#60a5fa', opacity: 0.8, marginTop: 1, display: 'flex', alignItems: 'center', gap: '3px' }}><Video size={8} /> Meeting</div>}

                      {/* Resize handle (bottom edge) */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, evt)}
                        style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
                          cursor: 'ns-resize', display: 'flex', justifyContent: 'center', alignItems: 'center',
                          borderRadius: `0 0 ${radii.md} ${radii.md}`,
                        }}
                      >
                        <div style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: txt, opacity: 0.2 }} />
                      </div>
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
          <EmptyState icon={<CalendarDays size={48} style={{ color: colours.neutral[400] }} />} title="Your calendar is empty" description="Drag across a time range to create an event, or use + Event to add one." action={{ label: '+ New Event', onClick: () => { const h = Math.min(today.getHours() + 1, 23); setModal({ day: today, startMin: h * 60, endMin: (h + 1) * 60, mode: 'create' }) } }} />
        </GlowCard>
      )}

      {/* ─── Event Modal ─── */}
      <EventModal
        isOpen={!!modal}
        day={modal?.day || today}
        startMin={modal?.startMin ?? 540}
        endMin={modal?.endMin ?? 600}
        editData={modal?.editData}
        mode={modal?.mode || 'create'}
        onClose={() => setModal(null)}
        onSave={modal?.mode === 'edit' ? handleUpdateEvent : handleCreateEvent}
      />

      {/* ─── Event Popover ─── */}
      {popover && (
        <EventPopover
          event={popover.event} x={popover.x} y={popover.y}
          onClose={() => { setPopover(null); setFocusedEventId(null) }}
          onEdit={() => openEdit(popover.event)}
          onDuplicate={() => openDuplicate(popover.event)}
          onDelete={() => handleDeleteEvent(popover.event)}
        />
      )}
    </div>
  )
}
