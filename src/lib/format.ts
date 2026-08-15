export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Texto que reemplaza al importe en los productos a convenir. */
export const QUOTE_PRICE_LABEL = "Consultar precio";

/**
 * Productos "a convenir": se marcan poniendo `price = 0` desde el admin.
 * No muestran importe, no se pueden comprar online y no entran en el filtro
 * de precios. Se usa en equipos cuyo costo depende de cada caso (fabricación
 * a medida, kits de actualización, etc.).
 */
export function isQuotePrice(product: { price: number }): boolean {
  return !(product.price > 0);
}
