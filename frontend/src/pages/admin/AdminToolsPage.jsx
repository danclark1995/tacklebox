import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import SubNav from '@/components/ui/SubNav'
import MyCreations from '@/pages/create/MyCreations'
import AdminAnalytics from './AdminAnalytics'
import AdminGuidance from './AdminGuidance'
import ToolboxGrid from '@/components/features/ToolboxGrid'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import EmberLoader from '@/components/ui/EmberLoader'
import useToast from '@/hooks/useToast'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing, typography, colours } from '@/config/tokens'

const TABS = [
  { key: 'generations', label: 'Generations' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'guidance', label: 'Guidance' },
  { key: 'toolbox', label: 'Toolbox' },
]

const ICON_OPTIONS = [
  { value: 'pen-tool', label: 'Pen Tool' },
  { value: 'layout', label: 'Layout' },
  { value: 'figma', label: 'Figma' },
  { value: 'book-open', label: 'Book Open' },
  { value: 'hard-drive', label: 'Hard Drive' },
  { value: 'message-square', label: 'Message Square' },
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Image' },
  { value: 'palette', label: 'Palette' },
  { value: 'type', label: 'Type' },
  { value: 'link', label: 'Link' },
  { value: 'globe', label: 'Globe' },
  { value: 'code', label: 'Code' },
  { value: 'music', label: 'Music' },
  { value: 'camera', label: 'Camera' },
  { value: 'mic', label: 'Mic' },
]

export default function AdminToolsPage() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('generations')
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTool, setEditingTool] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formIcon, setFormIcon] = useState('link')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (activeTab === 'toolbox') {
      loadTools()
    }
  }, [activeTab])

  const loadTools = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiEndpoint('/tools'), { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success) setTools(json.data || [])
    } catch (err) {
      addToast('Failed to load tools', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingTool(null)
    setFormName('')
    setFormDescription('')
    setFormUrl('')
    setFormIcon('link')
    setShowModal(true)
  }

  const openEditModal = (tool) => {
    setEditingTool(tool)
    setFormName(tool.name)
    setFormDescription(tool.description || '')
    setFormUrl(tool.url)
    setFormIcon(tool.icon_name || 'link')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formUrl.trim()) {
      addToast('Name and URL are required', 'error')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        url: formUrl.trim(),
        icon_name: formIcon,
      }

      const isEdit = !!editingTool
      const url = isEdit ? apiEndpoint(`/tools/${editingTool.id}`) : apiEndpoint('/tools')
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (json.success) {
        addToast(isEdit ? 'Tool updated' : 'Tool added', 'success')
        setShowModal(false)
        loadTools()
      } else {
        addToast(json.error || 'Failed to save', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tool) => {
    if (confirmDelete !== tool.id) {
      setConfirmDelete(tool.id)
      return
    }
    try {
      const res = await fetch(apiEndpoint(`/tools/${tool.id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const json = await res.json()
      if (json.success) {
        setTools(prev => prev.filter(t => t.id !== tool.id))
        addToast('Tool removed', 'success')
      } else {
        addToast(json.error || 'Failed to delete', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div>
      <SubNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'generations' && <MyCreations />}
      {activeTab === 'analytics' && <AdminAnalytics />}
      {activeTab === 'guidance' && <AdminGuidance />}
      {activeTab === 'toolbox' && (
        <div style={{ padding: `${spacing[6]} 0` }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[5],
          }}>
            <h2 style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colours.neutral[900],
            }}>
              Toolbox
            </h2>
            <Button onClick={openAddModal}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} />
                Add Tool
              </span>
            </Button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
              <EmberLoader size="lg" />
            </div>
          ) : (
            <ToolboxGrid
              tools={tools}
              editable
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          )}

          {confirmDelete && (
            <div style={{
              position: 'fixed',
              bottom: spacing[6],
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: colours.neutral[100],
              border: '1px solid #333',
              borderRadius: '8px',
              padding: `${spacing[3]} ${spacing[5]}`,
              fontSize: typography.fontSize.sm,
              color: colours.neutral[900],
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
            }}>
              Remove this tool?
              <Button size="sm" variant="primary" onClick={() => {
                const tool = tools.find(t => t.id === confirmDelete)
                if (tool) handleDelete(tool)
              }}>
                Confirm
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingTool ? 'Edit Tool' : 'Add Tool'}
        >
          <div style={{ padding: spacing[4], display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <Input
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Tool name"
            />
            <Input
              label="Description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Short description"
            />
            <Input
              label="URL"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://..."
            />
            <Select
              label="Icon"
              value={formIcon}
              onChange={(e) => setFormIcon(e.target.value)}
              options={ICON_OPTIONS}
            />
            <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'flex-end', marginTop: spacing[2] }}>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
