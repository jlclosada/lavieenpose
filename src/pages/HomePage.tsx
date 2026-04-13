import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Camera, Sparkles, TrendingUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FavoriteButton from '../components/FavoriteButton'
import { api } from '../lib/rawgApi'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function HomePage() {
  const featured = useQuery({ queryKey: ['featured'], queryFn: api.getFeaturedArticles })
  const gallery = useQuery({ queryKey: ['gallery-home'], queryFn: () => api.getGalleryImages() })
  const categories = useQuery({ queryKey: ['categories'], queryFn: api.getCategories })
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const [hoveredArticle, setHoveredArticle] = useState<string | null>(null)

  return (
    <>
      {/* Hero */}
      <section className="hero-home" ref={heroRef}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <motion.p
            className="hero-kicker"
            initial={{ opacity: 0, y: 20, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.35em' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            LaVieEnPose — Moda & Tendencias
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            Donde la elegancia encuentra su voz
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            Artículos curados, lookbooks exclusivos y las tendencias que definen cada temporada.
          </motion.p>
          <motion.div
            className="hero-ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link to="/articles" className="btn-primary">
              Explorar artículos <ArrowRight size={16} />
            </Link>
            <Link to="/gallery" className="btn-secondary">
              Lookbook <Camera size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Categories Marquee */}
      {categories.data && categories.data.length > 0 && (
        <motion.div
          className="categories-marquee"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="marquee-track">
            {[...categories.data, ...categories.data].map((cat, i) => (
              <Link key={`${cat.id}-${i}`} to={`/articles`} className="marquee-item">
                {cat.name}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Featured Articles */}
      <section className="section-card">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2><Sparkles size={18} /> Últimos artículos</h2>
          <Link to="/articles" className="see-all">Ver todos <ArrowRight size={14} /></Link>
        </motion.div>

        <motion.div
          className="articles-grid-home"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
        >
          {featured.data?.map((article) => (
            <motion.article
              key={article.id}
              className="article-card"
              variants={fadeUp}
              onMouseEnter={() => setHoveredArticle(String(article.id))}
              onMouseLeave={() => setHoveredArticle(null)}
            >
              <FavoriteButton articleId={String(article.id)} />
              <Link to={`/articles/${article.slug}`}>
                <div className="article-card-img-wrap">
                  <motion.img
                    src={article.cover_image}
                    alt={article.title}
                    loading="lazy"
                    animate={{ scale: hoveredArticle === String(article.id) ? 1.06 : 1 }}
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
          {featured.isLoading && (
            <div className="lookbook-loading"><div className="spinner" /><p>Cargando...</p></div>
          )}
          <AnimatePresence>
            {featured.data?.length === 0 && (
              <motion.p className="empty-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Aún no hay artículos publicados.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Gallery Strip */}
      <section className="section-card">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2><TrendingUp size={18} /> Tendencias visuales</h2>
          <Link to="/gallery" className="see-all">Galería completa <ArrowRight size={14} /></Link>
        </motion.div>
        <motion.div
          className="gallery-strip"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {gallery.data?.slice(0, 6).map((img, i) => (
            <motion.div
              key={img.id}
              className="gallery-strip-item"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: -6 }}
            >
              <img src={img.url} alt={img.caption ?? ''} loading="lazy" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Banner */}
      <motion.section
        className="cta-banner"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2>Descubre el lenguaje visual de la moda</h2>
        <p>Únete a nuestra comunidad y sé el primero en descubrir tendencias, looks exclusivos y artículos de expertos.</p>
        <Link to="/auth" className="btn-primary">Crear cuenta gratis <ArrowRight size={16} /></Link>
      </motion.section>
    </>
  )
}
