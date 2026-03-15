import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-coffee text-cream px-4 py-3 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <span className="text-2xl">&#9749;</span>
            <h1 className="text-lg font-bold text-cream-dark m-0">Kiko Coffee</h1>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to={location.pathname === '/admin' ? '/' : '/admin'}
                className="text-xs bg-caramel text-white px-3 py-1.5 rounded-full no-underline font-medium hover:bg-latte transition-colors"
              >
                {location.pathname === '/admin' ? 'Mi Tarjeta' : 'Admin'}
              </Link>
            )}
            <button
              onClick={signOut}
              className="text-xs text-cream-dark/70 hover:text-cream-dark transition-colors bg-transparent border-none cursor-pointer"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-coffee-medium/50 text-xs">
        Programa de Lealtad &middot; Kiko Coffee
      </footer>
    </div>
  )
}
