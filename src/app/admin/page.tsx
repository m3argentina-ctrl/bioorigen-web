"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from "lucide-react";

const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

type Stats = {
  monthRevenue: number;
  monthCount: number;
  avgTicket: number;
  salesByDay: { date: string; total: number }[];
  topProducts: { id: string; name: string; qty: number; revenue: number }[];
  lowStockProducts: { id: string; name: string; stock: number; category: string }[];
  recentOrders: {
    id: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Pagado", cls: "bg-green-100 text-green-700" },
  shipped: { label: "Enviado", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Completado", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado", cls: "bg-slate-100 text-slate-500" },
  failed: { label: "Fallido", cls: "bg-red-100 text-red-600" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(
          "monthRevenue" in data
            ? data
            : { monthRevenue: 0, monthCount: 0, avgTicket: 0, salesByDay: [], topProducts: [], lowStockProducts: [], recentOrders: [] },
        );
      })
      .catch(() =>
        setStats({ monthRevenue: 0, monthCount: 0, avgTicket: 0, salesByDay: [], topProducts: [], lowStockProducts: [], recentOrders: [] }),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  if (!stats) return <p className="text-slate-500">No se pudieron cargar las estadísticas.</p>;

  const kpis = [
    {
      icon: TrendingUp,
      label: "Ventas del mes",
      value: formatPrice(stats.monthRevenue),
      cls: "bg-green-50 text-green-600",
    },
    {
      icon: ShoppingCart,
      label: "Órdenes del mes",
      value: stats.monthCount.toString(),
      cls: "bg-blue-50 text-blue-600",
    },
    {
      icon: TrendingUp,
      label: "Ticket promedio",
      value: formatPrice(stats.avgTicket),
      cls: "bg-purple-50 text-purple-600",
    },
    {
      icon: AlertTriangle,
      label: "Stock bajo",
      value: stats.lowStockProducts.length.toString(),
      cls: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value, cls }) => (
          <div key={label} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
                <Icon size={20} />
              </span>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-800">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico ventas */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Ventas últimos 30 días</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.salesByDay}>
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)}
                tick={{ fontSize: 11 }}
              />
              <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatPrice(v as number)} labelFormatter={(l) => String(l)} />
              <Line type="monotone" dataKey="total" stroke="#4A7C59" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top productos */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Top 5 productos</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Sin ventas aún.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-right">Unidades</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.topProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-slate-700">{p.name}</td>
                    <td className="py-2 text-right text-slate-500">{p.qty}</td>
                    <td className="py-2 text-right font-medium text-slate-700">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stock bajo */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Package size={15} />
            Stock bajo (&lt; 10 unidades)
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Todo en stock.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{p.name}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                    {p.stock === 0 ? "Sin stock" : `${p.stock} u.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Órdenes recientes */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Órdenes recientes</h2>
          <Link href="/admin/ordenes" className="text-xs font-medium text-bio-green hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-slate-500">
                <th className="pb-2">ID</th>
                <th className="pb-2">Cliente</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.recentOrders.map((o) => {
                const st = STATUS_LABELS[o.status] ?? { label: o.status, cls: "bg-slate-100 text-slate-500" };
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-2 font-mono text-xs text-slate-400">{o.id.slice(-8)}</td>
                    <td className="py-2 text-slate-700">{o.customerName}</td>
                    <td className="py-2 text-right font-medium text-slate-700">{formatPrice(o.total)}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="py-2 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
