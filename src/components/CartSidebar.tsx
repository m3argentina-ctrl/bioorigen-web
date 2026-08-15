"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";

export default function CartSidebar() {
  const { items, isOpen, subtotal, closeCart, setQuantity, removeItem, keyOf, unitPrice, variantLabel } =
    useCart();

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden
        className={`fixed inset-0 z-40 bg-bio-dark/50 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-label="Carrito de compras"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-bio-beige shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-bio-green/20 px-5 py-4">
          <h2 className="text-lg font-bold text-bio-dark">Tu carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="flex h-9 w-9 items-center justify-center rounded-full text-bio-dark transition-colors hover:bg-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-bio-dark/60">
              Tu carrito está vacío.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const { product, quantity } = item;
                const key = keyOf(item);
                const medida = variantLabel(item);
                return (
                <li key={key} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                    {product.images[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold text-bio-dark">
                      {product.name}
                    </span>
                    {medida && (
                      <span className="text-xs text-bio-dark/50">Medida: {medida}</span>
                    )}
                    <span className="text-sm text-bio-dark/70">
                      {formatPrice(unitPrice(item))}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Restar"
                        onClick={() => setQuantity(key, quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-bio-green/30 text-bio-dark hover:bg-white"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-sm">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Sumar"
                        onClick={() => setQuantity(key, quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-bio-green/30 text-bio-dark hover:bg-white"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(key)}
                        className="ml-auto text-xs text-bio-dark/50 hover:text-bio-orange"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-bio-green/20 px-5 py-4">
          <div className="flex items-center justify-between text-base font-bold text-bio-dark">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={closeCart}
            aria-disabled={items.length === 0}
            tabIndex={items.length === 0 ? -1 : undefined}
            className={`mt-3 block w-full rounded-full py-3 text-center text-sm font-semibold text-white transition-colors ${
              items.length === 0
                ? "pointer-events-none bg-bio-orange/40"
                : "bg-bio-orange hover:opacity-90"
            }`}
          >
            Finalizar compra
          </Link>
        </div>
      </aside>
    </>
  );
}
