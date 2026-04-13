import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import type { Profile, UserRole } from '../types/rawg'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
  role: UserRole
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  role: 'user',
  setSession: (session) =>
    set(() => ({ session, user: session?.user ?? null, loading: false })),
  setProfile: (profile) =>
    set(() => ({ profile, role: profile?.role ?? 'user' })),
  setLoading: (loading) => set(() => ({ loading })),
  clear: () => set(() => ({ session: null, user: null, profile: null, role: 'user', loading: false })),
  get isAdmin() { return get().role === 'admin' },
  get isEditor() { return get().role === 'editor' },
  get canManageContent() { return get().role === 'admin' || get().role === 'editor' },
}))
