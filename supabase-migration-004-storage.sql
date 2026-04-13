-- =============================================
-- LaVieEnPose — Migration 004: Storage Bucket
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- 1. Crear bucket de medios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Storage

-- Cualquiera puede ver archivos públicos
CREATE POLICY "Media pública para todos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Admin y editores pueden subir archivos
CREATE POLICY "Admin y editores pueden subir media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Admin y editores pueden actualizar archivos
CREATE POLICY "Admin y editores pueden actualizar media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Admin y editores pueden eliminar archivos
CREATE POLICY "Admin y editores pueden eliminar media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 3. Añadir tipo de media a gallery_images (imagen o video)
ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));
