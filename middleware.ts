import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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

  // Tenta pegar o usuário
  const { data: { user } } = await supabase.auth.getUser()

  // --- LOGS DE DEBUG (Olhe no seu terminal onde roda o npm run dev) ---
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor')) {
    console.log(`[Middleware] Acessando rota: ${request.nextUrl.pathname}`)
    console.log(`[Middleware] Usuário logado? ${user ? 'SIM' : 'NÃO'} (${user?.email})`)
  }
  // -------------------------------------------------------------------

  // PROTEÇÃO DAS ROTAS

  // 1. Se tentar acessar /admin ou /vendedor SEM estar logado -> Login
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor'))) {
    const loginUrl = new URL('/login', request.url)
    // Redireciona pro login
    return NextResponse.redirect(loginUrl)
  }

  // 2. Se já estiver logado e tentar acessar /login -> Manda pro Painel (Baseado no cookie, mas idealmente a gente deixa a pagina tratar)
  if (user && request.nextUrl.pathname === '/login') {
     // Aqui deixamos passar, pois o redirecionamento ideal deve ser feito na página de login, 
     // mas se quiser forçar, descomente abaixo:
     // return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto estáticas e imagens
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}