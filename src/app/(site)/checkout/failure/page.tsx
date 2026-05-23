"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const STATUS_DETAIL_LABELS: Record<string, string> = {
  cc_rejected_insufficient_amount: "Fondos insuficientes",
  cc_rejected_bad_filled_security_code: "Código de seguridad incorrecto",
  cc_rejected_bad_filled_date: "Fecha de vencimiento incorrecta",
  cc_rejected_bad_filled_card_number: "Número de tarjeta incorrecto",
  cc_rejected_call_for_authorize: "La tarjeta requiere autorización",
  cc_rejected_card_disabled: "Tarjeta deshabilitada",
  cc_rejected_duplicated_payment: "Pago duplicado",
  cc_rejected_high_risk: "Pago rechazado por seguridad",
};

function FailureContent() {
  const searchParams = useSearchParams();
  const statusDetail = searchParams.get("status_detail") ?? "";
  const reason = STATUS_DETAIL_LABELS[statusDetail] ?? "El pago fue rechazado";
  const externalRef = searchParams.get("external_reference");

  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
        <span className="text-4xl">❌</span>
      </div>

      <h1 className="text-2xl font-bold text-bio-dark">Pago rechazado</h1>
      <p className="mt-3 text-bio-dark/70">{reason}</p>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href={externalRef ? `/checkout?retry=${externalRef}` : "/checkout"}
          className="w-full max-w-xs rounded-xl bg-bio-green px-6 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Reintentar pago
        </Link>
        <Link
          href="/productos"
          className="text-sm font-medium text-bio-dark/60 hover:text-bio-green"
        >
          Volver a la tienda
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutFailurePage() {
  return (
    <Suspense>
      <FailureContent />
    </Suspense>
  );
}
