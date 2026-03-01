export type BrandSlug = "chevrolet" | "hyundai";

export const BRAND_PREFIXES: BrandSlug[] = ["chevrolet", "hyundai"];

export function detectBrandFromPath(pathname: string): BrandSlug {
  const normalized = pathname.toLowerCase();

  if (normalized === "/hyundai" || normalized.startsWith("/hyundai/")) {
    return "hyundai";
  }

  return "chevrolet";
}

export function withBrandPath(pathname: string, brand: BrandSlug): string {
  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (safePath === "/") {
    return `/${brand}`;
  }

  return `/${brand}${safePath}`;
}

export function stripBrandPrefix(pathname: string): string {
  for (const prefix of BRAND_PREFIXES) {
    if (pathname === `/${prefix}`) {
      return "/";
    }

    if (pathname.startsWith(`/${prefix}/`)) {
      return pathname.replace(`/${prefix}`, "") || "/";
    }
  }

  return pathname;
}
