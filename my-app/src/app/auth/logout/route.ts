import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  // Check if we have a session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    await supabase.auth.signOut()
  }
  
  return NextResponse.redirect(new URL('/auth/login', request.url), {
    status: 302,
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}