"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { DynamicIcon } from "@/lib/icons";
import toast, { Toaster } from "react-hot-toast";

type Item = { id: string; icon: string; text: string; active: boolean; order: number };

export default function TopBarAdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/topbar");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(item: Item) {
    const res = await fetch(`/api/admin/topbar/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    if (res.ok) { load(); toast.success(item.active ? "Ítem ocultado" : "Ítem visible"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este ítem?")) return;
    await fetch(`/api/admin/topbar/${id}`, { method: "DELETE" });
    load();
    toast.success("Ítem eliminado");
  }

  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Barra superior</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ítems de la barra verde en la parte alta del sitio (ej: "3 cuotas sin interés").
            El envío gratis, descuento y teléfono se gestionan en Configuración → Pagos / Config general.
          </p>
        </div>
        <Link
          href="/admin/topbar/nuevo"
          className="inline-flex items-center gap-2 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> Agregar
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-400">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          No hay ítems. Hacé clic en &quot;Agregar&quot; para crear el primero.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Ícono</th>
                <th className="px-4 py-3 text-left">Texto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{item.order}</td>
                  <td className="px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bio-green/10 text-bio-green">
                      <DynamicIcon name={item.icon} size={18} />
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.text}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {item.active ? "Visible" : "Oculto"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/topbar/${item.id}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
