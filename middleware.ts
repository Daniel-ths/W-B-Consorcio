import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // LOG PARA DEPURAR: Ver se o middleware está rodando
  console.log(`🔒 Verificando acesso em: ${request.nextUrl.pathname}`)

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
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se tem usuário, mostra no terminal
  if (user) {
    console.log("✅ Usuário logado: ", user.email)
  } else {
    console.log("❌ Usuário NÃO logado")
  }

  // REGRA DE PROTEÇÃO
  if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
    if (!user) {
      console.log("🚫 Acesso NEGADO. Redirecionando para Login.")
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  // Garante que roda em todas as rotas de admin
  matcher: ['/admin/:path*'],
}