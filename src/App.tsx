import { LogIn, LogOut, Menu, Settings, User, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from './lib/rawgApi'
import { useAuthStore } from './store/useFiltersStore'

function App() {
  const { user, role } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const canManage = role === 'admin' || role === 'editor'

  const handleSignOut = async () => {
    await api.signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="logo">LaVieEnPose</Link>

        <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={menuOpen ? 'nav-open' : ''}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Inicio</NavLink>
          <NavLink to="/articles" onClick={() => setMenuOpen(false)}>Articulos</NavLink>
          <NavLink to="/gallery" onClick={() => setMenuOpen(false)}>Lookbook</NavLink>
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>Sobre nosotros</NavLink>
        </nav>

        <div className="header-actions">
          {canManage && (
            <Link to="/admin" className="icon-btn" title="Panel de gestión"><Settings size={18} /></Link>
          )}
          {user ? (
            <>
              <Link to="/profile" className="icon-btn" title="Perfil"><User size={18} /></Link>
              <button className="icon-btn" onClick={handleSignOut} title="Cerrar sesion"><LogOut size={18} /></button>
            </>
          ) : (
            <Link to="/auth" className="icon-btn" title="Iniciar sesion"><LogIn size={18} /></Link>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>&copy; {new Date().getFullYear()} LaVieEnPose — Moda & Tendencias</p>
      </footer>
    </div>
  )
}

export default App
