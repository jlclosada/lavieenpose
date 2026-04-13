-- =============================================
-- LaVieEnPose — Datos de prueba
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- Artículos de prueba (publicados)
INSERT INTO public.articles (title, slug, excerpt, content, cover_image, category_id, published, featured, created_at) VALUES
(
  'Las 10 tendencias que dominarán 2026',
  'tendencias-2026',
  'Desde el minimalismo japonés hasta el neo-barroco digital, estas son las tendencias que verás en cada pasarela este año.',
  '<h2>El futuro de la moda ya está aquí</h2><p>La moda en 2026 se define por la fusión de lo clásico con lo digital. Las casas de moda más influyentes están apostando por colecciones que combinan técnicas artesanales centenarias con tecnología de vanguardia.</p><h3>1. Minimalismo Japonés</h3><p>La influencia del wabi-sabi se extiende más allá de la decoración. Telas naturales, cortes limpios y paletas neutras dominan las colecciones de primavera.</p><h3>2. Neo-Barroco Digital</h3><p>Estampados generados por IA que reinterpretan los motivos barrocos clásicos. Versace y Dolce & Gabbana lideran esta tendencia con piezas que fusionan el exceso ornamental con la precisión algorítmica.</p><p>La temporada promete ser una de las más diversas en cuanto a estilos y propuestas.</p>',
  'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
  (SELECT id FROM public.categories WHERE slug = 'tendencias'),
  true, true, now() - interval '2 days'
),
(
  'Streetwear de lujo: cuando la calle conquista la pasarela',
  'streetwear-lujo-pasarela',
  'El streetwear ya no es underground. Las colaboraciones entre marcas de lujo y diseñadores urbanos redefinen la alta moda.',
  '<h2>La revolución urbana</h2><p>Lo que comenzó en las calles de Nueva York y Tokio ahora se sienta en primera fila de la Fashion Week. El streetwear de lujo ha dejado de ser una tendencia para convertirse en un pilar de la moda contemporánea.</p><p>Marcas como <strong>Off-White</strong>, <strong>Fear of God</strong> y <strong>Rhude</strong> han demostrado que las zapatillas y las sudaderas pueden costar tanto como un traje a medida — y tener la misma relevancia cultural.</p><h3>Colaboraciones destacadas</h3><p>La colaboración Louis Vuitton x Pharrell sigue marcando el estándar, mientras que Balenciaga continúa difuminando las líneas entre lo casual y lo couture.</p>',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
  (SELECT id FROM public.categories WHERE slug = 'streetwear'),
  true, true, now() - interval '1 day'
),
(
  'Moda sostenible: más allá del greenwashing',
  'moda-sostenible-greenwashing',
  'Materiales reciclados, producción ética y transparencia total. Así se construye el futuro responsable de la moda.',
  '<h2>El verdadero compromiso</h2><p>La sostenibilidad en la moda ha pasado de ser un eslogan a una exigencia. Los consumidores ya no aceptan medias tintas: quieren saber de dónde viene cada fibra de su ropa.</p><p>Marcas como <strong>Stella McCartney</strong>, <strong>Patagonia</strong> y <strong>Eileen Fisher</strong> llevan años liderando el cambio, pero ahora incluso los gigantes del fast fashion se ven obligados a seguir el paso.</p><h3>Innovaciones textiles</h3><p>Desde cuero cultivado en laboratorio hasta tejidos hechos de algas marinas, la innovación material está transformando lo que es posible en la moda ética.</p>',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
  (SELECT id FROM public.categories WHERE slug = 'sostenibilidad'),
  true, false, now() - interval '5 hours'
),
(
  'Accesorios statement: las piezas que transforman cualquier look',
  'accesorios-statement-2026',
  'Un collar escultórico o un bolso arquitectónico pueden elevar el outfit más sencillo. Descubre las piezas clave de la temporada.',
  '<h2>El poder del accesorio</h2><p>En una era donde menos es más en cuanto a prendas, los accesorios se convierten en los verdaderos protagonistas. Un outfit básico de camiseta blanca y jeans puede transformarse completamente con las piezas adecuadas.</p><h3>Tendencias clave</h3><p><strong>Joyería escultórica:</strong> Anillos y brazaletes que parecen obras de arte contemporáneo. Bottega Veneta y Loewe marcan la pauta.</p><p><strong>Bolsos arquitectónicos:</strong> Formas geométricas imposibles que desafían la funcionalidad — pero que fotografían de maravilla.</p>',
  'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800',
  (SELECT id FROM public.categories WHERE slug = 'accesorios'),
  true, false, now() - interval '3 days'
),
(
  'Alta costura digital: el metaverso se viste de Chanel',
  'alta-costura-digital-metaverso',
  'Las casas de alta costura exploran el diseño virtual. Prendas que solo existen en el mundo digital ya se venden por miles de euros.',
  '<h2>La pasarela virtual</h2><p>Chanel, Gucci y Prada ya tienen divisiones dedicadas a la moda digital. Las prendas virtuales no son solo para avatares — son una declaración de status en el metaverso.</p><p>La alta costura, con su tradición de piezas únicas y hechas a medida, encuentra en lo digital un nuevo lienzo para la experimentación sin límites físicos.</p>',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
  (SELECT id FROM public.categories WHERE slug = 'alta-costura'),
  true, true, now()
);

-- Imágenes de galería (lookbook)
INSERT INTO public.gallery_images (url, caption, collection, sort_order) VALUES
('https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800', 'Street style — Milán Fashion Week', 'SS26', 1),
('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', 'Minimalismo en blanco', 'SS26', 2),
('https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800', 'Haute couture — París', 'AW25', 3),
('https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800', 'Accesorios dorados', 'Accesorios', 4),
('https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800', 'Desfile de tendencias', 'SS26', 5),
('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800', 'Moda consciente', 'Sostenibilidad', 6),
('https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', 'Elegancia natural', 'AW25', 7),
('https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800', 'Runway SS26', 'SS26', 8);
