-- =============================================
-- LaVieEnPose — Full schema (idempotent)
-- Safe to run multiple times
-- =============================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
  newsletter boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Articles
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image text,
  category_id uuid REFERENCES public.categories(id),
  author_id uuid REFERENCES public.profiles(id),
  published boolean DEFAULT false,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 4. Gallery images
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  caption text,
  collection text,
  sort_order int DEFAULT 0,
  description text,
  photographer text,
  tags text[] DEFAULT '{}',
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- 5. Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 6. Favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  gallery_image_id uuid REFERENCES public.gallery_images(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, article_id),
  UNIQUE(user_id, gallery_image_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 7. Lookbook hotspots
CREATE TABLE IF NOT EXISTS public.lookbook_hotspots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_image_id uuid REFERENCES public.gallery_images(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  brand text,
  price text,
  link text,
  pos_x numeric NOT NULL DEFAULT 50,
  pos_y numeric NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lookbook_hotspots ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES (idempotent with DO $$ blocks) ==========

DO $$ BEGIN
  -- Profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Perfiles visibles para todos' AND tablename = 'profiles') THEN
    CREATE POLICY "Perfiles visibles para todos" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios editan su propio perfil' AND tablename = 'profiles') THEN
    CREATE POLICY "Usuarios editan su propio perfil" ON public.profiles FOR UPDATE USING (
      auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin puede actualizar cualquier perfil' AND tablename = 'profiles') THEN
    CREATE POLICY "Admin puede actualizar cualquier perfil" ON public.profiles FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin puede eliminar perfiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admin puede eliminar perfiles" ON public.profiles FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;

  -- Categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Categorias visibles para todos' AND tablename = 'categories') THEN
    CREATE POLICY "Categorias visibles para todos" ON public.categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden crear categorias' AND tablename = 'categories') THEN
    CREATE POLICY "Admin y editores pueden crear categorias" ON public.categories FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden editar categorias' AND tablename = 'categories') THEN
    CREATE POLICY "Admin y editores pueden editar categorias" ON public.categories FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;

  -- Articles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores ven todos los articulos' AND tablename = 'articles') THEN
    DROP POLICY IF EXISTS "Articulos publicados visibles para todos" ON public.articles;
    CREATE POLICY "Admin y editores ven todos los articulos" ON public.articles FOR SELECT USING (
      published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden crear articulos' AND tablename = 'articles') THEN
    CREATE POLICY "Admin y editores pueden crear articulos" ON public.articles FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden editar articulos' AND tablename = 'articles') THEN
    CREATE POLICY "Admin y editores pueden editar articulos" ON public.articles FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden borrar articulos' AND tablename = 'articles') THEN
    CREATE POLICY "Admin y editores pueden borrar articulos" ON public.articles FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;

  -- Gallery images
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Galeria visible para todos' AND tablename = 'gallery_images') THEN
    CREATE POLICY "Galeria visible para todos" ON public.gallery_images FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden crear imagenes' AND tablename = 'gallery_images') THEN
    CREATE POLICY "Admin y editores pueden crear imagenes" ON public.gallery_images FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden editar imagenes' AND tablename = 'gallery_images') THEN
    CREATE POLICY "Admin y editores pueden editar imagenes" ON public.gallery_images FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden borrar imagenes' AND tablename = 'gallery_images') THEN
    CREATE POLICY "Admin y editores pueden borrar imagenes" ON public.gallery_images FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;

  -- Comments
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Comentarios visibles para todos' AND tablename = 'comments') THEN
    CREATE POLICY "Comentarios visibles para todos" ON public.comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios autenticados pueden comentar' AND tablename = 'comments') THEN
    CREATE POLICY "Usuarios autenticados pueden comentar" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Favorites
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios ven sus propios favoritos' AND tablename = 'favorites') THEN
    CREATE POLICY "Usuarios ven sus propios favoritos" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios pueden añadir favoritos' AND tablename = 'favorites') THEN
    CREATE POLICY "Usuarios pueden añadir favoritos" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios pueden eliminar sus favoritos' AND tablename = 'favorites') THEN
    CREATE POLICY "Usuarios pueden eliminar sus favoritos" ON public.favorites FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Lookbook hotspots
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Hotspots visibles para todos' AND tablename = 'lookbook_hotspots') THEN
    CREATE POLICY "Hotspots visibles para todos" ON public.lookbook_hotspots FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden crear hotspots' AND tablename = 'lookbook_hotspots') THEN
    CREATE POLICY "Admin y editores pueden crear hotspots" ON public.lookbook_hotspots FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden editar hotspots' AND tablename = 'lookbook_hotspots') THEN
    CREATE POLICY "Admin y editores pueden editar hotspots" ON public.lookbook_hotspots FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden borrar hotspots' AND tablename = 'lookbook_hotspots') THEN
    CREATE POLICY "Admin y editores pueden borrar hotspots" ON public.lookbook_hotspots FOR DELETE USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
END $$;

-- ========== STORAGE ==========
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm','video/quicktime']
) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Media pública para todos' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Media pública para todos" ON storage.objects FOR SELECT USING (bucket_id = 'media');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden subir media' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Admin y editores pueden subir media" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden actualizar media' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Admin y editores pueden actualizar media" ON storage.objects FOR UPDATE USING (
      bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden eliminar media' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Admin y editores pueden eliminar media" ON storage.objects FOR DELETE USING (
      bucket_id = 'media' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    );
  END IF;
END $$;

-- ========== SEED DATA ==========

-- Categories
INSERT INTO public.categories (name, slug) VALUES
  ('Tendencias', 'tendencias'),
  ('Streetwear', 'streetwear'),
  ('Alta Costura', 'alta-costura'),
  ('Accesorios', 'accesorios'),
  ('Sostenibilidad', 'sostenibilidad')
ON CONFLICT (slug) DO NOTHING;

-- Gallery images
INSERT INTO public.gallery_images (url, caption, collection, sort_order) VALUES
  ('https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800', 'Street style — Milán Fashion Week', 'SS26', 1),
  ('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', 'Minimalismo en blanco', 'SS26', 2),
  ('https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800', 'Haute couture — París', 'AW25', 3),
  ('https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800', 'Accesorios dorados', 'Accesorios', 4),
  ('https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800', 'Desfile de tendencias', 'SS26', 5),
  ('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800', 'Moda consciente', 'Sostenibilidad', 6),
  ('https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', 'Elegancia natural', 'AW25', 7),
  ('https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800', 'Runway SS26', 'SS26', 8)
ON CONFLICT DO NOTHING;

-- Sample articles
INSERT INTO public.articles (title, slug, excerpt, cover_image, category_id, published, featured, created_at)
SELECT
  'Las 10 tendencias que dominarán 2026',
  'tendencias-2026',
  'Desde el minimalismo japonés hasta el neo-barroco digital.',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
  id, true, true, now() - interval '2 days'
FROM public.categories WHERE slug = 'tendencias'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (title, slug, excerpt, cover_image, category_id, published, featured, created_at)
SELECT
  'Streetwear de lujo: la calle conquista la pasarela',
  'streetwear-lujo-pasarela',
  'Las colaboraciones entre marcas de lujo y diseñadores urbanos.',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
  id, true, true, now() - interval '1 day'
FROM public.categories WHERE slug = 'streetwear'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.articles (title, slug, excerpt, cover_image, category_id, published, featured, created_at)
SELECT
  'Moda sostenible: más allá del greenwashing',
  'moda-sostenible-greenwashing',
  'Materiales reciclados, producción ética y transparencia total.',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
  id, true, false, now() - interval '5 hours'
FROM public.categories WHERE slug = 'sostenibilidad'
ON CONFLICT (slug) DO NOTHING;
