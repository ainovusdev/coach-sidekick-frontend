import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// For now, we'll use a simple type until we generate types from the database
export type Database = any

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Simple client-side Supabase client (for basic usage)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Browser client (for client components with SSR support)
export const createClientClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

export default supabase
