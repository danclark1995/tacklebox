/**
 * Notifications Service — No-Op Stub (Phase 1)
 *
 * Phase 1: All notification methods are no-ops that log to console.
 * Phase 2: Swap to Resend for transactional email without touching UI or API logic.
 *
 * State changes emit events → this service decides what to do with them.
 */

/**
 * Send a notification (no-op in Phase 1)
 * @param {string} userId - Recipient user ID
 * @param {string} type - Notification type
 * @param {object} payload - Notification data
 */
export async function send(userId, type, payload = {}) {
  // Phase 1: No-op — log only
  console.log(`[Notifications] No-op: ${type} → user ${userId}`, payload)
  return { sent: false, reason: 'no-op' }
}

/**
 * Notify on task status change
 */
export async function onTaskStatusChange(task, fromStatus, toStatus) {
  console.log(`[Notifications] Task ${task.id}: ${fromStatus} → ${toStatus}`)
  return send(task.client_id, 'task_status_change', { taskId: task.id, fromStatus, toStatus })
}

/**
 * Notify on new comment
 */
export async function onNewComment(taskId, comment, recipientIds) {
  console.log(`[Notifications] New comment on task ${taskId}`)
  return Promise.all(recipientIds.map(id => send(id, 'new_comment', { taskId, commentId: comment.id })))
}

/**
 * Notify on task assignment
 */
export async function onTaskAssigned(task, contractorId) {
  console.log(`[Notifications] Task ${task.id} assigned to ${contractorId}`)
  return send(contractorId, 'task_assigned', { taskId: task.id })
}

/**
 * Notify on review request (task closed)
 */
export async function onReviewRequested(task) {
  console.log(`[Notifications] Review requested for task ${task.id}`)
  return send(task.contractor_id, 'review_requested', { taskId: task.id })
}

/**
 * Notify on deliverable uploaded
 */
export async function onDeliverableUploaded(task) {
  console.log(`[Notifications] Deliverable uploaded for task ${task.id}`)
  // Notify admin(s) — in Phase 2 this would look up admin users
  return send('admin', 'deliverable_uploaded', { taskId: task.id })
}

const notificationsService = {
  send,
  onTaskStatusChange,
  onNewComment,
  onTaskAssigned,
  onReviewRequested,
  onDeliverableUploaded,
}

export default notificationsService
