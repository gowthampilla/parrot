import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    
    // 1. Exchange the Google code for a secure session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 2. Get the authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 3. Check if this user already exists in our public.users table
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        // 4. Route them based on their status
        if (existingProfile) {
          // Returning User -> Go straight to the app
          return NextResponse.redirect(`${origin}/home`)
        } else {
          // Brand New User -> Send to MCQ Onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
    }
  }

  // If anything fails, send them back to login with an error
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
}