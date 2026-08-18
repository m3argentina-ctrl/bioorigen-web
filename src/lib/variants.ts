import type { Product, ProductVariant } from "@/lib/types";

/**
 * Categorías habilitadas para vender por medida/modelo. El resto del catálogo
 * mantiene precio único: aunque un producto tuviera `variants` cargado, fuera
 * de estas categorías se ignora.
 */
export const CATEGORIES_WITH_VARIANTS: readonly string[] = [
  "Laminas antiadherentes",
  "Mesadas, Bachas y Estantes Acero Inoxidable",
];

/** @deprecated usar CATEGORIES_WITH_VARIANTS */
export const CATEGORY_WITH_VARIANTS = CATEGORIES_WITH_VARIANTS[0];

/** Etiqueta del selector en la ficha. */
export const VARIANT_LABEL = "Medida";

type MaybeProduct = Pick<Product, "category" | "price" | "salePrice" | "stock"> & {
  variants?: unknown;
};

function toNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * Lee las variantes de un producto de forma defensiva: el campo es Json libre,
 * así que puede venir con basura de una carga manual. Devuelve [] si el producto
 * no es de la categoría habilitada o si no hay ninguna variante válida.
 */
export function parseVariants(product: MaybeProduct): ProductVariant[] {
  if (!CATEGORIES_WITH_VARIANTS.includes(product.category)) return [];
  const raw = product.variants;
  if (!Array.isArray(raw)) return [];

  const out: ProductVariant[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const label = typeof r.label === "string" ? r.label.trim() : "";
    const price = toNumber(r.price);
    // Sin id, sin etiqueta o sin precio positivo la variante no sirve.
    if (!id || !label || price === null || price <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    const salePrice = toNumber(r.salePrice);
    const stock = toNumber(r.stock);
    out.push({
      id,
      label,
      price,
      // La oferta solo vale si es menor al precio de lista.
      salePrice: salePrice !== null && salePrice > 0 && salePrice < price ? salePrice : null,
      stock: stock !== null && stock >= 0 ? Math.round(stock) : null,
    });
  }
  return out;
}

export function hasVariants(product: MaybeProduct): boolean {
  return parseVariants(product).length > 0;
}

export function findVariant(product: MaybeProduct, variantId: string | null | undefined) {
  if (!variantId) return null;
  return parseVariants(product).find((v) => v.id === variantId) ?? null;
}

/** Stock efectivo: el de la variante si lo define, si no el del producto. */
export function variantStock(product: MaybeProduct, variant: ProductVariant | null): number {
  if (variant && variant.stock !== null) return variant.stock;
  return product.stock;
}

/** Precio de lista (antes de oferta) de la variante elegida, o del producto. */
export function listPriceOf(product: MaybeProduct, variant: ProductVariant | null): number {
  return variant ? variant.price : product.price;
}

/** Precio que efectivamente se cobra. Es el único lugar donde se decide esto. */
export function unitPriceOf(product: MaybeProduct, variant: ProductVariant | null): number {
  if (variant) return variant.salePrice ?? variant.price;
  return product.salePrice ?? product.price;
}

/** Precio más bajo entre todas las medidas — para el "Desde $…" del listado. */
export function minPriceOf(product: MaybeProduct): number {
  const vs = parseVariants(product);
  if (vs.length === 0) return product.salePrice ?? product.price;
  return Math.min(...vs.map((v) => v.salePrice ?? v.price));
}

/**
 * Clave de línea del carrito. Un mismo producto en dos medidas son dos líneas
 * distintas, así que la identidad no puede ser solo el id del producto.
 */
export function lineKey(productId: string, variantId?: string | null): string {
  return variantId ? `${productId}::${variantId}` : productId;
}
