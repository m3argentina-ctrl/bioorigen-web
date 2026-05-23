"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

const RESULTS: Record<
  string,
  { icon: string; title: string; text: string }
> = {
  success: {
    icon: "✅",
    title: "¡Gracias por tu compra!",
    text: "Tu pago fue aprobado. Te enviaremos un email con los detalles del pedido.",
  },
  pending: {
    icon: "⏳",
    title: "Pago pendiente",
    text: "Tu pago está siendo procesado. Te avisaremos cuando se confirme.",
  },
  failure: {
    icon: "❌",
    title: "El pago no se completó",
    text: "Hubo un problema con el pago. Podés intentar nuevamente.",
  },
};

export default function CheckoutResultPage({
  params,
}: {
  params: { status: string };
}) {
  const { clear } = useCart();
  const result = RESULTS[params.status] ?? RESULTS.failure;
  const isSuccess = params.status === "success";

  useEffect(() => {
    if (isSuccess) clear();
  }, [isSuccess, clear]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="text-6xl">{result.icon}</span>
      <h1 className="mt-4 text-2xl font-extrabold text-bio-dark">
        {result.title}
      </h1>
      <p className="mt-2 text-bio-dark/70">{result.text}</p>
      <Link
        href="/productos"
        className="mt-6 inline-block rounded-full bg-bio-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-bio-green-dark"
      >
        Volver a la tienda
      </Link>
    </div>
  );
}
