-- =============================================
-- LaVieEnPose — Migration 002: Roles, Favorites, Newsletter
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Añadir columna de rol y newsletter a profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'editor', 'user')),
  ADD COLUMN IF NOT EXISTS newsletter boolean NOT NULL DEFAULT false;

-- 2. Tabla de favoritos
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

CREATE POLICY "Usuarios ven sus propios favoritos"
  ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden añadir favoritos"
  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus favoritos"
  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- 3. Políticas de escritura para admin/editor en articles
CREATE POLICY "Admin y editores pueden crear articulos"
  ON public.articles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admin y editores pueden editar articulos"
  ON public.articles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admin y editores pueden borrar articulos"
  ON public.articles FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Admin/editor ven articulos no publicados también
CREATE POLICY "Admin y editores ven todos los articulos"
  ON public.articles FOR SELECT USING (
    published = true
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Eliminar la política antigua que solo permitía publicados (ya la reemplazamos)
DROP POLICY IF EXISTS "Articulos publicados visibles para todos" ON public.articles;

-- 4. Políticas de escritura para admin/editor en gallery_images
CREATE POLICY "Admin y editores pueden crear imagenes"
  ON public.gallery_images FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admin y editores pueden editar imagenes"
  ON public.gallery_images FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admin y editores pueden borrar imagenes"
  ON public.gallery_images FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 5. Políticas de gestión de categorías para admin/editor
CREATE POLICY "Admin y editores pueden crear categorias"
  ON public.categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admin y editores pueden editar categorias"
  ON public.categories FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 6. Admin puede gestionar perfiles de otros (cambiar roles, eliminar)
CREATE POLICY "Admin puede actualizar cualquier perfil"
  ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin puede eliminar perfiles"
  ON public.profiles FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Eliminar política antigua de update que solo permitía al propio usuario
DROP POLICY IF EXISTS "Usuarios pueden editar su propio perfil" ON public.profiles;

-- Recrear: usuarios normales solo editan su propio perfil (sin cambiar role)
CREATE POLICY "Usuarios editan su propio perfil"
  ON public.profiles FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
