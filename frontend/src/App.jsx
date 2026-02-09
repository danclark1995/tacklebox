import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'
import useAuth from '@/hooks/useAuth'

import ClientDashboard from '@/pages/client/ClientDashboard'
import ClientTasks from '@/pages/client/ClientTasks'
import ClientTaskNew from '@/pages/client/ClientTaskNew'
import ClientTaskDetail from '@/pages/client/ClientTaskDetail'
import ClientProjects from '@/pages/client/ClientProjects'
import ClientProjectDetail from '@/pages/client/ClientProjectDetail'
import ClientBrandHub from '@/pages/client/ClientBrandHub'
import ClientProfile from '@/pages/client/ClientProfile'

import ContractorDashboard from '@/pages/contractor/ContractorDashboard'
import ContractorTasks from '@/pages/contractor/ContractorTasks'
import ContractorTaskDetail from '@/pages/contractor/ContractorTaskDetail'
import ContractorBrandGuides from '@/pages/contractor/ContractorBrandGuides'
import ContractorProfile from '@/pages/contractor/ContractorProfile'
import ContractorStats from '@/pages/contractor/ContractorStats'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminTasks from '@/pages/admin/AdminTasks'
import AdminTaskDetail from '@/pages/admin/AdminTaskDetail'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminProjects from '@/pages/admin/AdminProjects'
import AdminProjectDetail from '@/pages/admin/AdminProjectDetail'
import AdminCategories from '@/pages/admin/AdminCategories'
import AdminBrandProfiles from '@/pages/admin/AdminBrandProfiles'
import AdminBrandProfileEdit from '@/pages/admin/AdminBrandProfileEdit'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import AdminTemplates from '@/pages/admin/AdminTemplates'

import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SearchResults from '@/pages/SearchResults'
import ForbiddenPage from '@/pages/ForbiddenPage'

function DashboardRouter() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case 'client':
      return <ClientDashboard />
    case 'contractor':
      return <ContractorDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      return <Navigate to="/login" replace />
  }
}

function TasksRouter() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case 'client':
      return <ClientTasks />
    case 'contractor':
      return <ContractorTasks />
    case 'admin':
      return <AdminTasks />
    default:
      return <Navigate to="/login" replace />
  }
}

function TaskDetailRouter() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case 'client':
      return <ClientTaskDetail />
    case 'contractor':
      return <ContractorTaskDetail />
    case 'admin':
      return <AdminTaskDetail />
    default:
      return <Navigate to="/login" replace />
  }
}

function ProjectsRouter() {
  const { user } = useAuth()

  if (!user) return null

  if (user.role === 'client') return <ClientProjects />
  if (user.role === 'admin') return <AdminProjects />

  return <Navigate to="/" replace />
}

function ProjectDetailRouter() {
  const { user } = useAuth()

  if (!user) return null

  if (user.role === 'client') return <ClientProjectDetail />
  if (user.role === 'admin') return <AdminProjectDetail />

  return <Navigate to="/" replace />
}

function ProfileRouter() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.role) {
    case 'client':
      return <ClientProfile />
    case 'contractor':
      return <ContractorProfile />
    case 'admin':
      return <ClientProfile />
    default:
      return <Navigate to="/login" replace />
  }
}

function LayoutWrapper() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute><LayoutWrapper /></ProtectedRoute>}>
              <Route path="/" element={<DashboardRouter />} />

              <Route path="/tasks" element={<TasksRouter />} />
              <Route path="/tasks/new" element={
                <ProtectedRoute roles={['client', 'admin']}>
                  <ClientTaskNew />
                </ProtectedRoute>
              } />
              <Route path="/tasks/:id" element={<TaskDetailRouter />} />

              <Route path="/projects" element={
                <ProtectedRoute roles={['client', 'admin']}>
                  <ProjectsRouter />
                </ProtectedRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute roles={['client', 'admin']}>
                  <ProjectDetailRouter />
                </ProtectedRoute>
              } />

              <Route path="/brand-hub" element={
                <ProtectedRoute roles={['client']}>
                  <ClientBrandHub />
                </ProtectedRoute>
              } />
              <Route path="/brand-guides" element={
                <ProtectedRoute roles={['contractor']}>
                  <ContractorBrandGuides />
                </ProtectedRoute>
              } />
              <Route path="/brand-profiles" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminBrandProfiles />
                </ProtectedRoute>
              } />
              <Route path="/brand-profiles/:clientId/edit" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminBrandProfileEdit />
                </ProtectedRoute>
              } />

              <Route path="/users" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/categories" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminCategories />
                </ProtectedRoute>
              } />
              <Route path="/templates" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminTemplates />
                </ProtectedRoute>
              } />

              <Route path="/profile" element={<ProfileRouter />} />

              <Route path="/stats" element={
                <ProtectedRoute roles={['contractor']}>
                  <ContractorStats />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } />

              <Route path="/search" element={<SearchResults />} />
            </Route>

            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
