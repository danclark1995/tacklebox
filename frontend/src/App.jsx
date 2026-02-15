import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'
import useAuth from '@/hooks/useAuth'

// Client pages
import ClientDashboard from '@/pages/client/ClientDashboard'
import ClientTasks from '@/pages/client/ClientTasks'
import ClientTaskNew from '@/pages/client/ClientTaskNew'
import ClientTaskDetail from '@/pages/client/ClientTaskDetail'
import ClientBrandHub from '@/pages/client/ClientBrandHub'
import ClientProfile from '@/pages/client/ClientProfile'

// Camper (contractor) pages
import ContractorDashboard from '@/pages/contractor/ContractorDashboard'
import ContractorTasks from '@/pages/contractor/ContractorTasks'
import ContractorTaskDetail from '@/pages/contractor/ContractorTaskDetail'
import ContractorBrandGuides from '@/pages/contractor/ContractorBrandGuides'
import ContractorProfile from '@/pages/contractor/ContractorProfile'
import CamperJourney from '@/pages/contractor/CamperJourney'
import CamperEarnings from '@/pages/contractor/CamperEarnings'
import CalendarPage from '@/pages/shared/CalendarPage'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminTasksPage from '@/pages/admin/AdminTasksPage'
import AdminTaskDetail from '@/pages/admin/AdminTaskDetail'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminBrandProfiles from '@/pages/admin/AdminBrandProfiles'
import AdminBrandProfileEdit from '@/pages/admin/AdminBrandProfileEdit'
import AdminToolsPage from '@/pages/admin/AdminToolsPage'
import AdminSettings from '@/pages/admin/AdminSettings'
import AdminTaskNew from '@/pages/admin/AdminTaskNew'
import AdminJourney from '@/pages/admin/AdminJourney'
import BrandOnboarding from '@/components/features/BrandOnboarding'

// Create pages (used within AdminToolsPage)
import CreateSocial from '@/pages/create/CreateSocial'
import CreateDocument from '@/pages/create/CreateDocument'
import CreatePresentation from '@/pages/create/CreatePresentation'
import CreateAd from '@/pages/create/CreateAd'

// Shared pages
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SearchResults from '@/pages/SearchResults'
import ForbiddenPage from '@/pages/ForbiddenPage'

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case 'admin': return <Navigate to="/admin" replace />
    case 'client': return <Navigate to="/client" replace />
    case 'contractor': return <Navigate to="/camper" replace />
    default: return <Navigate to="/login" replace />
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

            {/* Root redirect based on role */}
            <Route path="/" element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route element={
              <ProtectedRoute roles={['admin']}>
                <LayoutWrapper />
              </ProtectedRoute>
            }>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/tasks" element={<AdminTasksPage />} />
              <Route path="/admin/tasks/new" element={<AdminTaskNew />} />
              <Route path="/admin/tasks/:id" element={<AdminTaskDetail />} />
              <Route path="/admin/campers" element={<AdminUsers />} />
              <Route path="/admin/brands" element={<AdminBrandProfiles />} />
              <Route path="/admin/brands/new" element={<BrandOnboarding />} />
              <Route path="/admin/brands/:clientId/edit" element={<AdminBrandProfileEdit />} />
              <Route path="/admin/journey" element={<AdminJourney />} />
              <Route path="/admin/tools" element={<AdminToolsPage />} />
              <Route path="/admin/tools/social" element={<CreateSocial />} />
              <Route path="/admin/tools/document" element={<CreateDocument />} />
              <Route path="/admin/tools/presentation" element={<CreatePresentation />} />
              <Route path="/admin/tools/ad" element={<CreateAd />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/calendar" element={<CalendarPage />} />
            </Route>

            {/* Client routes */}
            <Route element={
              <ProtectedRoute roles={['client']}>
                <LayoutWrapper />
              </ProtectedRoute>
            }>
              <Route path="/client" element={<ClientDashboard />} />
              <Route path="/client/tasks" element={<ClientTasks />} />
              <Route path="/client/tasks/new" element={<ClientTaskNew />} />
              <Route path="/client/tasks/:id" element={<ClientTaskDetail />} />
              <Route path="/client/brand-hub" element={<ClientBrandHub />} />
              <Route path="/client/profile" element={<ClientProfile />} />
            </Route>

            {/* Camper (contractor) routes */}
            <Route element={
              <ProtectedRoute roles={['contractor']}>
                <LayoutWrapper />
              </ProtectedRoute>
            }>
              <Route path="/camper" element={<ContractorDashboard />} />
              <Route path="/camper/tasks" element={<ContractorTasks />} />
              <Route path="/camper/tasks/:id" element={<ContractorTaskDetail />} />
              <Route path="/camper/brands" element={<ContractorBrandGuides />} />
              <Route path="/camper/journey" element={<CamperJourney />} />
              <Route path="/camper/earnings" element={<CamperEarnings />} />
              <Route path="/camper/calendar" element={<CalendarPage />} />
              <Route path="/camper/profile" element={<ContractorProfile />} />
            </Route>

            {/* Shared protected routes */}
            <Route element={
              <ProtectedRoute>
                <LayoutWrapper />
              </ProtectedRoute>
            }>
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
