import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../lib/rawgApi'

export default function AdminGallery() {
  const qc = useQueryClient()
  const images = useQuery({ queryKey: ['admin-gallery'], queryFn: () => api.getGalleryImages() })

  const [showForm, setShowForm] = useState(false)
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [collection, setCollection] = useState('')

  const createMut = useMutation({
    mutationFn: () => api.createGalleryImage({ url, caption: caption || null, collection: collection || null } as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-gallery'] })
      setUrl('')
      setCaption('')
      setCollection('')
      setShowForm(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteGalleryImage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-gallery'] }),
  })

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Galería</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Añadir imagen
        </button>
      </div>

      {showForm && (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            createMut.mutate()
          }}
        >
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL de la imagen" required />
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Pie de foto (opcional)" />
          <input type="text" value={collection} onChange={(e) => setCollection(e.target.value)} placeholder="Colección (opcional)" />
          <button type="submit" className="btn-primary" disabled={createMut.isPending}>
            {createMut.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      <div className="gallery-admin-grid">
        {images.data?.map((img) => (
          <div key={img.id} className="gallery-admin-item">
            <img src={img.url} alt={img.caption ?? ''} />
            <div className="gallery-admin-meta">
              <p>{img.caption ?? 'Sin pie'}</p>
              <small>{img.collection ?? 'Sin colección'}</small>
              <button
                className="action-btn danger"
                onClick={() => {
                  if (confirm('¿Eliminar esta imagen?')) deleteMut.mutate(img.id)
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {images.isLoading && <p className="loading-text">Cargando...</p>}
    </div>
  )
}
