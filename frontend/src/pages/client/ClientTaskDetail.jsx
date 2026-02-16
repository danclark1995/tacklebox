import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import Spinner from '@/components/ui/Spinner'
import TaskDetail from '@/components/features/tasks/TaskDetail'
import { getTask } from '@/services/tasks'
import { listComments, createComment } from '@/services/comments'
import { listAttachments } from '@/services/attachments'
import { spacing, colours, typography } from '@/config/tokens'

export default function ClientTaskDetail() {
  const { id } = useParams()
  const { addToast } = useToast()
  const [task, setTask] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [taskData, commentsData, attachmentsData] = await Promise.all([
          getTask(id).catch(() => null),
          listComments(id).catch(() => null),
          listAttachments(id).catch(() => null),
        ])
        if (taskData) setTask(taskData)
        if (commentsData) setComments(commentsData)
        if (attachmentsData) setAttachments(attachmentsData)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, addToast])

  const handleAddComment = async (commentData) => {
    try {
      const newComment = await createComment({
        task_id: id,
        text: commentData.content,
        visibility: 'all'
      })
      setComments([...comments, newComment])
      addToast('Comment added', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div style={{ textAlign: 'center', padding: spacing[8] }}>
        <p style={{ color: colours.neutral[600] }}>Task not found</p>
      </div>
    )
  }

  const backLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[2],
    color: colours.neutral[900],
    textDecoration: 'none',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[4],
  }

  return (
    <div>
      <Link to="/client/tasks" style={backLinkStyle}>
        ← Back to Tasks
      </Link>
      <TaskDetail
        task={task}
        comments={comments}
        attachments={attachments}
        onComment={handleAddComment}
        loading={false}
      />
    </div>
  )
}
