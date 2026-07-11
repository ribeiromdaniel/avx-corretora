import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
import { AprovacoesPage } from './pages/AprovacoesPage'
import { ClientePage } from './pages/ClientePage'
import { Dashboard } from './pages/Dashboard'
import { GerarPlanoPage } from './pages/GerarPlanoPage'
import { Login } from './pages/Login'
import { PlanoPage } from './pages/PlanoPage'

function RotaProtegida({ exigir }: { exigir?: 'diretor' | 'admin' }) {
  const { session, carregando, ehDiretor, ehAdmin } = useAuth()
  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-laranja border-t-transparent" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (exigir === 'diretor' && !ehDiretor) return <Navigate to="/" replace />
  if (exigir === 'admin' && !ehAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RotaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes/:id" element={<ClientePage />} />
              <Route path="/clientes/:id/gerar-plano" element={<GerarPlanoPage />} />
              <Route path="/planos/:id" element={<PlanoPage />} />
            </Route>
          </Route>
          <Route element={<RotaProtegida exigir="diretor" />}>
            <Route element={<Layout />}>
              <Route path="/aprovacoes" element={<AprovacoesPage />} />
            </Route>
          </Route>
          <Route element={<RotaProtegida exigir="admin" />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
