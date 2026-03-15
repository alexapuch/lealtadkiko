import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 pulse-slow">&#9749;</div>
        <p className="text-coffee-medium text-lg">Cargando...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
