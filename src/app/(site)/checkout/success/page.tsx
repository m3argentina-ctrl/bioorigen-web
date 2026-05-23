"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clear } = useCart();
  const orderId = searchParams.get("external_reference") ?? searchParams.get("orderId");
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-bio-green/10">
        <span className="text-4xl">✅</span>
      </div>

      <h1 className="text-2xl font-bold text-bio-dark">¡Pago aprobado!</h1>
      <p className="mt-3 text-bio-dark/70">
        Tu pedido fue confirmado. Recibirás una confirmación por email.
      </p>

      {orderId && (
        <p className="mt-4 rounded-lg bg-bio-beige px-4 py-3 text-sm text-bio-dark/60">
          Número de orden:{" "}
          <span className="font-mono font-semibold text-bio-dark">{orderId}</span>
        </p>
      )}

      {paymentId && (
        <p className="mt-2 text-xs text-bio-dark/40">ID de pago: {paymentId}</p>
      )}

      <Link
        href="/"
        className="mt-8 inline-block rounded-xl bg-bio-green px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
