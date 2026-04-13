import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { hasSupabase, supabase } from './lib/supabase.ts'
import AboutPage from './pages/AboutPage.tsx'
import ArticleDetailPage from './pages/ArticleDetailPage.tsx'
import ArticlesPage from './pages/ArticlesPage.tsx'
import AuthPage from './pages/AuthPage.tsx'
import GalleryPage from './pages/GalleryPage.tsx'
import HomePage from './pages/HomePage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import AdminArticles from './pages/admin/AdminArticles.tsx'
import AdminDashboard from './pages/admin/AdminDashboard.tsx'
import AdminGallery from './pages/admin/AdminGallery.tsx'
import AdminLayout from './pages/admin/AdminLayout.tsx'
import AdminUsers from './pages/admin/AdminUsers.tsx'
import ArticleEditor from './pages/admin/ArticleEditor.tsx'
import { useAuthStore } from './store/useFiltersStore.ts'

/* ---------- Auth listener ---------- */
if (hasSupabase) {
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const store = useAuthStore.getState()
    store.setSession(session)
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      store.setProfile(data)
    } else {
      store.setProfile(null)
    }
  })
}

/* ---------- React-Query ---------- */
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`[Query Error] ${String(query.queryKey)}:`, error)
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

/* ---------- Router ---------- */
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'articles', element: <ArticlesPage /> },
      { path: 'articles/:slug', element: <ArticleDetailPage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'articles', element: <AdminArticles /> },
      { path: 'articles/new', element: <ArticleEditor /> },
      { path: 'articles/edit/:id', element: <ArticleEditor /> },
      { path: 'gallery', element: <AdminGallery /> },
      { path: 'users', element: <AdminUsers /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
