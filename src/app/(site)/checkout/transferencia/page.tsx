"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Copy, Check, Building2 } from "lucide-react";
import { formatPrice } from "@/lib/format";

type BankDetails = {
  bankName: string;
  bankHolder: string;
  bankCbu: string;
  bankAlias: string;
  bankNote: string;
  discount: number;
  total: number;
};

type OrderData = {
  id: string;
  customerName: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-bio-green transition-colors hover:bg-bio-green/10"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function Row({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-slate-500">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-semibold text-bio-dark">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

function TransferenciaContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [bank, setBank] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/orders/${orderId}`).then((r) => r.json()),
      fetch("/api/payment-config").then((r) => r.json()),
    ])
      .then(([orderData, payData]) => {
        setOrder(orderData);
        setBank(payData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  if (!order || !bank) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-500">No se encontró la orden.</p>
        <Link href="/" className="mt-4 inline-block text-bio-green underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const ref = order.id.slice(-8).toUpperCase();

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bio-green/10">
          <CheckCircle2 size={36} className="text-bio-green" />
        </div>
        <h1 className="text-2xl font-bold text-bio-dark">¡Pedido recibido!</h1>
        <p className="mt-1 text-slate-500">
          Hola <strong>{order.customerName}</strong>, completá la transferencia para confirmar tu
          pedido.
        </p>
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.shipping > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>Envío</span>
            <span>{formatPrice(order.shipping)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="flex justify-between font-semibold text-bio-green">
            <span>Descuento por transferencia</span>
            <span>− {formatPrice(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-bio-dark">
          <span>Total a transferir</span>
          <span className="text-bio-green">{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-bio-green/30 bg-bio-green/5 p-5">
        <div className="flex items-center gap-2 font-semibold text-bio-dark">
          <Building2 size={18} className="text-bio-green" />
          Datos para la transferencia
        </div>
        <div className="space-y-3 text-sm">
          {bank.bankName && <Row label="Banco" value={bank.bankName} />}
          {bank.bankHolder && <Row label="Titular" value={bank.bankHolder} />}
          {bank.bankCbu && <Row label="CBU" value={bank.bankCbu} copyable />}
          {bank.bankAlias && <Row label="Alias" value={bank.bankAlias} copyable />}
          <Row label="Referencia" value={`ORDEN-${ref}`} copyable />
          <Row label="Monto exacto" value={formatPrice(order.total)} />
        </div>
        {bank.bankNote && (
          <p className="rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">{bank.bankNote}</p>
        )}
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
        Una vez acreditada la transferencia te contactaremos para coordinar el envío.
      </p>

      <Link
        href="/productos"
        className="block w-full rounded-xl border border-bio-green py-3 text-center text-sm font-semibold text-bio-green transition-colors hover:bg-bio-green hover:text-white"
      >
        Seguir comprando
      </Link>
    </main>
  );
}

export default function TransferenciaPage() {
  return (
    <Suspense>
      <TransferenciaContent />
    </Suspense>
  );
}
