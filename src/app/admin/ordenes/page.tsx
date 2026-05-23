"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FileDown, Trash2, RefreshCw, X, CheckCheck, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/format";

const EXPORT_URL = "/api/admin/orders/export";

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
};

const STATUS_OPTIONS = ["all", "pending", "paid", "shipped", "completed", "cancelled", "failed"];
const BULK_STATUS_OPTIONS = STATUS_OPTIONS.filter((s) => s !== "all");

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "Pendiente",  cls: "bg-yellow-100 text-yellow-700" },
  paid:      { label: "Pagado",     cls: "bg-green-100 text-green-700" },
  shipped:   { label: "Enviado",    cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Completado", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado",  cls: "bg-slate-100 text-slate-500" },
  failed:    { label: "Fallido",    cls: "bg-red-100 text-red-600" },
};

const PAYMENT_LABELS: Record<string, string> = {
  mercadopago:   "MP",
  bank_transfer: "Transf.",
};

export default function OrdenesAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Selección
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Acciones bulk
  const [bulkStatus, setBulkStatus] = useState("paid");
  const [working, setWorking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false); setSelected(new Set()); });
  }, [status, search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Selección
  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  // Cambiar estado en masa
  async function applyBulkStatus() {
    if (!someSelected) return;
    setWorking(true);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    setWorking(false);
    if (res.ok) loadOrders();
  }

  // Eliminar en masa
  async function applyBulkDelete() {
    if (!someSelected) return;
    setWorking(true);
    const res = await fetch("/api/admin/orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setWorking(false);
    setConfirmDelete(false);
    if (res.ok) loadOrders();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Órdenes</h1>
        <a
          href={EXPORT_URL}
          download
          className="flex items-center gap-2 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <FileDown size={16} />
          Descargar Excel
        </a>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente o email..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "Todos los estados" : (STATUS_LABELS[s]?.label ?? s)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-bio-green accent-bio-green cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Pago</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => {
                const st = STATUS_LABELS[o.status] ?? { label: o.status, cls: "bg-slate-100 text-slate-500" };
                const isSelected = selected.has(o.id);
                return (
                  <tr
                    key={o.id}
                    className={`transition-colors ${isSelected ? "bg-bio-green/5" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(o.id)}
                        className="h-4 w-4 rounded border-slate-300 accent-bio-green cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      #{o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{o.customerName}</p>
                      <p className="text-xs text-slate-400">{o.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {o.paymentMethod ? (PAYMENT_LABELS[o.paymentMethod] ?? o.paymentMethod) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/ordenes/${o.id}`}
                        className="text-xs font-medium text-bio-green hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">Sin órdenes.</p>
          )}
        </div>
      )}

      {/* Barra de acciones bulk — aparece cuando hay selección */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 shadow-2xl text-white">

            {/* Contador */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
              <CheckCheck size={16} className="text-bio-green" />
              <span className="text-sm font-semibold whitespace-nowrap">
                {selected.size} {selected.size === 1 ? "orden" : "órdenes"}
              </span>
            </div>

            {/* Cambiar estado */}
            {!confirmDelete && (
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="text-slate-400 shrink-0" />
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs text-white outline-none border border-slate-700 focus:border-bio-green"
                >
                  {BULK_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyBulkStatus}
                  disabled={working}
                  className="rounded-lg bg-bio-green px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>
            )}

            {/* Separador */}
            {!confirmDelete && <div className="h-5 w-px bg-slate-700" />}

            {/* Eliminar */}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={working}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                Eliminar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                <span className="text-xs text-amber-300 whitespace-nowrap">
                  ¿Eliminar {selected.size} {selected.size === 1 ? "orden" : "órdenes"}?
                </span>
                <button
                  type="button"
                  onClick={applyBulkDelete}
                  disabled={working}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {working ? "…" : "Confirmar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Deseleccionar */}
            <div className="h-5 w-px bg-slate-700" />
            <button
              type="button"
              onClick={() => { setSelected(new Set()); setConfirmDelete(false); }}
              className="rounded-full p-1 text-slate-400 hover:text-white transition-colors"
              title="Deseleccionar todo"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
