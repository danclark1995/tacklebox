import { useState } from 'react'
import { Tabs, Button, Badge, StatusBadge, Avatar, Modal, Select, Textarea, FileUpload, EmptyState, TaskProgressTracker } from '@/components/ui'
import TaskHistory from './TaskHistory'
import TimeLogSection from '@/components/features/tasks/TimeLogSection'
import ReviewSection from '@/components/features/tasks/ReviewSection'
import AttachmentList from '@/components/features/tasks/AttachmentList'
import { TASK_STATUSES, PRIORITIES, COMMENT_VISIBILITY, UPLOAD_TYPES } from '@/config/constants'
import { formatDate, formatDateTime, formatFileSize } from '@/utils/formatters'
import { colours, spacing } from '@/config/tokens'
import useAuth from '@/hooks/useAuth'

/**
 * TaskDetail
 *
 * Full task detail view with tabbed interface.
 * Tabs: Overview | Attachments | Comments | History
 * Overview tab: all metadata, brand profile link, action buttons per role/status.
 * Action buttons vary by role/status.
 */
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
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentVisibility, setCommentVisibility] = useState(COMMENT_VISIBILITY.ALL)
  const [selectedContractor, setSelectedContractor] = useState('')

  if (!task) {
    return <EmptyState title="Task not found" description="The task you're looking for doesn't exist." />
  }

  const isContractor = hasRole('contractor')
  const isAdmin = hasRole('admin')
  const isClient = hasRole('client')
  const isAssignedContractor = isContractor && task.contractor_id === user?.id

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
      onComment({ content: commentText, visibility: commentVisibility })
      setCommentText('')
      setShowCommentForm(false)
    }
  }

  const renderActionButtons = () => {
    const buttons = []

    // Contractor + assigned: "Start Work" button
    if (isAssignedContractor && task.status === TASK_STATUSES.ASSIGNED) {
      buttons.push(
        <Button
          key="start-work"
          variant="primary"
          onClick={() => handleStatusChange(TASK_STATUSES.IN_PROGRESS)}
          disabled={loading}
        >
          Start Work
        </Button>
      )
    }

    // Contractor + in_progress: "Submit for Review" button
    if (isAssignedContractor && task.status === TASK_STATUSES.IN_PROGRESS) {
      const hasDeliverables = attachments.some(a => a.upload_type === UPLOAD_TYPES.DELIVERABLE)
      buttons.push(
        <Button
          key="submit-review"
          variant="primary"
          onClick={() => handleStatusChange(TASK_STATUSES.REVIEW)}
          disabled={loading || !hasDeliverables}
          title={!hasDeliverables ? 'Upload at least one deliverable first' : ''}
        >
          Submit for Review
        </Button>
      )
    }

    // Contractor + revision: "Resume Work" button
    if (isAssignedContractor && task.status === TASK_STATUSES.REVISION) {
      buttons.push(
        <Button
          key="resume-work"
          variant="primary"
          onClick={() => handleStatusChange(TASK_STATUSES.IN_PROGRESS)}
          disabled={loading}
        >
          Resume Work
        </Button>
      )
    }

    // Admin + submitted: "Assign" button
    if (isAdmin && task.status === TASK_STATUSES.SUBMITTED) {
      buttons.push(
        <Button
          key="assign"
          variant="primary"
          onClick={() => setShowAssignModal(true)}
          disabled={loading}
        >
          Assign Task
        </Button>
      )
    }

    // Admin + review: "Approve" / "Request Revision" buttons
    if (isAdmin && task.status === TASK_STATUSES.REVIEW) {
      buttons.push(
        <Button
          key="approve"
          variant="success"
          onClick={() => handleStatusChange(TASK_STATUSES.APPROVED)}
          disabled={loading}
        >
          Approve
        </Button>,
        <Button
          key="revision"
          variant="warning"
          onClick={() => {
            const feedback = prompt('Enter revision feedback:')
            if (feedback) {
              handleStatusChange(TASK_STATUSES.REVISION, feedback)
            }
          }}
          disabled={loading}
        >
          Request Revision
        </Button>
      )
    }

    // Admin + approved: "Close Task" button
    if (isAdmin && task.status === TASK_STATUSES.APPROVED) {
      buttons.push(
        <Button
          key="close"
          variant="primary"
          onClick={() => handleStatusChange(TASK_STATUSES.CLOSED)}
          disabled={loading}
        >
          Close Task
        </Button>
      )
    }

    return buttons
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attachments', label: `Attachments (${attachments.length})` },
    { id: 'comments', label: `Comments (${comments.length})` },
    { id: 'time-log', label: 'Time Log' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'history', label: 'History' },
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
            {/* Main content */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: spacing[3] }}>Description</h3>
              <p style={{ lineHeight: 1.6, color: colours.neutral[700], whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>

              {brandProfile && (isContractor || isAdmin) && (
                <div style={{ marginTop: spacing[6], padding: spacing[4], backgroundColor: colours.primary[50], borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: spacing[2] }}>Brand Profile</h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`/brand-profile/${task.client_id}`, '_blank')}
                  >
                    View {task.client_name}'s Brand Profile
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
              <InfoCard label="Project" value={task.project_name} />
              <InfoCard label="Client" value={task.client_name} />
              {task.contractor_name && <InfoCard label="Camper" value={task.contractor_name} />}
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

        {activeTab === 'comments' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4], marginBottom: spacing[6] }}>
              {comments.length === 0 ? (
                <EmptyState title="No comments" description="No comments have been added yet." />
              ) : (
                comments.map(comment => (
                  <CommentItem key={comment.id} comment={comment} />
                ))
              )}
            </div>

            {/* Add comment form */}
            {!showCommentForm ? (
              <Button variant="secondary" onClick={() => setShowCommentForm(true)}>
                Add Comment
              </Button>
            ) : (
              <div style={{ padding: spacing[4], backgroundColor: colours.neutral[50], borderRadius: '8px' }}>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={4}
                />
                {(isAdmin || isContractor) && (
                  <div style={{ marginTop: spacing[3] }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: spacing[2], display: 'block' }}>
                      Visibility
                    </label>
                    <Select
                      value={commentVisibility}
                      onChange={(e) => setCommentVisibility(e.target.value)}
                      options={[
                        { value: COMMENT_VISIBILITY.ALL, label: 'Visible to all' },
                        { value: COMMENT_VISIBILITY.INTERNAL, label: 'Internal only' },
                      ]}
                    />
                  </div>
                )}
                <div style={{ marginTop: spacing[3], display: 'flex', gap: spacing[2] }}>
                  <Button variant="primary" onClick={handleSubmitComment}>
                    Post Comment
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCommentForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
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
                // Contractor options would be passed as prop
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

function FileItem({ file }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing[3],
      backgroundColor: colours.neutral[50],
      borderRadius: '6px',
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: colours.neutral[900] }}>
          {file.file_name}
        </div>
        <div style={{ fontSize: '12px', color: colours.neutral[600], marginTop: spacing[1] }}>
          {formatFileSize(file.file_size)} • {formatDateTime(file.created_at)}
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={() => window.open(file.file_path, '_blank')}>
        Download
      </Button>
    </div>
  )
}

function CommentItem({ comment }) {
  return (
    <div style={{
      padding: spacing[4],
      backgroundColor: colours.white,
      border: `1px solid ${colours.neutral[200]}`,
      borderRadius: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
        <Avatar name={comment.user_name} size="sm" />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>{comment.user_name}</div>
          <div style={{ fontSize: '12px', color: colours.neutral[600] }}>{formatDateTime(comment.created_at)}</div>
        </div>
        {comment.visibility === COMMENT_VISIBILITY.INTERNAL && (
          <Badge variant="warning" size="sm">Internal</Badge>
        )}
      </div>
      <p style={{ lineHeight: 1.6, color: colours.neutral[700], whiteSpace: 'pre-wrap' }}>
        {comment.content}
      </p>
    </div>
  )
}
