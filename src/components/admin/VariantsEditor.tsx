"use client";

import { Plus, Trash2 } from "lucide-react";
import { CATEGORIES_WITH_VARIANTS } from "@/lib/variants";

export type VariantDraft = {
  id: string;
  label: string;
  price: string;
  salePrice: string;
  stock: string;
};

export const EMPTY_VARIANT: VariantDraft = {
  id: "",
  label: "",
  price: "",
  salePrice: "",
  stock: "",
};

/** Convierte el borrador del form al JSON que se guarda en Product.variants. */
export function draftsToVariants(drafts: VariantDraft[]) {
  const out = drafts
    .filter((d) => d.label.trim() && Number(d.price) > 0)
    .map((d) => ({
      // Si no se escribió un id, se deriva de la etiqueta (estable y legible).
      id: (d.id.trim() || d.label.trim().toLowerCase().replace(/\s+/g, "-")).slice(0, 40),
      label: d.label.trim(),
      price: Number(d.price),
      salePrice: Number(d.salePrice) > 0 ? Number(d.salePrice) : null,
      stock: d.stock.trim() === "" ? null : Math.max(0, Math.round(Number(d.stock) || 0)),
    }));
  return out.length > 0 ? out : null;
}

export function variantsToDrafts(raw: unknown): VariantDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => {
    const r = (v ?? {}) as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      label: String(r.label ?? ""),
      price: r.price != null ? String(r.price) : "",
      salePrice: r.salePrice != null ? String(r.salePrice) : "",
      stock: r.stock != null ? String(r.stock) : "",
    };
  });
}

/**
 * Editor de medidas. Solo se muestra en la categoría habilitada — el resto del
 * catálogo mantiene precio único.
 */
export default function VariantsEditor({
  category,
  variants,
  setVariants,
}: {
  category: string;
  variants: VariantDraft[];
  setVariants: (v: VariantDraft[]) => void;
}) {
  if (!CATEGORIES_WITH_VARIANTS.includes(category)) return null;

  function update(i: number, patch: Partial<VariantDraft>) {
    setVariants(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">Medidas y precios</label>
        <button
          type="button"
          onClick={() => setVariants([...variants, { ...EMPTY_VARIANT }])}
          className="flex items-center gap-1 rounded-full bg-bio-green px-3 py-1 text-xs font-semibold text-white hover:bg-bio-green-dark"
        >
          <Plus size={13} /> Agregar medida
        </button>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Cargá una fila por medida. El cliente elige la medida en la ficha y el precio cambia solo.
        Dejá <strong>Stock</strong> vacío para que use el stock general del producto.
        Si no cargás ninguna medida, el producto usa el precio único de arriba.
      </p>

      {variants.length === 0 ? (
        <p className="text-xs text-slate-400">Sin medidas cargadas — precio único.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_100px_100px_80px_32px] gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <span>Medida</span>
            <span>Precio</span>
            <span>Oferta</span>
            <span>Stock</span>
            <span />
          </div>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_100px_80px_32px] gap-2">
              <input
                value={v.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="35 x 35 cm"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={v.price}
                onChange={(e) => update(i, { price: e.target.value })}
                type="number"
                min={0}
                placeholder="21000"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={v.salePrice}
                onChange={(e) => update(i, { salePrice: e.target.value })}
                type="number"
                min={0}
                placeholder="—"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={v.stock}
                onChange={(e) => update(i, { stock: e.target.value })}
                type="number"
                min={0}
                placeholder="gral."
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                aria-label="Quitar medida"
                className="flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
