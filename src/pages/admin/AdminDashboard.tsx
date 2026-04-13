import { useQuery } from '@tanstack/react-query'
import { FileText, Image, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/rawgApi'
import { useAuthStore } from '../../store/useFiltersStore'

export default function AdminDashboard() {
  const { role } = useAuthStore()
  const articles = useQuery({ queryKey: ['admin-articles'], queryFn: api.getAllArticles })
  const gallery = useQuery({ queryKey: ['admin-gallery'], queryFn: () => api.getGalleryImages() })
  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: api.getAllProfiles,
    enabled: role === 'admin',
  })

  const stats = [
    {
      label: 'Artículos',
      value: articles.data?.length ?? '—',
      icon: <FileText size={20} />,
      to: '/admin/articles',
    },
    {
      label: 'Imágenes',
      value: gallery.data?.length ?? '—',
      icon: <Image size={20} />,
      to: '/admin/gallery',
    },
  ]

  if (role === 'admin') {
    stats.push({
      label: 'Usuarios',
      value: users.data?.length ?? '—',
      icon: <Users size={20} />,
      to: '/admin/users',
    })
  }

  const published = articles.data?.filter((a) => a.published).length ?? 0
  const drafts = articles.data?.filter((a) => !a.published).length ?? 0

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="admin-section">
        <h2>Resumen de artículos</h2>
        <div className="admin-summary-row">
          <span>{published} publicados</span>
          <span>{drafts} borradores</span>
        </div>
      </div>

      <div className="admin-section">
        <h2>Últimos artículos</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {articles.data?.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/admin/articles/edit/${a.id}`}>{a.title}</Link>
                  </td>
                  <td>{a.category?.name ?? '—'}</td>
                  <td>
                    <span className={`status-badge ${a.published ? 'published' : 'draft'}`}>
                      {a.published ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td>{new Date(a.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
