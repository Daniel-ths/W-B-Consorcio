export type BrandKey = "chevrolet" | "hyundai";

export const BRANDS: Record<BrandKey, { key: BrandKey; name: string }> = {
  chevrolet: { key: "chevrolet", name: "Chevrolet" },
  hyundai: { key: "hyundai", name: "Hyundai" },
};

export function isBrandKey(value: string): value is BrandKey {
  return value === "chevrolet" || value === "hyundai";
}