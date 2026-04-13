import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Shield, ShieldCheck, Trash2, User } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { api } from '../../lib/rawgApi'
import { useAuthStore } from '../../store/useFiltersStore'
import type { UserRole } from '../../types/rawg'

const roleIcons: Record<UserRole, React.ReactNode> = {
  admin: <ShieldCheck size={15} />,
  editor: <Shield size={15} />,
  user: <User size={15} />,
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  user: 'Usuario',
}

export default function AdminUsers() {
  const { role: myRole, user: me } = useAuthStore()
  const qc = useQueryClient()

  if (myRole !== 'admin') return <Navigate to="/admin" replace />

  const users = useQuery({ queryKey: ['admin-users'], queryFn: api.getAllProfiles })

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: (userId: string) => api.deleteUser(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <div className="admin-page">
      <h1>Gestión de usuarios</h1>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Newsletter</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className={u.id === me?.id ? 'row-self' : ''}>
                <td>{u.full_name ?? '—'}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>
                    {roleIcons[u.role]} {roleLabels[u.role]}
                  </span>
                </td>
                <td>{u.newsletter ? 'Sí' : 'No'}</td>
                <td>{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                <td>
                  {u.id !== me?.id ? (
                    <div className="action-btns">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          changeRole.mutate({ userId: u.id, role: e.target.value })
                        }
                        className="role-select"
                      >
                        <option value="user">Usuario</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="action-btn danger"
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${u.full_name ?? u.email}?`))
                            deleteUser.mutate(u.id)
                        }}
                        title="Eliminar usuario"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <span className="muted-text">Tú</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.isLoading && <p className="loading-text">Cargando...</p>}
      </div>
    </div>
  )
}
