import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Creates a Supabase client configured to use cookies in the browser
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}