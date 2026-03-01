import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { stripBrandPrefix } from "@/lib/brand";

const GLOBAL_ROUTES = ["/", "/login", "/admin", "/vendedor", "/supervisor", "/api", "/_next", "/profile"];

function isGlobalRoute(pathname: string) {
  return GLOBAL_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const normalizedPath = stripBrandPrefix(pathname);

  if (pathname !== normalizedPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = normalizedPath;
    return NextResponse.rewrite(rewriteUrl);
  }

  if (!isGlobalRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/chevrolet${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && normalizedPath.startsWith("/login")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!user && (normalizedPath.startsWith("/admin") || normalizedPath.startsWith("/vendedor"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
