export type UserRole = 'admin' | 'editor' | 'user'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  newsletter: boolean
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
}

export interface Article {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  category_id: number
  author_id: string
  published: boolean
  featured: boolean
  created_at: string
  updated_at: string
  category?: Category
  author?: Profile
}

export interface GalleryImage {
  id: number
  url: string
  caption: string | null
  collection: string | null
  description: string | null
  photographer: string | null
  tags: string[]
  media_type: 'image' | 'video'
  sort_order: number
  created_at: string
  hotspots?: LookbookHotspot[]
}

export interface LookbookHotspot {
  id: string
  gallery_image_id: string
  label: string
  brand: string | null
  price: string | null
  link: string | null
  pos_x: number
  pos_y: number
  created_at: string
}

export interface Comment {
  id: number
  article_id: number
  user_id: string
  content: string
  created_at: string
  profile?: Profile
}

export interface Favorite {
  id: string
  user_id: string
  article_id: string | null
  gallery_image_id: string | null
  created_at: string
}
