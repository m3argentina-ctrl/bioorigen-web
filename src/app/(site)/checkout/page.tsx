"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import CheckoutForm from "@/components/checkout/CheckoutForm";

export default function CheckoutPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingCart size={48} className="mx-auto mb-4 text-bio-dark/30" />
        <h1 className="text-2xl font-bold text-bio-dark">Tu carrito está vacío</h1>
        <p className="mt-2 text-bio-dark/60">
          Agregá productos antes de continuar con el pago.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-block rounded-xl bg-bio-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ver productos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-bio-dark">Finalizar compra</h1>
      <CheckoutForm />
    </main>
  );
}
