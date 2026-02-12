/**
 * Notification Service — Console Stubs
 *
 * All notification functions log to console only.
 * // TODO: Wire up email service (Resend/SendGrid) for production notifications
 */

export function notifyNewComment(task, comment, recipients) {
  console.log(
    `[NOTIFICATION] New comment on task '${task.title}' by ${comment.user_name || comment.user_id}. Recipients: ${recipients.map(r => r.email || r.id).join(', ')}`
  )
}

export function notifyTaskStatusChange(task, newStatus, recipients) {
  console.log(
    `[NOTIFICATION] Task '${task.title}' status changed to ${newStatus}. Recipients: ${recipients.map(r => r.email || r.id).join(', ')}`
  )
}

export function notifySupportMessage(message, adminEmails) {
  console.log(
    `[NOTIFICATION] New support message: '${message.subject}' from user ${message.user_id}. Admins: ${adminEmails.join(', ')}`
  )
}

// TODO: Send real email/push notification for @mentions when email service is configured
export function notifyMention(task, mentionedUser, commenter, commentContent) {
  console.log(
    `[NOTIFICATION] @mention: ${mentionedUser.display_name} was mentioned by ${commenter.display_name || commenter.id} on task '${task.title}'`
  )
}
