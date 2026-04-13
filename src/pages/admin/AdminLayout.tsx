import {
    FileText,
    Image,
    LayoutDashboard,
    LogOut,
    Users,
} from 'lucide-react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { api } from '../../lib/rawgApi'
import { useAuthStore } from '../../store/useFiltersStore'

export default function AdminLayout() {
  const { role, profile } = useAuthStore()

  if (role !== 'admin' && role !== 'editor') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>LaVieEnPose</span>
          <small>Panel de gestión</small>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/articles">
            <FileText size={18} /> Artículos
          </NavLink>
          <NavLink to="/admin/gallery">
            <Image size={18} /> Galería
          </NavLink>
          {role === 'admin' && (
            <NavLink to="/admin/users">
              <Users size={18} /> Usuarios
            </NavLink>
          )}
        </nav>

        <div className="admin-user">
          <p>{profile?.full_name ?? profile?.email}</p>
          <small className="role-badge">{role}</small>
          <button onClick={() => api.signOut()} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  )
}
