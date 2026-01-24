import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Prepara a resposta padrão (deixar passar)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Configura o Supabase para ler o cookie de login
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Verifica se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // --- REGRAS DE BLOQUEIO SIMPLES ---

  // REGRA 1: O que é PÚBLICO dentro da pasta vendedor?
  // Se for a página de Seminovos ou Análise, LIBERA GERAL (mesmo sem login)
  if (path.startsWith('/vendedor/seminovos') || path.startsWith('/vendedor/analise')) {
    return response
  }

  // REGRA 2: Bloqueio do Painel Vendedor e Admin
  // Se tentar acessar qualquer outra coisa de /vendedor ou /admin E NÃO estiver logado:
  if ((path.startsWith('/vendedor') || path.startsWith('/admin')) && !user) {
    // Manda para o login e avisa pra onde voltar depois
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // REGRA 3: Se já está logado e tenta ir pro Login, joga pro Admin
  if (path.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

// Configuração: Onde esse porteiro deve trabalhar?
export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas, MENOS arquivos estáticos (imagens, css, favicon)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}