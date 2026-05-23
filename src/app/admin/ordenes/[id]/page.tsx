"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { formatPrice } from "@/lib/format";
import {
  CreditCard,
  Building2,
  Truck,
  MapPin,
  Package,
  User,
  Calendar,
  Tag,
  CheckCircle2,
} from "lucide-react";

type OrderItem = { productId: string; name: string; price: number; quantity: number };

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod: string;
  mercadoPagoId: string | null;
  paymentStatus: string | null;
  shippingCarrier: string | null;
  shippingMethod: string | null;
  shippingIsFree: boolean;
  shippingFreeReason: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = ["pending", "paid", "shipped", "completed", "cancelled", "failed"];
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pendiente",  cls: "bg-yellow-100 text-yellow-700" },
  paid:      { label: "Pagado",     cls: "bg-green-100 text-green-700" },
  shipped:   { label: "Enviado",    cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Completado", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado",  cls: "bg-slate-100 text-slate-500" },
  failed:    { label: "Fallido",    cls: "bg-red-100 text-red-600" },
};

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  mercadopago:   { label: "MercadoPago",          icon: <CreditCard size={14} />, cls: "text-[#009EE3]" },
  bank_transfer: { label: "Transferencia Bancaria", icon: <Building2 size={14} />,  cls: "text-bio-green" },
};

const CARRIER_LABELS: Record<string, string> = {
  andreani:       "Andreani",
  correoargentino: "Correo Argentino",
  me2:            "Mercado Envíos",
};

const METHOD_LABELS: Record<string, string> = {
  domicilio: "A domicilio",
  sucursal:  "Retiro en sucursal",
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  approved:    { label: "Aprobado",   cls: "text-green-600" },
  pending:     { label: "Pendiente",  cls: "text-yellow-600" },
  rejected:    { label: "Rechazado",  cls: "text-red-600" },
  in_process:  { label: "En proceso", cls: "text-blue-600" },
  refunded:    { label: "Devuelto",   cls: "text-slate-500" },
  cancelled:   { label: "Cancelado",  cls: "text-slate-500" },
};

function Row({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm border-b border-slate-50 last:border-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className={`text-right font-medium text-slate-700 ${className ?? ""}`}>{value}</span>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm space-y-1">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder({ ...data, items: data.items as OrderItem[] });
        setNewStatus(data.status);
      });
  }, [id]);

  async function updateStatus() {
    if (!order || newStatus === order.status) return;
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    if (res.ok) {
      setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success("Estado actualizado");
    } else {
      toast.error("Error al actualizar");
    }
  }

  if (!order) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  const st = STATUS_LABELS[order.status] ?? { label: order.status, cls: "bg-slate-100 text-slate-500" };
  const pm = PAYMENT_LABELS[order.paymentMethod] ?? { label: order.paymentMethod, icon: <CreditCard size={14} />, cls: "text-slate-600" };
  const ps = order.paymentStatus ? (PAYMENT_STATUS_LABELS[order.paymentStatus] ?? { label: order.paymentStatus, cls: "text-slate-500" }) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/ordenes" className="text-sm text-slate-400 hover:text-slate-600">← Órdenes</Link>
        <h1 className="text-xl font-bold text-slate-800">Orden #{order.id.slice(-8).toUpperCase()}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
        <span className="ml-auto text-xs text-slate-400">
          {new Date(order.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">

        {/* Columna izquierda: cliente + estado */}
        <div className="space-y-5 lg:col-span-1">

          <Card title="Cliente" icon={<User size={14} />}>
            <Row label="Nombre"    value={order.customerName} />
            <Row label="Email"     value={<a href={`mailto:${order.customerEmail}`} className="text-bio-green hover:underline">{order.customerEmail}</a>} />
            <Row label="Teléfono"  value={order.customerPhone || "—"} />
            <Row label="Dirección" value={order.customerAddress || "—"} />
          </Card>

          <Card title="Cambiar estado" icon={<Tag size={14} />}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={updateStatus}
              disabled={saving || newStatus === order.status}
              className="mt-2 w-full rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Actualizar estado"}
            </button>
          </Card>

        </div>

        {/* Columna derecha: pago + envío + productos */}
        <div className="space-y-5 lg:col-span-2">

          {/* Pago y Envío en fila */}
          <div className="grid gap-5 sm:grid-cols-2">

            <Card title="Pago" icon={<CreditCard size={14} />}>
              <Row
                label="Método"
                value={
                  <span className={`flex items-center justify-end gap-1.5 ${pm.cls}`}>
                    {pm.icon} {pm.label}
                  </span>
                }
              />
              {ps && (
                <Row label="Estado MP" value={<span className={ps.cls}>{ps.label}</span>} />
              )}
              {order.mercadoPagoId && (
                <Row label="MP ID" value={<span className="font-mono text-xs">{order.mercadoPagoId}</span>} />
              )}
              {order.discount > 0 && (
                <Row
                  label="Descuento"
                  value={`− ${formatPrice(order.discount)}`}
                  className="text-bio-green"
                />
              )}
              <Row
                label="Fecha"
                value={new Date(order.createdAt).toLocaleDateString("es-AR")}
              />
            </Card>

            <Card title="Envío" icon={<Truck size={14} />}>
              <Row
                label="Carrier"
                value={order.shippingCarrier ? (CARRIER_LABELS[order.shippingCarrier] ?? order.shippingCarrier) : "—"}
              />
              <Row
                label="Modalidad"
                value={order.shippingMethod ? (METHOD_LABELS[order.shippingMethod] ?? order.shippingMethod) : "—"}
              />
              <Row
                label="Costo"
                value={
                  order.shippingIsFree
                    ? <span className="flex items-center justify-end gap-1 text-bio-green"><CheckCircle2 size={13} /> Gratis</span>
                    : formatPrice(order.shipping)
                }
              />
              {order.shippingFreeReason && (
                <Row label="Motivo" value={order.shippingFreeReason} className="text-bio-green text-xs" />
              )}
              {order.customerAddress && (
                <Row
                  label="Destino"
                  value={<span className="flex items-center justify-end gap-1"><MapPin size={12} />{order.customerAddress}</span>}
                  className="text-xs"
                />
              )}
            </Card>

          </div>

          {/* Productos + totales */}
          <Card title="Productos" icon={<Package size={14} />}>
            <table className="w-full text-sm">
              <thead className="border-b text-xs text-slate-400">
                <tr>
                  <th className="pb-2 text-left font-medium">Producto</th>
                  <th className="pb-2 text-right font-medium">Precio u.</th>
                  <th className="pb-2 text-right font-medium">Cant.</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item, i) => (
                  <tr key={i} className="text-slate-600">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-right text-slate-400">{formatPrice(item.price)}</td>
                    <td className="py-2 text-right text-slate-400">{item.quantity}</td>
                    <td className="py-2 text-right font-medium text-slate-700">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Envío</span>
                <span>{order.shippingIsFree || order.shipping === 0 ? <span className="text-bio-green font-semibold">Gratis</span> : formatPrice(order.shipping)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between font-semibold text-bio-green">
                  <span>Descuento ({pm.label})</span>
                  <span>− {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold text-slate-800">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card title="Trazabilidad" icon={<Calendar size={14} />}>
            <Row label="ID completo" value={<span className="font-mono text-xs">{order.id}</span>} />
            <Row label="Creada"      value={new Date(order.createdAt).toLocaleString("es-AR")} />
            <Row label="Actualizada" value={new Date(order.updatedAt).toLocaleString("es-AR")} />
          </Card>

        </div>
      </div>
    </div>
  );
}
