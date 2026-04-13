import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RichEditor from '../../components/RichEditor'
import { api } from '../../lib/rawgApi'
import { useAuthStore } from '../../store/useFiltersStore'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [published, setPublished] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)

  const categories = useQuery({ queryKey: ['categories'], queryFn: api.getCategories })

  const existing = useQuery({
    queryKey: ['admin-article', id],
    queryFn: () => api.getAllArticles().then((all) => all.find((a) => String(a.id) === id)),
    enabled: !isNew,
  })

  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title)
      setSlug(existing.data.slug)
      setExcerpt(existing.data.excerpt ?? '')
      setContent(existing.data.content ?? '')
      setCoverImage(existing.data.cover_image ?? '')
      setCategoryId(existing.data.category_id ? String(existing.data.category_id) : '')
      setPublished(existing.data.published)
      setFeatured(existing.data.featured ?? false)
      setAutoSlug(false)
    }
  }, [existing.data])

  useEffect(() => {
    if (autoSlug && title) setSlug(slugify(title))
  }, [title, autoSlug])

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        cover_image: coverImage,
        category_id: categoryId || null,
        published,
        featured,
        author_id: user?.id,
      }

      if (isNew) {
        return api.createArticle(payload as never)
      }
      return api.updateArticle(Number(id), payload as never)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      navigate('/admin/articles')
    },
  })

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <Link to="/admin/articles" className="back-link">
          <ArrowLeft size={16} /> Artículos
        </Link>
        <h1>{isNew ? 'Nuevo artículo' : 'Editar artículo'}</h1>
      </div>

      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <div className="editor-main">
          <label>
            <span>Título</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Título del artículo"
            />
          </label>

          <label>
            <span>Slug</span>
            <div className="slug-row">
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setAutoSlug(false)
                }}
                required
              />
              <button type="button" className="btn-small" onClick={() => { setAutoSlug(true); setSlug(slugify(title)) }}>
                Auto
              </button>
            </div>
          </label>

          <label>
            <span>Extracto</span>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="Breve descripción del artículo..."
            />
          </label>

          <div className="editor-field">
            <span>Contenido</span>
            <RichEditor content={content} onChange={setContent} />
          </div>
        </div>

        <div className="editor-sidebar">
          <div className="sidebar-card">
            <h3>Publicación</h3>
            <label className="checkbox-label">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Publicado
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Destacado
            </label>
            <button type="submit" className="btn-primary full-width" disabled={save.isPending}>
              <Save size={16} /> {save.isPending ? 'Guardando...' : 'Guardar'}
            </button>
            {save.isError && <p className="auth-error">Error al guardar.</p>}
          </div>

          <div className="sidebar-card">
            <h3>Categoría</h3>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sidebar-card">
            <h3>Imagen de portada</h3>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
            />
            {coverImage && <img src={coverImage} alt="Preview" className="cover-preview" />}
          </div>
        </div>
      </form>
    </div>
  )
}
