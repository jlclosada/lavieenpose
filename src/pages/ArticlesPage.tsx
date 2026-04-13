import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import FavoriteButton from '../components/FavoriteButton'
import { api } from '../lib/rawgApi'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function ArticlesPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categories = useQuery({ queryKey: ['categories'], queryFn: api.getCategories })
  const articles = useQuery({
    queryKey: ['articles', activeCategory],
    queryFn: () => api.getArticles(activeCategory ?? undefined),
  })
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <section className="page-section">
      <motion.div
        className="page-hero-compact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="page-title">Artículos</h1>
        <p className="page-subtitle">Moda, tendencias y análisis de la industria</p>
      </motion.div>

      <motion.div
        className="category-filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <button
          className={`chip ${!activeCategory ? 'chip-active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          Todos
        </button>
        {categories.data?.map((cat) => (
          <button
            key={cat.id}
            className={`chip ${activeCategory === cat.slug ? 'chip-active' : ''}`}
            onClick={() => setActiveCategory(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </motion.div>

      <motion.div
        className="articles-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
        key={activeCategory ?? 'all'}
      >
        {articles.data?.map((article) => (
          <motion.article
            key={article.id}
            className="article-card"
            variants={fadeUp}
            onMouseEnter={() => setHovered(String(article.id))}
            onMouseLeave={() => setHovered(null)}
          >
            <FavoriteButton articleId={String(article.id)} />
            <Link to={`/articles/${article.slug}`}>
              <div className="article-card-img-wrap">
                <motion.img
                  src={article.cover_image}
                  alt={article.title}
                  loading="lazy"
                  animate={{ scale: hovered === String(article.id) ? 1.06 : 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="article-card-body">
                {article.category && <span className="category-chip">{article.category.name}</span>}
                <h3>{article.title}</h3>
                <p>{article.excerpt}</p>
                <time>{new Date(article.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              </div>
            </Link>
          </motion.article>
        ))}
        {articles.isLoading && (
          <div className="lookbook-loading"><div className="spinner" /><p>Cargando artículos...</p></div>
        )}
        {articles.isError && (
          <div className="error-banner">
            <p>Error al cargar artículos: {articles.error?.message ?? 'Conexión con Supabase fallida'}</p>
            <button className="btn-secondary" onClick={() => articles.refetch()}>Reintentar</button>
          </div>
        )}
        {articles.data?.length === 0 && !articles.isError && <p className="empty-text">No hay artículos en esta categoría.</p>}
      </motion.div>
    </section>
  )
}
