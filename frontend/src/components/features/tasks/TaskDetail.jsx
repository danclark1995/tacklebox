import { useState, useRef, useMemo } from 'react'
import { MessageSquare, Send, Lock } from 'lucide-react'
import { Tabs, Button, Badge, StatusBadge, Avatar, Modal, Select, Textarea, FileUpload, EmptyState, TaskProgressTracker, Toggle } from '@/components/ui'
import TaskHistory from './TaskHistory'
import TimeLogSection from '@/components/features/tasks/TimeLogSection'
import ReviewSection from '@/components/features/tasks/ReviewSection'
import AttachmentList from '@/components/features/tasks/AttachmentList'
import { TASK_STATUSES, PRIORITIES, COMMENT_VISIBILITY, UPLOAD_TYPES } from '@/config/constants'
import { formatDate, formatDateTime, formatFileSize } from '@/utils/formatters'
import { colours, spacing, typography, radii } from '@/config/tokens'
import useAuth from '@/hooks/useAuth'

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  if (days === 1) {
    const d = new Date(dateStr)
    return `Yesterday at ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`
  }
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

const ROLE_LABELS_DEFAULT = { admin: 'Admin', contractor: 'Camper', client: 'Client' }
const ROLE_LABELS_CLIENT = { admin: 'Team', contractor: 'Designer', client: 'Client' }

export default function TaskDetail({
  task,
  comments = [],
  attachments = [],
  history = [],
  timeEntries = [],
  reviews = [],
  totalTimeMinutes = 0,
  onStatusChange,
  onComment,
  onFileUpload,
  onDeleteAttachment,
  onAddTimeEntry,
  onUpdateTimeEntry,
  onDeleteTimeEntry,
  onSubmitReview,
  brandProfile = null,
  loading = false,
}) {
  const { user, hasRole } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentInternal, setCommentInternal] = useState(false)
  const [selectedContractor, setSelectedContractor] = useState('')
  const textareaRef = useRef(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0)

  const isContractor = hasRole('contractor')
  const isAdmin = hasRole('admin')
  const isClient = hasRole('client')

  const taskParticipants = useMemo(() => {
    const users = []
    const seen = new Set()
    if (task?.client_name && task?.client_id) {
      users.push({ id: task.client_id, name: task.client_name, role: 'Client' })
      seen.add(task.client_id)
    }
    if (task?.contractor_name && task?.contractor_id && !seen.has(task.contractor_id)) {
      users.push({ id: task.contractor_id, name: task.contractor_name, role: isClient ? 'Designer' : 'Camper' })
      seen.add(task.contractor_id)
    }
    comments.forEach(c => {
      if (c.user_id && !seen.has(c.user_id)) {
        seen.add(c.user_id)
        const labels = isClient ? ROLE_LABELS_CLIENT : ROLE_LABELS_DEFAULT
        users.push({ id: c.user_id, name: c.user_name, role: labels[c.user_role] || c.user_role })
      }
    })
    return users
  }, [task?.client_id, task?.client_name, task?.contractor_id, task?.contractor_name, comments, isClient])

  if (!task) {
    return <EmptyState title="Task not found" description="The task you're looking for doesn't exist." />
  }
  const isAssignedContractor = isContractor && task.contractor_id === user?.id
  const roleLabels = isClient ? ROLE_LABELS_CLIENT : ROLE_LABELS_DEFAULT

  const priorityVariantMap = {
    [PRIORITIES.URGENT]: 'error',
    [PRIORITIES.HIGH]: 'warning',
    [PRIORITIES.MEDIUM]: 'info',
    [PRIORITIES.LOW]: 'neutral',
  }

  const handleStatusChange = (newStatus, note = '') => {
    if (onStatusChange) {
      onStatusChange(newStatus, note)
    }
  }

  const handleSubmitComment = () => {
    if (commentText.trim() && onComment) {
      onComment({
        content: commentText,
        visibility: commentInternal ? COMMENT_VISIBILITY.INTERNAL : COMMENT_VISIBILITY.ALL,
      })
      setCommentText('')
      setCommentInternal(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const insertMention = (mentionUser) => {
    const cursorPos = textareaRef.current?.selectionStart || commentText.length
    const textBefore = commentText.substring(0, cursorPos)
    const textAfter = commentText.substring(cursorPos)
    const atIndex = textBefore.lastIndexOf('@')
    const newText = textBefore.substring(0, atIndex) + `@${mentionUser.name} ` + textAfter
    setCommentText(newText)
    setShowMentions(false)
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = atIndex + mentionUser.name.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(pos, pos)
      }
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (showMentions) {
      const filtered = taskParticipants.filter(u =>
        u.name.toLowerCase().includes(mentionFilter)
      )
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIdx(prev => Math.min(prev + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIdx(prev => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedMentionIdx]) insertMention(filtered[selectedMentionIdx])
        return
      }
      if (e.key === 'Escape') {
        setShowMentions(false)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  const handleTextareaInput = (e) => {
    const value = e.target.value
    setCommentText(value)
    // Detect @mention trigger
    const cursorPos = e.target.selectionStart
    const textBefore = value.substring(0, cursorPos)
    const atMatch = textBefore.match(/@(\w*)$/)
    if (atMatch) {
      setMentionFilter(atMatch[1].toLowerCase())
      setShowMentions(true)
      setSelectedMentionIdx(0)
    } else {
      setShowMentions(false)
    }
    // Auto-grow
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const renderActionButtons = () => {
    const buttons = []

    if (isAssignedContractor && task.status === TASK_STATUSES.ASSIGNED) {
      buttons.push(
        <Button key="start-work" variant="primary" onClick={() => handleStatusChange(TASK_STATUSES.IN_PROGRESS)} disabled={loading}>
          Start Work
        </Button>
      )
    }

    if (isAssignedContractor && task.status === TASK_STATUSES.IN_PROGRESS) {
      const hasDeliverables = attachments.some(a => a.upload_type === UPLOAD_TYPES.DELIVERABLE)
      buttons.push(
        <Button key="submit-review" variant="primary" onClick={() => handleStatusChange(TASK_STATUSES.REVIEW)} disabled={loading || !hasDeliverables} title={!hasDeliverables ? 'Upload at least one deliverable first' : ''}>
          Submit for Review
        </Button>
      )
    }

    if (isAssignedContractor && task.status === TASK_STATUSES.REVISION) {
      buttons.push(
        <Button key="resume-work" variant="primary" onClick={() => handleStatusChange(TASK_STATUSES.IN_PROGRESS)} disabled={loading}>
          Resume Work
        </Button>
      )
    }

    if (isAdmin && task.status === TASK_STATUSES.SUBMITTED) {
      buttons.push(
        <Button key="assign" variant="primary" onClick={() => setShowAssignModal(true)} disabled={loading}>
          Assign Task
        </Button>
      )
    }

    if (isAdmin && task.status === TASK_STATUSES.REVIEW) {
      buttons.push(
        <Button key="approve" variant="success" onClick={() => handleStatusChange(TASK_STATUSES.APPROVED)} disabled={loading}>
          Approve
        </Button>,
        <Button key="revision" variant="warning" onClick={() => { const feedback = prompt('Enter revision feedback:'); if (feedback) handleStatusChange(TASK_STATUSES.REVISION, feedback) }} disabled={loading}>
          Request Revision
        </Button>
      )
    }

    if (isAdmin && task.status === TASK_STATUSES.APPROVED) {
      buttons.push(
        <Button key="close" variant="primary" onClick={() => handleStatusChange(TASK_STATUSES.CLOSED)} disabled={loading}>
          Close Task
        </Button>
      )
    }

    return buttons
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'attachments', label: `Attachments (${attachments.length})` },
    ...(!isClient ? [
      { key: 'time-log', label: 'Time Log' },
      { key: 'reviews', label: 'Reviews' },
      { key: 'history', label: 'History' },
    ] : []),
  ]

  return (
    <div className="task-detail">
      {/* Header */}
      <div style={{
        padding: spacing[6],
        backgroundColor: colours.white,
        borderBottom: `1px solid ${colours.neutral[200]}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[4] }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: colours.neutral[900], marginBottom: spacing[2] }}>
              {task.title}
            </h1>
            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
              <StatusBadge status={task.status} />
              <Badge variant={priorityVariantMap[task.priority]}>
                {task.priority?.toUpperCase()}
              </Badge>
              {task.category_name && (
                <Badge variant="neutral">{task.category_name}</Badge>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing[3] }}>
            {renderActionButtons()}
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div style={{ padding: `0 ${spacing[6]}`, backgroundColor: colours.white, borderBottom: `1px solid ${colours.neutral[200]}` }}>
        <TaskProgressTracker status={task.status} />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div style={{ padding: spacing[6] }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: spacing[6] }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: spacing[3] }}>Description</h3>
              <p style={{ lineHeight: 1.6, color: colours.neutral[700], whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
              <InfoCard label="Project" value={task.project_name} />
              <InfoCard label="Client" value={task.client_name} />
              {task.contractor_name && <InfoCard label={isClient ? "Your designer" : "Camper"} value={task.contractor_name} />}
              {task.deadline && <InfoCard label="Deadline" value={formatDate(task.deadline)} />}
              <InfoCard label="Created" value={formatDateTime(task.created_at)} />
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <AttachmentList
            attachments={attachments}
            onDelete={onDeleteAttachment}
            onUpload={onFileUpload}
            taskStatus={task.status}
            loading={loading}
          />
        )}

        {activeTab === 'time-log' && (
          <TimeLogSection
            taskId={task.id}
            timeEntries={timeEntries}
            onAddEntry={onAddTimeEntry}
            onUpdateEntry={onUpdateTimeEntry}
            onDeleteEntry={onDeleteTimeEntry}
            loading={loading}
            taskCreatedAt={task.created_at}
          />
        )}

        {activeTab === 'reviews' && (
          task.status === 'closed' ? (
            <ReviewSection
              taskId={task.id}
              reviews={reviews}
              totalTimeMinutes={totalTimeMinutes}
              onSubmitReview={onSubmitReview}
              loading={loading}
            />
          ) : (
            <EmptyState
              title="Reviews available after task is closed"
              description="Post-task reviews can be submitted once the task is closed."
            />
          )
        )}

        {activeTab === 'history' && (
          <TaskHistory history={history} />
        )}
      </div>

      {/* ── Discussion Section (always visible) ──────────────── */}
      <div style={{
        borderTop: '1px solid #222',
        padding: spacing[6],
      }}>
        <h2 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '18px',
          fontWeight: 600,
          color: colours.neutral[900],
          marginBottom: spacing[4],
        }}>
          <MessageSquare size={18} />
          Discussion ({comments.length})
        </h2>

        {/* Comment Thread */}
        <div style={{
          border: '1px solid #222',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: spacing[4],
        }}>
          {comments.length === 0 ? (
            <div style={{
              padding: spacing[6],
              textAlign: 'center',
              color: colours.neutral[500],
              fontSize: '14px',
            }}>
              No comments yet. Start the discussion below.
            </div>
          ) : (
            comments.map((comment, i) => (
              <DiscussionComment key={comment.id} comment={comment} index={i} roleLabels={roleLabels} />
            ))
          )}

          {/* Comment Input */}
          <div style={{
            borderTop: '1px solid #222',
            padding: '12px 16px',
            backgroundColor: colours.neutral[50],
            position: 'relative',
          }}>
            {showMentions && (() => {
              const filtered = taskParticipants.filter(u =>
                u.name.toLowerCase().includes(mentionFilter)
              )
              if (filtered.length === 0) return null
              return (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: colours.neutral[100],
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                }}>
                  {filtered.map((mentionUser, i) => (
                    <div
                      key={mentionUser.id}
                      onClick={() => insertMention(mentionUser)}
                      onMouseEnter={() => setSelectedMentionIdx(i)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: i === selectedMentionIdx ? colours.neutral[200] : 'transparent',
                      }}
                    >
                      <Avatar name={mentionUser.name} size="sm" />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: colours.neutral[900] }}>{mentionUser.name}</span>
                      <span style={{ fontSize: '11px', color: colours.neutral[500], marginLeft: 'auto' }}>{mentionUser.role}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  overflow: 'hidden',
                  backgroundColor: colours.neutral[100],
                  border: `1px solid ${colours.neutral[200]}`,
                  borderRadius: radii.md,
                  padding: `${spacing[3]} ${spacing[3]}`,
                  color: colours.neutral[900],
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.sans,
                  lineHeight: typography.lineHeight.normal,
                  outline: 'none',
                  maxHeight: '120px',
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                icon={<Send size={18} />}
              />
            </div>
            {(isAdmin || isContractor) && (
              <div style={{ marginTop: '8px' }}>
                <Toggle
                  checked={commentInternal}
                  onChange={setCommentInternal}
                  label="Internal only"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title="Assign Task"
        >
          <div style={{ padding: spacing[4] }}>
            <Select
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              options={[
                { value: '', label: 'Select camper...' },
              ]}
            />
            <div style={{ marginTop: spacing[4], display: 'flex', gap: spacing[2] }}>
              <Button
                variant="primary"
                onClick={() => {
                  if (selectedContractor) {
                    handleStatusChange(TASK_STATUSES.ASSIGNED, selectedContractor)
                    setShowAssignModal(false)
                  }
                }}
              >
                Assign
              </Button>
              <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div style={{
      padding: spacing[3],
      backgroundColor: colours.neutral[50],
      borderRadius: '6px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 500, color: colours.neutral[600], marginBottom: spacing[1] }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: colours.neutral[900] }}>
        {value || 'N/A'}
      </div>
    </div>
  )
}

function renderMentions(text) {
  if (!text) return text
  const regex = /@([A-Za-z]+(?:\s[A-Za-z]+)*)/g
  const parts = []
  let lastIdx = 0
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.substring(lastIdx, m.index))
    parts.push(<strong key={m.index} style={{ color: colours.neutral[900], fontWeight: 700 }}>{m[0]}</strong>)
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < text.length) parts.push(text.substring(lastIdx))
  return parts.length > 0 ? parts : text
}

function DiscussionComment({ comment, index, roleLabels = ROLE_LABELS_DEFAULT }) {
  const isInternal = comment.visibility === COMMENT_VISIBILITY.INTERNAL

  return (
    <div style={{
      padding: '14px 16px',
      backgroundColor: index % 2 === 0 ? colours.neutral[100] : colours.neutral[50],
      borderLeft: isInternal ? `2px solid ${colours.neutral[300]}` : '2px solid transparent',
      animation: 'fadeIn 300ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <Avatar name={comment.user_name} size="sm" />
        <span style={{ fontSize: '14px', fontWeight: 600, color: colours.neutral[900] }}>
          {comment.user_name}
        </span>
        <span style={{
          fontSize: '10px',
          color: colours.neutral[500],
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {roleLabels[comment.user_role] || comment.user_role}
        </span>
        <span style={{ fontSize: '12px', color: colours.neutral[500], marginLeft: 'auto' }}>
          {formatRelativeTime(comment.created_at)}
        </span>
        {isInternal && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: colours.neutral[500] }}>
            <Lock size={11} />
            Internal
          </span>
        )}
      </div>
      <div style={{
        fontSize: '14px',
        color: colours.neutral[900],
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        paddingLeft: '36px',
      }}>
        {renderMentions(comment.content)}
      </div>
    </div>
  )
}
