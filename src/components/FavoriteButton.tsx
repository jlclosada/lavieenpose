import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { api } from '../lib/rawgApi'
import { useAuthStore } from '../store/useFiltersStore'

interface FavoriteButtonProps {
  articleId?: string
  imageId?: string
}

export default function FavoriteButton({ articleId, imageId }: FavoriteButtonProps) {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const favQuery = useQuery({
    queryKey: ['is-fav', user?.id, articleId, imageId],
    queryFn: () => api.isFavorite(user!.id, articleId, imageId),
    enabled: !!user,
  })

  const toggle = useMutation({
    mutationFn: () => {
      if (articleId) return api.toggleFavoriteArticle(user!.id, articleId)
      return api.toggleFavoriteImage(user!.id, imageId!)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-fav', user?.id, articleId, imageId] })
      qc.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  if (!user) return null

  const isFav = favQuery.data ?? false

  return (
    <button
      className={`fav-btn ${isFav ? 'fav-active' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle.mutate()
      }}
      title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      disabled={toggle.isPending}
    >
      <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
    </button>
  )
}
