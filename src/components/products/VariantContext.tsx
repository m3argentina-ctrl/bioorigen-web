"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { formatPrice, isQuotePrice, QUOTE_PRICE_LABEL } from "@/lib/format";
import {
  listPriceOf,
  parseVariants,
  unitPriceOf,
  VARIANT_LABEL,
  variantStock,
} from "@/lib/variants";

type Ctx = {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  select: (id: string) => void;
  unitPrice: number;
  listPrice: number;
  stock: number;
};

const VariantContext = createContext<Ctx | null>(null);

/**
 * Comparte la medida elegida entre el bloque de precio y el de compra, que
 * están separados en el DOM por la descripción y las especificaciones.
 */
export function VariantProvider({
  product,
  children,
}: {
  product: Product;
  children: React.ReactNode;
}) {
  const variants = useMemo(() => parseVariants(product), [product]);
  // Arranca en la primera medida con stock; si ninguna tiene, en la primera.
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (variants.length === 0) return null;
    return (variants.find((v) => (v.stock ?? product.stock) > 0) ?? variants[0]).id;
  });

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  const value: Ctx = {
    variants,
    selected,
    select: setSelectedId,
    unitPrice: unitPriceOf(product, selected),
    listPrice: listPriceOf(product, selected),
    stock: variantStock(product, selected),
  };

  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

export function useVariant(): Ctx {
  const ctx = useContext(VariantContext);
  if (!ctx) throw new Error("useVariant debe usarse dentro de VariantProvider");
  return ctx;
}

/** Precio de la ficha. Se actualiza al cambiar de medida. */
export function ProductPrice({ product }: { product: Product }) {
  const { unitPrice, listPrice } = useVariant();

  if (isQuotePrice(product)) {
    return <span className="text-3xl font-extrabold text-bio-green">{QUOTE_PRICE_LABEL}</span>;
  }

  const onSale = unitPrice < listPrice;
  const discount = onSale ? Math.round((1 - unitPrice / listPrice) * 100) : 0;

  if (!onSale) {
    return <span className="text-3xl font-extrabold text-bio-green">{formatPrice(unitPrice)}</span>;
  }
  return (
    <>
      <span className="text-3xl font-extrabold text-red-500">{formatPrice(unitPrice)}</span>
      <span className="text-lg text-bio-dark/40 line-through">{formatPrice(listPrice)}</span>
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-sm font-bold text-red-600">
        -{discount}% OFF
      </span>
    </>
  );
}

/** Selector de medida. No renderiza nada si el producto no tiene variantes. */
export function VariantSelector({ product }: { product: Product }) {
  const { variants, selected, select } = useVariant();
  if (variants.length === 0) return null;

  return (
    <div>
      <span className="text-sm font-medium text-bio-dark">{VARIANT_LABEL}</span>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={VARIANT_LABEL}>
        {variants.map((v) => {
          const active = selected?.id === v.id;
          const agotada = (v.stock ?? product.stock) <= 0;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => select(v.id)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bio-orange ${
                active
                  ? "border-bio-green bg-bio-green text-white"
                  : "border-slate-200 text-bio-dark hover:border-bio-green"
              }`}
            >
              {v.label}
              {agotada && (
                <span className={`ml-1.5 text-xs ${active ? "text-white/70" : "text-bio-dark/40"}`}>
                  (a pedido)
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
