import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey)

if (!hasSupabase) {
  console.warn('Supabase credentials missing. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase: SupabaseClient = hasSupabase
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient)
