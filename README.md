# RAWG Ultimate Explorer

Portal premium de videojuegos con busqueda avanzada y experiencia visual minimalista de alto nivel, construido con React + TypeScript + Vite.

## Stack principal

- React 19 + TypeScript
- Vite 8
- @tanstack/react-query (cache, refetch y control de estados de red)
- Zustand (estado global de filtros)
- Axios (cliente API)
- Framer Motion + GSAP (animaciones y transiciones premium)
- Lucide React (iconografia moderna)

## Funcionalidades

- Busqueda avanzada por nombre
- Filtros por genero, plataforma, orden, metacritic y ventana temporal
- Secciones destacadas: tendencias, top rating y proximos lanzamientos
- Grid de resultados con animacion escalonada
- Modal de detalle con descripcion, metricas, publishers, screenshots y enlaces oficiales
- Paginacion para explorar catalogo completo
- UI responsive para desktop y mobile

## Configuracion

1. Crea tu API key en RAWG: https://rawg.io/apidocs
2. Copia `.env.example` en `.env.local`
3. Define tu clave:

```bash
VITE_RAWG_API_KEY=tu_api_key
```

## Ejecutar en desarrollo

```bash
npm install
npm run dev
```

## Build de produccion

```bash
npm run build
npm run preview
```
