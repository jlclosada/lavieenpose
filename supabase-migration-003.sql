-- =============================================
-- LaVieEnPose — Migration 003: Lookbook Hotspots + User Setup
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- ============ MIGRATION 002 (si no se ejecutó antes) ============
-- 1. Roles & newsletter en profiles
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios ven sus propios favoritos' AND tablename = 'favorites') THEN
    CREATE POLICY "Usuarios ven sus propios favoritos"
      ON public.favorites FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios pueden añadir favoritos' AND tablename = 'favorites') THEN
    CREATE POLICY "Usuarios pueden añadir favoritos"
      ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios pueden eliminar sus favoritos' AND tablename = 'favorites') THEN
    CREATE POLICY "Usuarios pueden eliminar sus favoritos"
      ON public.favorites FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. RLS para articles (admin/editor)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden crear articulos' AND tablename = 'articles') THEN
    CREATE POLICY "Admin y editores pueden crear articulos"
      ON public.articles FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden editar articulos' AND tablename = 'articles') THEN
    CREATE POLICY "Admin y editores pueden editar articulos"
      ON public.articles FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden borrar articulos' AND tablename = 'articles') THEN
    CREATE POLICY "Admin y editores pueden borrar articulos"
      ON public.articles FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores ven todos los articulos' AND tablename = 'articles') THEN
    DROP POLICY IF EXISTS "Articulos publicados visibles para todos" ON public.articles;
    CREATE POLICY "Admin y editores ven todos los articulos"
      ON public.articles FOR SELECT USING (
        published = true
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
END $$;

-- 4. RLS para gallery_images (admin/editor)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden crear imagenes' AND tablename = 'gallery_images') THEN
    CREATE POLICY "Admin y editores pueden crear imagenes"
      ON public.gallery_images FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden editar imagenes' AND tablename = 'gallery_images') THEN
    CREATE POLICY "Admin y editores pueden editar imagenes"
      ON public.gallery_images FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden borrar imagenes' AND tablename = 'gallery_images') THEN
    CREATE POLICY "Admin y editores pueden borrar imagenes"
      ON public.gallery_images FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
END $$;

-- 5. RLS para categories (admin/editor)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin y editores pueden crear categorias' AND tablename = 'categories') THEN
    CREATE POLICY "Admin y editores pueden crear categorias"
      ON public.categories FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
      );
  END IF;
END $$;

-- ============ MIGRATION 003: Lookbook Hotspots ============

-- 6. Tabla de hotspots para lookbook (prendas clicables en una imagen)
CREATE TABLE IF NOT EXISTS public.lookbook_hotspots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_image_id uuid REFERENCES public.gallery_images(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  brand text,
  price text,
  link text,
  pos_x numeric NOT NULL DEFAULT 50,  -- porcentaje 0-100 horizontal
  pos_y numeric NOT NULL DEFAULT 50,  -- porcentaje 0-100 vertical
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lookbook_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hotspots visibles para todos"
  ON public.lookbook_hotspots FOR SELECT USING (true);

CREATE POLICY "Admin y editores pueden crear hotspots"
  ON public.lookbook_hotspots FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admin y editores pueden editar hotspots"
  ON public.lookbook_hotspots FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Admin y editores pueden borrar hotspots"
  ON public.lookbook_hotspots FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- 7. Añadir campos extra a gallery_images para el lookbook mejorado
ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS photographer text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 8. Seed hotspots de ejemplo
INSERT INTO public.lookbook_hotspots (gallery_image_id, label, brand, price, link, pos_x, pos_y)
SELECT
  gi.id,
  h.label,
  h.brand,
  h.price,
  h.link,
  h.pos_x,
  h.pos_y
FROM public.gallery_images gi
CROSS JOIN (VALUES
  ('Blazer oversize', 'Zara', '€89.95', 'https://www.zara.com', 35, 30),
  ('Pantalón wide-leg', 'COS', '€79.00', 'https://www.cos.com', 40, 65),
  ('Bolso bucket', 'Loewe', '€1,450', 'https://www.loewe.com', 70, 50)
) AS h(label, brand, price, link, pos_x, pos_y)
WHERE gi.caption = 'Street style — Milán Fashion Week'
ON CONFLICT DO NOTHING;

INSERT INTO public.lookbook_hotspots (gallery_image_id, label, brand, price, link, pos_x, pos_y)
SELECT
  gi.id,
  h.label,
  h.brand,
  h.price,
  h.link,
  h.pos_x,
  h.pos_y
FROM public.gallery_images gi
CROSS JOIN (VALUES
  ('Vestido midi satin', 'The Row', '€2,100', 'https://www.therow.com', 45, 45),
  ('Sandalias minimal', 'Bottega Veneta', '€890', 'https://www.bottegaveneta.com', 48, 85)
) AS h(label, brand, price, link, pos_x, pos_y)
WHERE gi.caption = 'Minimalismo en blanco'
ON CONFLICT DO NOTHING;

INSERT INTO public.lookbook_hotspots (gallery_image_id, label, brand, price, link, pos_x, pos_y)
SELECT
  gi.id,
  h.label,
  h.brand,
  h.price,
  h.link,
  h.pos_x,
  h.pos_y
FROM public.gallery_images gi
CROSS JOIN (VALUES
  ('Collar statement oro', 'Chanel', '€3,200', 'https://www.chanel.com', 50, 25),
  ('Vestido couture', 'Dior', '€8,500', 'https://www.dior.com', 50, 50),
  ('Clutch joya', 'Judith Leiber', '€4,200', 'https://www.judithlieber.com', 25, 60)
) AS h(label, brand, price, link, pos_x, pos_y)
WHERE gi.caption = 'Haute couture — París'
ON CONFLICT DO NOTHING;

INSERT INTO public.lookbook_hotspots (gallery_image_id, label, brand, price, link, pos_x, pos_y)
SELECT
  gi.id,
  h.label,
  h.brand,
  h.price,
  h.link,
  h.pos_x,
  h.pos_y
FROM public.gallery_images gi
CROSS JOIN (VALUES
  ('Gafas cat-eye', 'Celine', '€380', 'https://www.celine.com', 50, 20),
  ('Pendientes chandelier', 'Saint Laurent', '€595', 'https://www.ysl.com', 65, 30),
  ('Pulsera cadena', 'Tiffany', '€1,250', 'https://www.tiffany.com', 30, 55)
) AS h(label, brand, price, link, pos_x, pos_y)
WHERE gi.caption = 'Accesorios dorados'
ON CONFLICT DO NOTHING;

-- 9. Actualizar tags y photographer de ejemplo
UPDATE public.gallery_images SET
  tags = ARRAY['streetwear', 'milán', 'fw26'],
  photographer = 'Alessandro Viero'
WHERE caption = 'Street style — Milán Fashion Week';

UPDATE public.gallery_images SET
  tags = ARRAY['minimal', 'blanco', 'elegante'],
  photographer = 'Sofia Chen'
WHERE caption = 'Minimalismo en blanco';

UPDATE public.gallery_images SET
  tags = ARRAY['couture', 'parís', 'gala'],
  photographer = 'Marc Beaumont'
WHERE caption = 'Haute couture — París';

UPDATE public.gallery_images SET
  tags = ARRAY['accesorios', 'joyería', 'dorado'],
  photographer = 'Luna Estévez'
WHERE caption = 'Accesorios dorados';

UPDATE public.gallery_images SET
  tags = ARRAY['tendencias', 'pasarela', 'color'],
  photographer = 'Tomás Ríos'
WHERE caption = 'Desfile de tendencias';

UPDATE public.gallery_images SET
  tags = ARRAY['sostenibilidad', 'eco', 'natural'],
  photographer = 'Mia Johansson'
WHERE caption = 'Moda consciente';

UPDATE public.gallery_images SET
  tags = ARRAY['elegancia', 'naturaleza', 'editorial'],
  photographer = 'Claire Dubois'
WHERE caption = 'Elegancia natural';

UPDATE public.gallery_images SET
  tags = ARRAY['runway', 'ss26', 'pasarela'],
  photographer = 'Kenji Nakamura'
WHERE caption = 'Runway SS26';
