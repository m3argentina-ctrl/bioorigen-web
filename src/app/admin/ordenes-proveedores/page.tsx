"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { ExternalLink, ChevronDown } from "lucide-react";
import Link from "next/link";

type SupplierOrderRow = {
  id: string;
  orderId: string;
  status: string;
  supplierCost: number;
  customerName: string;
  trackingNumber: string | null;
  carrier: string | null;
  notifiedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  paidAt: string | null;
  createdAt: string;
  supplier: { id: string; name: string; email: string };
  order: { id: string; total: number; customerName: string };
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  notified: "Notificado",
  shipped: "Enviado",
  delivered: "Entregado",
  paid: "Pagado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  notified: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  paid: "bg-teal-100 text-teal-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function OrdenesProveedoresPage() {
  const [orders, setOrders] = useState<SupplierOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load(status = "") {
    setLoading(true);
    const qs = status ? `?status=${status}` : "";
    const res = await fetch(`/api/admin/supplier-orders${qs}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
    }
    setLoading(false);
  }

  useEffect(() => { load(filterStatus); }, [filterStatus]);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/supplier-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    }
    setUpdatingId(null);
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Órdenes de proveedores</h1>
          <p className="mt-1 text-sm text-slate-500">Seguimiento de envíos dropshipping</p>
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">Cargando...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-400">No hay órdenes para mostrar</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Orden / Proveedor</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Tracking</th>
                <th className="px-4 py-3 text-right">Costo prov.</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((so) => (
                <tr key={so.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/ordenes/${so.orderId}`}
                      className="flex items-center gap-1 font-mono text-xs font-medium text-bio-green hover:underline"
                    >
                      #{so.orderId.slice(-8).toUpperCase()}
                      <ExternalLink size={11} />
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">{so.supplier.name}</p>
                    <p className="text-xs text-slate-400">{new Date(so.createdAt).toLocaleDateString("es-AR")}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{so.customerName}</td>
                  <td className="px-4 py-3">
                    {so.trackingNumber ? (
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-800">{so.trackingNumber}</p>
                        <p className="text-xs text-slate-400">{so.carrier}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sin tracking</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {formatPrice(so.supplierCost)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[so.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {STATUS_LABELS[so.status] ?? so.status}
                    </span>
                    {so.shippedAt && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(so.shippedAt).toLocaleDateString("es-AR")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {so.status === "shipped" && (
                      <button
                        type="button"
                        disabled={updatingId === so.id}
                        onClick={() => updateStatus(so.id, "delivered")}
                        className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Marcar entregado
                      </button>
                    )}
                    {so.status === "delivered" && (
                      <button
                        type="button"
                        disabled={updatingId === so.id}
                        onClick={() => updateStatus(so.id, "paid")}
                        className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        Marcar pagado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
