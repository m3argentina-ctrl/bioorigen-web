"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Truck, Package } from "lucide-react";
import Image from "next/image";

type OrderData = {
  id: string;
  status: string;
  customerName: string;
  shippingAddress: string;
  items: Array<{ name: string; quantity: number }>;
  trackingNumber: string | null;
  carrier: string | null;
  supplierName: string;
};

export default function ConfirmarProveedorPage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ trackingNumber: "", carrier: "" });

  useEffect(() => {
    fetch(`/api/supplier/confirm/${token}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setOrder(data);
        if (data.trackingNumber) {
          setForm({ trackingNumber: data.trackingNumber, carrier: data.carrier ?? "" });
          if (data.status === "shipped" || data.status === "delivered" || data.status === "paid") {
            setSubmitted(true);
          }
        }
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/supplier/confirm/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al confirmar. Por favor intentá de nuevo.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bio-beige">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bio-beige p-6 text-center">
        <p className="text-lg font-semibold text-slate-700">Link no válido</p>
        <p className="mt-2 text-sm text-slate-500">El token de confirmación no existe o ya fue procesado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bio-beige py-12 px-4">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Image src="/logo.svg" alt="Bio Origen" width={140} height={45} className="mx-auto mb-4" unoptimized />
          <h1 className="text-2xl font-bold text-slate-800">Confirmación de envío</h1>
          <p className="mt-1 text-sm text-slate-500">Proveedor: {order?.supplierName}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-md">
          {/* Datos de envío */}
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-700">
              <Package size={18} className="text-bio-green" />
              Datos del pedido
            </h2>
            <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
              <p><span className="font-medium text-slate-600">Destinatario:</span> {order?.customerName}</p>
              <p>
                <span className="font-medium text-slate-600">Dirección:</span><br/>
                <span className="text-slate-700 whitespace-pre-line">{order?.shippingAddress}</span>
              </p>
            </div>
          </div>

          {/* Productos */}
          <div className="mb-6">
            <h2 className="mb-3 text-base font-semibold text-slate-700">Productos a enviar</h2>
            <ul className="space-y-2">
              {order?.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm">
                  <span className="text-slate-800">{item.name}</span>
                  <span className="ml-4 rounded-full bg-bio-green px-2.5 py-0.5 text-xs font-bold text-white">
                    × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Formulario o confirmación */}
          {submitted ? (
            <div className="rounded-xl bg-green-50 p-5 text-center">
              <CheckCircle size={36} className="mx-auto mb-3 text-green-500" />
              <p className="font-semibold text-green-700">¡Envío confirmado!</p>
              <p className="mt-1 text-sm text-green-600">
                Transportista: <strong>{form.carrier}</strong><br/>
                Tracking: <strong className="font-mono">{form.trackingNumber}</strong>
              </p>
              <p className="mt-3 text-xs text-green-600">
                Ya notificamos al cliente con los datos de seguimiento. ¡Gracias!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <Truck size={18} className="text-bio-green" />
                Ingresá los datos de envío
              </h2>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Transportista *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Andreani, OCA, Correo Argentino..."
                  value={form.carrier}
                  onChange={(e) => setForm((p) => ({ ...p, carrier: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Número de seguimiento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: AN00123456789"
                  value={form.trackingNumber}
                  onChange={(e) => setForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-bio-green py-3 text-base font-semibold text-white hover:bg-bio-green/90 disabled:opacity-50"
              >
                {submitting ? "Confirmando..." : "Confirmar envío"}
              </button>

              <p className="text-center text-xs text-slate-400">
                Al confirmar, el cliente recibirá automáticamente un email con el número de seguimiento.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
