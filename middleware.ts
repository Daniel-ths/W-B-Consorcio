import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Cria a resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Configura o cliente Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // AQUI ESTAVA O ERRO: Não recrie a resposta, apenas atualize os cookies
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // AQUI TAMBÉM: Não recrie a resposta
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Verifica o usuário (Isso garante que o token seja atualizado se necessário)
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // --- REGRAS DE ROTEAMENTO ---

  // REGRA 1: Rotas públicas dentro de /vendedor
  if (path.startsWith('/vendedor/seminovos') || path.startsWith('/vendedor/analise')) {
    return response
  }

  // REGRA 2: Bloqueio de rotas protegidas
  if ((path.startsWith('/vendedor') || path.startsWith('/admin')) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // REGRA 3: Redirecionamento se já estiver logado
  if (path.startsWith('/login') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}