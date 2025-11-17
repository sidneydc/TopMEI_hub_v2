import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Login } from '@/pages/auth/Login'
import { SignUp } from '@/pages/auth/SignUp'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import { ClienteDashboard } from '@/pages/cliente/ClienteDashboard'
import { ContadorDashboard } from '@/pages/contador/ContadorDashboard'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { EmpresaPage } from '@/pages/cliente/EmpresaPage'
import { AbrirMEI } from '@/pages/cliente/AbrirMEI'
import { DocumentosPage } from '@/pages/cliente/DocumentosPage'
import { ContadorDocumentosPage } from '@/pages/contador/ContadorDocumentosPage'
import { ServicosExecutarPage } from '@/pages/contador/ServicosExecutarPage'
import { NotificacoesPage } from '@/pages/cliente/NotificacoesPage'
import { ContratarServicosPage } from '@/pages/cliente/ContratarServicosPage'
import { NFSePage } from '@/pages/cliente/NFSePage'
import { UsuariosPage } from '@/pages/admin/UsuariosPage'
import { PlanosPage } from '@/pages/admin/PlanosPage'
import { ServicosPage } from '@/pages/admin/ServicosPage'
import OrcamentoPage from '@/pages/admin/OrcamentoPage'

function DashboardRouter() {
  const { userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Route to appropriate dashboard based on user role
  if (userRole === 'cliente') {
    return <ClienteDashboard />
  } else if (userRole === 'contador') {
    return <ContadorDashboard />
  } else if (userRole === 'administrador') {
    return <AdminDashboard />
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Perfil não configurado</h1>
        <p className="text-gray-600">Entre em contato com o administrador do sistema.</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/empresa"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <EmpresaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/abrir-mei"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <AbrirMEI />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documentos"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <DocumentosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contratar-servicos"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <ContratarServicosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nfse"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <NFSePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contador/documentos"
            element={
              <ProtectedRoute allowedRoles={['contador', 'administrador']}>
                <ContadorDocumentosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contador/servicos"
            element={
              <ProtectedRoute allowedRoles={['contador', 'administrador']}>
                <ServicosExecutarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cobrancas"
            element={
              <ProtectedRoute>
                <div>Cobranças (Em desenvolvimento)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/nfse"
            element={
              <ProtectedRoute>
                <div>NFSe (Em desenvolvimento)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute>
                <NotificacoesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/empresas"
            element={
              <ProtectedRoute allowedRoles={['contador', 'administrador']}>
                <div>Empresas (Em desenvolvimento)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orcamentos"
            element={
              <ProtectedRoute allowedRoles={['contador']}>
                <div>Orçamentos (Em desenvolvimento)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/emissor-orcamento"
            element={
              <ProtectedRoute allowedRoles={['cliente']}>
                <OrcamentoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/planos"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <PlanosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/servicos"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <ServicosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/planos"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <div>Planos (Em desenvolvimento)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/auditoria"
            element={
              <ProtectedRoute allowedRoles={['administrador']}>
                <div>Auditoria (Em desenvolvimento)</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h1>
                  <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
                </div>
              </div>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
