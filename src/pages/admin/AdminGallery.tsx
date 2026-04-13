import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Camera,
    ExternalLink,
    Film,
    Image,
    MapPin,
    Plus,
    Save,
    Trash2,
    Upload,
    X,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { api } from '../../lib/rawgApi'
import type { GalleryImage, LookbookHotspot } from '../../types/rawg'

/* ── tiny helpers ── */
const isVideo = (f: File) => f.type.startsWith('video/')

export default function AdminGallery() {
  const qc = useQueryClient()
  const images = useQuery({
    queryKey: ['admin-gallery-hs'],
    queryFn: () => api.getGalleryImagesWithHotspots(),
  })

  /* ── Upload form state ── */
  const [showForm, setShowForm] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [collection, setCollection] = useState('')
  const [photographer, setPhotographer] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  /* ── Hotspot editor state ── */
  const [editing, setEditing] = useState<(GalleryImage & { hotspots: LookbookHotspot[] }) | null>(null)
  const [pendingHotspot, setPendingHotspot] = useState<{ x: number; y: number } | null>(null)
  const [hsLabel, setHsLabel] = useState('')
  const [hsBrand, setHsBrand] = useState('')
  const [hsPrice, setHsPrice] = useState('')
  const [hsLink, setHsLink] = useState('')

  /* ── Upload handler ── */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Subiendo ${i + 1}/${files.length}: ${file.name}`)
        const url = await api.uploadMedia(file)
        const mediaType = isVideo(file) ? 'video' : 'image'
        const tags = tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
        await api.createGalleryImage({
          url,
          caption: caption || null,
          collection: collection || null,
          photographer: photographer || null,
          tags,
          media_type: mediaType,
        } as never)
      }
      qc.invalidateQueries({ queryKey: ['admin-gallery-hs'] })
      setFiles([])
      setCaption('')
      setCollection('')
      setPhotographer('')
      setTagsRaw('')
      setShowForm(false)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  /* ── Delete image ── */
  const deleteMut = useMutation({
    mutationFn: async (img: GalleryImage) => {
      await api.deleteGalleryImage(img.id)
      await api.deleteMedia(img.url)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-gallery-hs'] }),
  })

  /* ── Hotspot: click on image ── */
  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editing) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setPendingHotspot({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 })
      setHsLabel('')
      setHsBrand('')
      setHsPrice('')
      setHsLink('')
    },
    [editing],
  )

  /* ── Create hotspot ── */
  const createHsMut = useMutation({
    mutationFn: async () => {
      if (!editing || !pendingHotspot) return
      await api.createHotspot({
        gallery_image_id: String(editing.id),
        label: hsLabel,
        brand: hsBrand || null,
        price: hsPrice || null,
        link: hsLink || null,
        pos_x: pendingHotspot.x,
        pos_y: pendingHotspot.y,
      })
    },
    onSuccess: async () => {
      setPendingHotspot(null)
      const updated = await api.getGalleryImageWithHotspots(String(editing!.id))
      setEditing(updated)
      qc.invalidateQueries({ queryKey: ['admin-gallery-hs'] })
    },
  })

  /* ── Delete hotspot ── */
  const deleteHsMut = useMutation({
    mutationFn: (id: string) => api.deleteHotspot(id),
    onSuccess: async () => {
      const updated = await api.getGalleryImageWithHotspots(String(editing!.id))
      setEditing(updated)
      qc.invalidateQueries({ queryKey: ['admin-gallery-hs'] })
    },
  })

  /* ── Preview thumbnails ── */
  const previews = files.map((f) => ({
    name: f.name,
    type: f.type,
    url: URL.createObjectURL(f),
    isVideo: isVideo(f),
  }))

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Galería & Lookbook</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Upload size={16} /> Subir media
        </button>
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            className="upload-form"
            onSubmit={handleUpload}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="upload-dropzone" onClick={() => fileRef.current?.click()}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length === 0 ? (
                <>
                  <Upload size={32} />
                  <p>Arrastra o haz clic para seleccionar imágenes y videos</p>
                  <small>JPG, PNG, WebP, GIF, MP4, WebM — máx. 50MB</small>
                </>
              ) : (
                <div className="upload-previews">
                  {previews.map((p) => (
                    <div key={p.name} className="upload-thumb">
                      {p.isVideo ? (
                        <video src={p.url} muted />
                      ) : (
                        <img src={p.url} alt={p.name} />
                      )}
                      <span>{p.isVideo ? <Film size={12} /> : <Image size={12} />} {p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="upload-fields">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Pie de foto / título del look"
              />
              <input
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="Colección (ej: SS26, AW25)"
              />
              <input
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
                placeholder="Fotógrafo"
              />
              <input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="Tags separados por coma (ej: streetwear, milán)"
              />
            </div>

            <div className="upload-actions">
              {uploadProgress && <span className="upload-progress">{uploadProgress}</span>}
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={uploading || files.length === 0}>
                {uploading ? 'Subiendo...' : `Subir ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Gallery grid */}
      <div className="gallery-admin-grid">
        {images.data?.map((img) => (
          <div key={img.id} className="gallery-admin-item">
            {img.media_type === 'video' ? (
              <video src={img.url} muted loop playsInline preload="metadata" />
            ) : (
              <img src={img.url} alt={img.caption ?? ''} />
            )}
            <div className="gallery-admin-meta">
              <div className="gallery-admin-info">
                <p>{img.caption ?? 'Sin título'}</p>
                <small>
                  {img.collection ?? '—'} · {img.hotspots?.length ?? 0} hotspots
                  {img.media_type === 'video' && <> · <Film size={12} /></>}
                </small>
              </div>
              <div className="action-btns">
                <button
                  className="action-btn"
                  title="Editar hotspots"
                  onClick={() => { setEditing(img); setPendingHotspot(null) }}
                >
                  <MapPin size={14} />
                </button>
                <button
                  className="action-btn danger"
                  title="Eliminar"
                  onClick={() => {
                    if (confirm('¿Eliminar esta imagen y todos sus hotspots?')) deleteMut.mutate(img)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {images.isLoading && <p className="loading-text">Cargando galería...</p>}

      {/* ════════ Hotspot Editor Modal ════════ */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="hs-editor-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="hs-editor"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="hs-editor-header">
                <h2><MapPin size={18} /> Editor de hotspots</h2>
                <p className="muted-text">Haz clic en la imagen para colocar un hotspot</p>
                <button className="lb-close" onClick={() => setEditing(null)}><X size={18} /></button>
              </div>

              <div className="hs-editor-body">
                {/* Image with hotspots */}
                <div className="hs-image-area" onClick={handleImageClick}>
                  {editing.media_type === 'video' ? (
                    <video src={editing.url} controls muted />
                  ) : (
                    <img src={editing.url} alt={editing.caption ?? ''} />
                  )}

                  {/* Existing hotspots */}
                  {editing.hotspots?.map((hs) => (
                    <div
                      key={hs.id}
                      className="hs-dot-editor"
                      style={{ left: `${hs.pos_x}%`, top: `${hs.pos_y}%` }}
                      title={`${hs.label} — ${hs.brand ?? ''}`}
                    >
                      <span className="hs-dot-num">{editing.hotspots!.indexOf(hs) + 1}</span>
                    </div>
                  ))}

                  {/* Pending hotspot */}
                  {pendingHotspot && (
                    <div
                      className="hs-dot-editor hs-dot-pending"
                      style={{ left: `${pendingHotspot.x}%`, top: `${pendingHotspot.y}%` }}
                    >
                      <Plus size={14} />
                    </div>
                  )}
                </div>

                {/* Side panel */}
                <div className="hs-sidebar">
                  <h3>Hotspots actuales</h3>
                  {editing.hotspots?.length === 0 && (
                    <p className="muted-text">No hay hotspots. Haz clic en la imagen para añadir uno.</p>
                  )}
                  <div className="hs-list">
                    {editing.hotspots?.map((hs, i) => (
                      <div key={hs.id} className="hs-list-item">
                        <span className="hs-list-num">{i + 1}</span>
                        <div className="hs-list-info">
                          <strong>{hs.label}</strong>
                          <small>{hs.brand} {hs.price && `· ${hs.price}`}</small>
                          {hs.link && (
                            <a href={hs.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink size={11} /> Link
                            </a>
                          )}
                        </div>
                        <button
                          className="action-btn danger"
                          onClick={() => deleteHsMut.mutate(hs.id)}
                          disabled={deleteHsMut.isPending}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add hotspot form */}
                  <AnimatePresence>
                    {pendingHotspot && (
                      <motion.div
                        className="hs-add-form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        <h4>
                          <Camera size={14} /> Nuevo hotspot
                          <small>({pendingHotspot.x}%, {pendingHotspot.y}%)</small>
                        </h4>
                        <input
                          value={hsLabel}
                          onChange={(e) => setHsLabel(e.target.value)}
                          placeholder="Nombre de la prenda *"
                          autoFocus
                        />
                        <input
                          value={hsBrand}
                          onChange={(e) => setHsBrand(e.target.value)}
                          placeholder="Marca"
                        />
                        <input
                          value={hsPrice}
                          onChange={(e) => setHsPrice(e.target.value)}
                          placeholder="Precio (ej: €89.95)"
                        />
                        <input
                          value={hsLink}
                          onChange={(e) => setHsLink(e.target.value)}
                          placeholder="Enlace al producto"
                          type="url"
                        />
                        <div className="hs-add-actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setPendingHotspot(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={!hsLabel.trim() || createHsMut.isPending}
                            onClick={() => createHsMut.mutate()}
                          >
                            <Save size={14} /> {createHsMut.isPending ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
