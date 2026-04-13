import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/rawgApi'
import { useAuthStore } from '../store/useFiltersStore'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const profile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.getProfile(user!.id),
    enabled: !!user,
  })

  const favorites = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => api.getFavorites(user!.id),
    enabled: !!user,
  })

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [newsletter, setNewsletter] = useState(false)

  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.full_name ?? '')
      setBio(profile.data.bio ?? '')
      setAvatarUrl(profile.data.avatar_url ?? '')
      setNewsletter(profile.data.newsletter ?? false)
    }
  }, [profile.data])

  const update = useMutation({
    mutationFn: () =>
      api.updateProfile(user!.id, { full_name: fullName, bio, avatar_url: avatarUrl, newsletter } as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', user?.id] })
      useAuthStore.getState().setProfile({ ...profile.data!, full_name: fullName, bio, avatar_url: avatarUrl, newsletter })
    },
  })

  if (!user) {
    navigate('/auth')
    return null
  }

  const favArticles = favorites.data?.filter((f) => f.article) ?? []
  const favImages = favorites.data?.filter((f) => f.image) ?? []

  return (
    <section className="page-section">
      <motion.h1
        className="page-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Mi perfil
      </motion.h1>

      <div className="profile-grid">
        <motion.div
          className="profile-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              update.mutate()
            }}
          >
            <label>
              <span>Nombre completo</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label>
              <span>URL de avatar</span>
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </label>
            <label>
              <span>Bio</span>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
              Recibir novedades por email
            </label>
            <button type="submit" className="btn-primary" disabled={update.isPending}>
              {update.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {update.isSuccess && <p className="success-text">Perfil actualizado.</p>}
          </form>
        </motion.div>

        <motion.div
          className="favorites-section"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2><Heart size={18} /> Mis favoritos</h2>

          {favArticles.length > 0 && (
            <>
              <h3>Artículos guardados</h3>
              <div className="fav-list">
                {favArticles.map((f) => (
                  <Link key={f.id} to={`/articles/${f.article!.slug}`} className="fav-item">
                    {f.article!.cover_image && <img src={f.article!.cover_image} alt="" />}
                    <div>
                      <strong>{f.article!.title}</strong>
                      <small>{f.article!.category?.name}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {favImages.length > 0 && (
            <>
              <h3>Imágenes guardadas</h3>
              <div className="fav-images-grid">
                {favImages.map((f) => (
                  <img key={f.id} src={f.image!.url} alt={f.image!.caption ?? ''} />
                ))}
              </div>
            </>
          )}

          {favArticles.length === 0 && favImages.length === 0 && (
            <p className="empty-text">Aún no tienes favoritos. Usa el <Heart size={14} /> en artículos y fotos para guardarlos aquí.</p>
          )}
        </motion.div>
      </div>
    </section>
  )
}
