"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PendingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("external_reference");

  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50">
        <span className="text-4xl">⏳</span>
      </div>

      <h1 className="text-2xl font-bold text-bio-dark">Pago pendiente</h1>
      <p className="mt-3 text-bio-dark/70">
        Tu pago está siendo procesado. Te avisaremos por email cuando se confirme.
      </p>

      {orderId && (
        <p className="mt-4 rounded-lg bg-bio-beige px-4 py-3 text-sm text-bio-dark/60">
          Número de orden:{" "}
          <span className="font-mono font-semibold text-bio-dark">{orderId}</span>
        </p>
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

export default function CheckoutPendingPage() {
  return (
    <Suspense>
      <PendingContent />
    </Suspense>
  );
}
