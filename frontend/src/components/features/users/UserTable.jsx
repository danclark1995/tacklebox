import { DataTable, Avatar, Badge, Button } from '@/components/ui'
import { ROLES, ROLE_LABELS } from '@/config/constants'
import { formatDateTime } from '@/utils/formatters'
import { colours } from '@/config/tokens'

/**
 * UserTable
 *
 * Admin user management table.
 * Uses DataTable. Columns: name (with avatar), email, role (badge), status (active/inactive),
 * created date, task count, actions (edit/deactivate buttons).
 */
export default function UserTable({ users = [], loading = false, onEdit, onDeactivate }) {
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'error'
      case ROLES.CONTRACTOR:
        return 'info'
      case ROLES.CLIENT:
        return 'success'
      default:
        return 'neutral'
    }
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            src={row.avatar_url}
            name={row.display_name}
            size="sm"
          />
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: 500,
              color: colours.neutral[900],
            }}>
              {row.display_name}
            </div>
            {row.company && (
              <div style={{
                fontSize: '12px',
                color: colours.neutral[600],
              }}>
                {row.company}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <span style={{ fontSize: '14px', color: colours.neutral[700] }}>
          {row.email}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <Badge variant={getRoleBadgeVariant(row.role)}>
          {ROLE_LABELS[row.role]}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (row) => (
        <span style={{ fontSize: '13px', color: colours.neutral[600] }}>
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'task_count',
      label: 'Tasks',
      render: (row) => (
        <span style={{
          fontSize: '14px',
          fontWeight: 500,
          color: colours.primary[600],
        }}>
          {row.task_count || 0}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit && onEdit(row)}
          >
            Edit
          </Button>
          {row.is_active ? (
            <Button
              variant="warning"
              size="sm"
              onClick={() => {
                if (window.confirm(`Are you sure you want to deactivate ${row.display_name}?`)) {
                  onDeactivate && onDeactivate(row.id)
                }
              }}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="success"
              size="sm"
              onClick={() => onDeactivate && onDeactivate(row.id, true)}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      emptyMessage="No users found"
    />
  )
}
