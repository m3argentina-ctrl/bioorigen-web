"use client";

import { useState } from "react";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useVariant, VariantSelector } from "@/components/products/VariantContext";
import type { Product, ShippingMode } from "@/lib/types";

const SHIPPING_INFO: Record<ShippingMode, string> = {
  COORDINAR: "Envío a coordinar — Te contactamos para definir el traslado.",
  PROVEEDOR_DIRECTO: "Envío directo desde el proveedor — La entrega es de 7 a 10 días hábiles.",
  RETIRO_SOLO: "Solo retiro en fábrica — Sin envío a domicilio.",
};

export default function AddToCart({ product, shippingMode = "COORDINAR" }: { product: Product; shippingMode?: ShippingMode }) {
  const { addItem } = useCart();
  // El stock y el precio salen de la medida elegida (o del producto si no tiene).
  const { selected, variants, stock } = useVariant();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = stock <= 0;

  function dec() { setQty((q) => Math.max(1, q - 1)); }
  function inc() { setQty((q) => (stock > 0 ? Math.min(stock, q + 1) : q + 1)); }

  function handleAdd() {
    addItem(product, qty, selected?.id ?? null);
    setAdded(true);
    setTimeout(() => { setAdded(false); setQty(1); }, 1500);
  }

  return (
    <div className="space-y-3">
      <VariantSelector product={product} />

      {/* Selector de cantidad — solo con stock */}
      {!outOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-bio-dark">Cantidad</span>
          <div className="flex items-center rounded-full border border-slate-200">
            <button
              type="button"
              onClick={dec}
              disabled={qty <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-l-full text-bio-dark transition-colors hover:bg-slate-100 disabled:opacity-30"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-bio-dark">
              {qty}
            </span>
            <button
              type="button"
              onClick={inc}
              disabled={qty >= stock}
              className="flex h-9 w-9 items-center justify-center rounded-r-full text-bio-dark transition-colors hover:bg-slate-100 disabled:opacity-30"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-xs text-bio-dark/40">{stock} disponibles</span>
        </div>
      )}

      {/* Botón agregar */}
      <button
        type="button"
        onClick={handleAdd}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors ${
          added ? "bg-bio-green" : "bg-bio-orange hover:bg-bio-orange-dark"
        }`}
      >
        {added ? (
          <><Check size={18} /> Agregado</>
        ) : (
          <><ShoppingCart size={18} /> Agregar al carrito{qty > 1 ? ` (${qty})` : ""}</>
        )}
      </button>

      {outOfStock && (
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-amber-600">
          {product.supplierId
            ? "Disponible bajo pedido — La entrega de este producto es de 7/10 días."
            : variants.length > 0
              ? "Esta medida se fabrica a pedido. Te contactamos para coordinar la entrega."
              : "Este producto se fabrica a pedido. Te contactamos para coordinar la entrega."}
        </p>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-bio-dark/60">
        <span className="mt-0.5 shrink-0">🚚</span>
        {SHIPPING_INFO[shippingMode]}
      </p>
    </div>
  );
}
