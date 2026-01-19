import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Prepara a resposta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 🛡️ SEGURANÇA CONTRA FALHA DE CONFIGURAÇÃO
  // Se as chaves sumirem do Vercel, o middleware para de rodar para não dar erro 500
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return response 
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

  // Essa linha é mágica: ela renova a sessão do usuário se estiver expirando
  await supabase.auth.getUser()

  // NOTA: Eu removi a parte de redirecionamento forçado aqui.
  // Deixamos a proteção de rotas (redirect) por conta das páginas (Admin/Vendedor).
  // O middleware servirá APENAS para manter a sessão viva (Refresh Token).

  return response
}

export const config = {
  // Reativamos o matcher para todas as rotas, exceto arquivos estáticos
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}