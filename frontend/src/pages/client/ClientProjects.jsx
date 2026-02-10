import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import PageHeader from '@/components/ui/PageHeader'
import EmberLoader from '@/components/ui/EmberLoader'
import ProjectList from '@/components/features/projects/ProjectList'
import { apiEndpoint } from '@/config/env'
import { getAuthHeaders } from '@/services/auth'
import { spacing } from '@/config/tokens'

export default function ClientProjects() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(apiEndpoint('/projects'), { headers: { ...getAuthHeaders() } })
        const json = await res.json()
        if (json.success) setProjects(json.data)
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addToast])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <EmberLoader size="lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Projects" />
      <ProjectList
        projects={projects}
        onProjectClick={(project) => navigate(`/projects/${project.id}`)}
      />
    </div>
  )
}
