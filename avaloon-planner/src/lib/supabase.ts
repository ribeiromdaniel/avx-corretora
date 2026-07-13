import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
// O Planner vive no schema 'planner' (isolado do projeto que o hospeda)
const schema = (import.meta.env.VITE_SUPABASE_SCHEMA as string) || 'planner'

if (!url || !anonKey) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (ver .env.example).',
  )
}

export const supabase = createClient(url, anonKey, { db: { schema } })
