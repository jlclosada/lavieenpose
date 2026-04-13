import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/rawgApi'
import { useAuthStore } from '../store/useFiltersStore'

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [comment, setComment] = useState('')

  const article = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.getArticle(slug!),
    enabled: !!slug,
  })

  const comments = useQuery({
    queryKey: ['comments', article.data?.id],
    queryFn: () => api.getComments(article.data!.id),
    enabled: !!article.data?.id,
  })

  const addComment = useMutation({
    mutationFn: () => api.addComment(article.data!.id, comment),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['comments', article.data?.id] })
    },
  })

  if (article.isLoading) return <p className="loading-text">Cargando...</p>
  if (!article.data) return <p className="empty-text">Articulo no encontrado.</p>

  const a = article.data

  return (
    <motion.article
      className="article-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Link to="/articles" className="back-link"><ArrowLeft size={16} /> Articulos</Link>

      <header className="article-detail-header">
        {a.category && <span className="category-chip">{a.category.name}</span>}
        <h1>{a.title}</h1>
        <time>{new Date(a.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
      </header>

      {a.cover_image && <img className="article-cover" src={a.cover_image} alt={a.title} />}

      <div className="article-content" dangerouslySetInnerHTML={{ __html: a.content }} />

      <section className="comments-section">
        <h2>Comentarios ({comments.data?.length ?? 0})</h2>
        {user ? (
          <form
            className="comment-form"
            onSubmit={(e) => {
              e.preventDefault()
              if (comment.trim()) addComment.mutate()
            }}
          >
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={3}
            />
            <button type="submit" disabled={addComment.isPending || !comment.trim()}>
              <Send size={14} /> Enviar
            </button>
          </form>
        ) : (
          <p className="login-prompt">
            <Link to="/auth">Inicia sesion</Link> para dejar un comentario.
          </p>
        )}
        <div className="comments-list">
          {comments.data?.map((c) => (
            <div key={c.id} className="comment-item">
              <strong>{c.profile?.full_name ?? 'Anonimo'}</strong>
              <time>{new Date(c.created_at).toLocaleDateString('es-ES')}</time>
              <p>{c.content}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.article>
  )
}
