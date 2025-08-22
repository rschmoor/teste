import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🔒 Middleware executado para:', request.nextUrl.pathname)
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Verificar se é uma rota admin
  if (pathname.startsWith('/admin')) {
    console.log('🔍 Verificando autenticação para rota admin')
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('❌ Usuário não autenticado, redirecionando para login')
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Verificar se o usuário tem perfil de administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      console.log('❌ Usuário não é administrador, redirecionando para home')
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    console.log('✅ Usuário administrador autenticado')
  }

  // Verificar se é uma rota de conta (exceto login/cadastro)
  if (pathname.startsWith('/conta') && !pathname.startsWith('/conta/login') && !pathname.startsWith('/conta/cadastro')) {
    console.log('🔍 Verificando autenticação para área da conta')
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('❌ Usuário não autenticado, redirecionando para login')
      const loginUrl = new URL('/conta/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    console.log('✅ Usuário autenticado para área da conta')
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/conta/:path*',
  ],
}