import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Prepara a resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Configura o cliente Supabase (Versão SSR Moderna)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Verifica o usuário logado
  // getUser é mais seguro que getSession para middleware
  const { data: { user } } = await supabase.auth.getUser()

  // --- LOGS DE DEBUG (Ajudam a ver se está funcionando no terminal) ---
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor')) {
    console.log(`[Middleware] Rota Protegida: ${request.nextUrl.pathname}`)
    console.log(`[Middleware] Status: ${user ? 'Logado ✅' : 'Não Logado ❌'}`)
  }
  
  // 4. BLOQUEIO DE SEGURANÇA
  // Se tentar acessar /admin ou /vendedor e NÃO estiver logado -> Chuta pro Login
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor'))) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 5. (Opcional) Redirecionar usuário logado que tenta acessar /login
  if (user && request.nextUrl.pathname === '/login') {
      // Você pode descomentar abaixo se quiser que o vendedor vá direto pro dashboard
      // return NextResponse.redirect(new URL('/vendedor/seminovos', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas, exceto arquivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}