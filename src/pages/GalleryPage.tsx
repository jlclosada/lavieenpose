import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ChevronLeft, ChevronRight, ExternalLink, Eye, Filter, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import FavoriteButton from '../components/FavoriteButton'
import { api } from '../lib/rawgApi'
import type { GalleryImage, LookbookHotspot } from '../types/rawg'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function GalleryPage() {
  const [activeCollection, setActiveCollection] = useState<string | null>(null)
  const collections = useQuery({ queryKey: ['collections'], queryFn: api.getCollections })
  const images = useQuery({
    queryKey: ['gallery-hotspots', activeCollection],
    queryFn: () => api.getGalleryImagesWithHotspots(activeCollection ?? undefined),
  })

  const [selectedImage, setSelectedImage] = useState<(GalleryImage & { hotspots: LookbookHotspot[] }) | null>(null)
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null)
  const [showHotspots, setShowHotspots] = useState(true)

  const currentIndex = images.data?.findIndex((img) => img.id === selectedImage?.id) ?? -1

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (!images.data || currentIndex < 0) return
      const next = (currentIndex + dir + images.data.length) % images.data.length
      setSelectedImage(images.data[next])
      setActiveHotspot(null)
    },
    [images.data, currentIndex],
  )

  useEffect(() => {
    if (!selectedImage) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedImage(null); setActiveHotspot(null) }
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft') navigate(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedImage, navigate])

  return (
    <section className="page-section lookbook-page">
      {/* Hero */}
      <motion.div
        className="lookbook-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.p
          className="hero-kicker"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Colección curada
        </motion.p>
        <motion.h1
          className="lookbook-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Lookbook
        </motion.h1>
        <motion.p
          className="lookbook-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.6 }}
        >
          Explora cada look en detalle. Pulsa sobre las imágenes para descubrir
          las prendas y accesorios que componen cada outfit.
        </motion.p>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="lookbook-filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Filter size={15} className="filter-icon" />
        <button
          className={`chip ${!activeCollection ? 'chip-active' : ''}`}
          onClick={() => setActiveCollection(null)}
        >
          Todas
        </button>
        {collections.data?.map((c) => (
          <button
            key={c}
            className={`chip ${activeCollection === c ? 'chip-active' : ''}`}
            onClick={() => setActiveCollection(c)}
          >
            {c}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      <motion.div
        className="lookbook-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
        key={activeCollection ?? 'all'}
      >
        {images.data?.map((img) => (
          <motion.div
            key={img.id}
            className="lookbook-card"
            variants={fadeUp}
            layoutId={`look-${img.id}`}
            onClick={() => { setSelectedImage(img); setActiveHotspot(null) }}
          >
            <div className="lookbook-card-img">
              {img.media_type === 'video' ? (
                <video src={img.url} muted loop playsInline preload="metadata" />
              ) : (
                <img src={img.url} alt={img.caption ?? ''} loading="lazy" />
              )}
              <div className="lookbook-card-overlay">
                <Eye size={20} />
                <span>Ver look</span>
              </div>
              {img.hotspots && img.hotspots.length > 0 && (
                <span className="hotspot-count">{img.hotspots.length} prendas</span>
              )}
              <FavoriteButton imageId={String(img.id)} />
            </div>
            <div className="lookbook-card-info">
              <h3>{img.caption}</h3>
              <div className="lookbook-card-meta">
                {img.photographer && (
                  <span className="photographer"><Camera size={12} /> {img.photographer}</span>
                )}
                {img.collection && <span className="collection-tag">{img.collection}</span>}
              </div>
              {img.tags && img.tags.length > 0 && (
                <div className="lookbook-tags">
                  {img.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {images.isLoading && (
          <div className="lookbook-loading">
            <div className="spinner" />
            <p>Cargando lookbook...</p>
          </div>
        )}
        {images.data?.length === 0 && (
          <p className="empty-text">No hay imágenes en esta colección.</p>
        )}
      </motion.div>

      {/* Lightbox with Hotspots */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="lookbook-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="lightbox-backdrop" onClick={() => { setSelectedImage(null); setActiveHotspot(null) }} />

            <motion.div
              className="lightbox-content"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Navigation */}
              <button className="lb-nav lb-prev" onClick={() => navigate(-1)}><ChevronLeft size={24} /></button>
              <button className="lb-nav lb-next" onClick={() => navigate(1)}><ChevronRight size={24} /></button>
              <button className="lb-close" onClick={() => { setSelectedImage(null); setActiveHotspot(null) }}><X size={20} /></button>

              {/* Image with hotspots */}
              <div className="lb-image-wrap">
                {selectedImage.media_type === 'video' ? (
                  <video src={selectedImage.url} controls muted autoPlay loop />
                ) : (
                  <img src={selectedImage.url} alt={selectedImage.caption ?? ''} />
                )}

                {showHotspots && selectedImage.hotspots?.map((hs, i) => (
                  <motion.button
                    key={hs.id}
                    className={`hotspot-dot ${activeHotspot === hs.id ? 'hotspot-active' : ''}`}
                    style={{ left: `${hs.pos_x}%`, top: `${hs.pos_y}%` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveHotspot(activeHotspot === hs.id ? null : hs.id)
                    }}
                  >
                    <span className="hotspot-ping" />
                    <span className="hotspot-core" />
                  </motion.button>
                ))}

                {/* Hotspot tooltip */}
                <AnimatePresence>
                  {activeHotspot && (() => {
                    const hs = selectedImage.hotspots?.find((h) => h.id === activeHotspot)
                    if (!hs) return null
                    const flipX = hs.pos_x > 60
                    const flipY = hs.pos_y > 70
                    return (
                      <motion.div
                        className={`hotspot-tooltip ${flipX ? 'tooltip-left' : 'tooltip-right'} ${flipY ? 'tooltip-above' : 'tooltip-below'}`}
                        style={{
                          left: `${hs.pos_x}%`,
                          top: `${hs.pos_y}%`,
                        }}
                        initial={{ opacity: 0, scale: 0.85, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 8 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <strong>{hs.label}</strong>
                        {hs.brand && <span className="tooltip-brand">{hs.brand}</span>}
                        {hs.price && <span className="tooltip-price">{hs.price}</span>}
                        {hs.link && (
                          <a
                            href={hs.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tooltip-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver producto <ExternalLink size={12} />
                          </a>
                        )}
                      </motion.div>
                    )
                  })()}
                </AnimatePresence>
              </div>

              {/* Info panel */}
              <div className="lb-info">
                <div className="lb-info-top">
                  <h2>{selectedImage.caption}</h2>
                  {selectedImage.photographer && (
                    <p className="lb-photographer"><Camera size={14} /> {selectedImage.photographer}</p>
                  )}
                  {selectedImage.collection && (
                    <span className="collection-tag">{selectedImage.collection}</span>
                  )}
                </div>

                {selectedImage.hotspots && selectedImage.hotspots.length > 0 && (
                  <div className="lb-hotspots-list">
                    <div className="lb-hotspots-header">
                      <h3>Prendas en este look</h3>
                      <button
                        className="toggle-hotspots"
                        onClick={() => setShowHotspots(!showHotspots)}
                      >
                        {showHotspots ? 'Ocultar' : 'Mostrar'} puntos
                      </button>
                    </div>
                    {selectedImage.hotspots.map((hs) => (
                      <button
                        key={hs.id}
                        className={`lb-item-row ${activeHotspot === hs.id ? 'lb-item-active' : ''}`}
                        onClick={() => setActiveHotspot(activeHotspot === hs.id ? null : hs.id)}
                      >
                        <div className="lb-item-info">
                          <strong>{hs.label}</strong>
                          {hs.brand && <span>{hs.brand}</span>}
                        </div>
                        {hs.price && <span className="lb-item-price">{hs.price}</span>}
                        {hs.link && (
                          <a
                            href={hs.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="lb-item-link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="lb-counter">
                  {currentIndex + 1} / {images.data?.length ?? 0}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
