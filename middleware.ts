import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Prepara a resposta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ⚠️ BLOCO DE SEGURANÇA: Se não tiver chaves, nem tenta rodar o Supabase
  // Isso evita o erro 500 se você esqueceu de configurar no Vercel
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return response // Retorna sem fazer nada
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  // Recupera o usuário
  const { data: { user } } = await supabase.auth.getUser()

  // 🔒 PROTEÇÃO DE ROTAS (COMENTADA/DESATIVADA)
  // O código abaixo causava o loop. Deixei comentado para você ver.
  /*
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendedor'))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  */

  return response
}

export const config = {
  // 🛑 O "matcher" vazio significa que este middleware NÃO VAI RODAR em rota nenhuma.
  // É o jeito mais seguro de "desligar" o arquivo sem apagar ele.
  matcher: [
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}