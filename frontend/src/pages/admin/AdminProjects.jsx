import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import ProjectList from '@/components/features/projects/ProjectList'
import ProjectForm from '@/components/features/projects/ProjectForm'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing } from '@/config/tokens'

export default function AdminProjects() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        fetch(apiEndpoint('/projects'), { headers: { ...getAuthHeaders() } }),
        fetch(apiEndpoint('/users?role=client'), { headers: { ...getAuthHeaders() } })
      ])

      const projectsJson = await projectsRes.json()
      const clientsJson = await clientsRes.json()

      if (projectsJson.success) setProjects(projectsJson.data)
      if (clientsJson.success) setClients(clientsJson.data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (projectData) => {
    setSubmitting(true)
    try {
      const res = await fetch(apiEndpoint('/projects'), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      })

      const json = await res.json()

      if (json.success) {
        addToast('Project created successfully', 'success')
        setShowModal(false)
        loadData()
      } else {
        addToast(json.message || 'Failed to create project', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        actions={
          <Button onClick={() => setShowModal(true)}>Create Project</Button>
        }
      />

      <ProjectList
        projects={projects}
        onProjectClick={(project) => navigate(`/projects/${project.id}`)}
      />

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Project"
        >
          <div style={{ padding: spacing[4] }}>
            <ProjectForm
              clients={clients}
              onSubmit={handleCreateProject}
              onCancel={() => setShowModal(false)}
              isSubmitting={submitting}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
