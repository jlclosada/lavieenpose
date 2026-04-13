import type { Article, Category, Comment, Favorite, GalleryImage, LookbookHotspot, Profile } from '../types/rawg'
import { supabase } from './supabase'

export const api = {
  // ── Articles (public) ──
  getArticles: async (categorySlug?: string) => {
    let query = supabase
      .from('articles')
      .select('*, category:categories(*), author:profiles(*)')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (categorySlug) {
      query = query.eq('category.slug', categorySlug)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Article[]
  },

  getArticle: async (slug: string) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, category:categories(*), author:profiles(*)')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return data as Article
  },

  getFeaturedArticles: async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, category:categories(*), author:profiles(*)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3)
    if (error) throw error
    return (data ?? []) as Article[]
  },

  // ── Categories ──
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    if (error) throw error
    return (data ?? []) as Category[]
  },

  createCategory: async (name: string, slug: string) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select()
      .single()
    if (error) throw error
    return data as Category
  },

  // ── Gallery (public) ──
  getGalleryImages: async (collection?: string) => {
    let query = supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false })

    if (collection) {
      query = query.eq('collection', collection)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as GalleryImage[]
  },

  getCollections: async () => {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('collection')
      .not('collection', 'is', null)
    if (error) throw error
    const unique = [...new Set((data ?? []).map((d: { collection: string }) => d.collection))]
    return unique as string[]
  },

  // ── Comments ──
  getComments: async (articleId: number) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profile:profiles(*)')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Comment[]
  },

  addComment: async (articleId: number, content: string) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ article_id: articleId, content })
      .select('*, profile:profiles(*)')
      .single()
    if (error) throw error
    return data as Comment
  },

  // ── Profile ──
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data as Profile
  },

  updateProfile: async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  // ── Favorites ──
  getFavorites: async (userId: string) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, article:articles(*, category:categories(*)), image:gallery_images(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as (Favorite & { article?: Article; image?: GalleryImage })[]
  },

  toggleFavoriteArticle: async (userId: string, articleId: string) => {
    const { data: exists } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle()

    if (exists) {
      await supabase.from('favorites').delete().eq('id', exists.id)
      return false
    }
    await supabase.from('favorites').insert({ user_id: userId, article_id: articleId })
    return true
  },

  toggleFavoriteImage: async (userId: string, imageId: string) => {
    const { data: exists } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('gallery_image_id', imageId)
      .maybeSingle()

    if (exists) {
      await supabase.from('favorites').delete().eq('id', exists.id)
      return false
    }
    await supabase.from('favorites').insert({ user_id: userId, gallery_image_id: imageId })
    return true
  },

  isFavorite: async (userId: string, articleId?: string, imageId?: string) => {
    let query = supabase.from('favorites').select('id').eq('user_id', userId)
    if (articleId) query = query.eq('article_id', articleId)
    if (imageId) query = query.eq('gallery_image_id', imageId)
    const { data } = await query.maybeSingle()
    return !!data
  },

  // ── Admin: Articles CRUD ──
  getAllArticles: async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*, category:categories(*), author:profiles(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Article[]
  },

  createArticle: async (article: Partial<Article>) => {
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select('*, category:categories(*), author:profiles(*)')
      .single()
    if (error) throw error
    return data as Article
  },

  updateArticle: async (id: number, updates: Partial<Article>) => {
    const { data, error } = await supabase
      .from('articles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, category:categories(*), author:profiles(*)')
      .single()
    if (error) throw error
    return data as Article
  },

  deleteArticle: async (id: number) => {
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) throw error
  },

  // ── Admin: Gallery CRUD ──
  createGalleryImage: async (image: Partial<GalleryImage>) => {
    const { data, error } = await supabase
      .from('gallery_images')
      .insert(image)
      .select()
      .single()
    if (error) throw error
    return data as GalleryImage
  },

  updateGalleryImage: async (id: number, updates: Partial<GalleryImage>) => {
    const { data, error } = await supabase
      .from('gallery_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as GalleryImage
  },

  deleteGalleryImage: async (id: number) => {
    const { error } = await supabase.from('gallery_images').delete().eq('id', id)
    if (error) throw error
  },

  // ── Admin: Users ──
  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Profile[]
  },

  updateUserRole: async (userId: string, role: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  deleteUser: async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) throw error
  },

  // ── Auth helpers ──
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // ── Lookbook Hotspots ──
  getGalleryImageWithHotspots: async (imageId: string) => {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*, hotspots:lookbook_hotspots(*)')
      .eq('id', imageId)
      .single()
    if (error) throw error
    return data as GalleryImage & { hotspots: LookbookHotspot[] }
  },

  getGalleryImagesWithHotspots: async (collection?: string) => {
    let query = supabase
      .from('gallery_images')
      .select('*, hotspots:lookbook_hotspots(*)')
      .order('sort_order', { ascending: true })
    if (collection) query = query.eq('collection', collection)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as (GalleryImage & { hotspots: LookbookHotspot[] })[]
  },

  createHotspot: async (hotspot: Partial<LookbookHotspot>) => {
    const { data, error } = await supabase
      .from('lookbook_hotspots')
      .insert(hotspot)
      .select()
      .single()
    if (error) throw error
    return data as LookbookHotspot
  },

  deleteHotspot: async (id: string) => {
    const { error } = await supabase.from('lookbook_hotspots').delete().eq('id', id)
    if (error) throw error
  },

  // ── Media Upload ──
  uploadMedia: async (file: File, folder = 'gallery') => {
    const ext = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('media').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw error
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName)
    return urlData.publicUrl
  },

  deleteMedia: async (url: string) => {
    const match = url.match(/\/media\/(.+)$/)
    if (!match) return
    const path = decodeURIComponent(match[1])
    await supabase.storage.from('media').remove([path])
  },

  updateHotspot: async (id: string, updates: Partial<LookbookHotspot>) => {
    const { data, error } = await supabase
      .from('lookbook_hotspots')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as LookbookHotspot
  },
}
