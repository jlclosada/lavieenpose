import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/rawgApi'

export default function AdminArticles() {
  const qc = useQueryClient()
  const articles = useQuery({ queryKey: ['admin-articles'], queryFn: api.getAllArticles })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteArticle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-articles'] }),
  })

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Artículos</h1>
        <Link to="/admin/articles/new" className="btn-primary">
          <Plus size={16} /> Nuevo artículo
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Autor</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {articles.data?.map((a) => (
              <tr key={a.id}>
                <td className="td-title">{a.title}</td>
                <td>{a.category?.name ?? '—'}</td>
                <td>{a.author?.full_name ?? '—'}</td>
                <td>
                  <span className={`status-badge ${a.published ? 'published' : 'draft'}`}>
                    {a.published ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td>{new Date(a.created_at).toLocaleDateString('es-ES')}</td>
                <td>
                  <div className="action-btns">
                    <Link to={`/admin/articles/edit/${a.id}`} className="action-btn" title="Editar"><Edit size={15} /></Link>
                    <Link to={`/articles/${a.slug}`} className="action-btn" title="Ver" target="_blank"><Eye size={15} /></Link>
                    <button
                      className="action-btn danger"
                      onClick={() => {
                        if (confirm('¿Eliminar este artículo?')) deleteMut.mutate(a.id)
                      }}
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {articles.isLoading && <p className="loading-text">Cargando...</p>}
        {articles.data?.length === 0 && <p className="empty-text">No hay artículos aún.</p>}
      </div>
    </div>
  )
}
