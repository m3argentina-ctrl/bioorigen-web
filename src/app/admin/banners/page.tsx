"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  bgColor: string;
  order: number;
  active: boolean;
};

export default function BannersAdminPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/banners");
    const data = await res.json();
    setBanners(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(banner: Banner) {
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !banner.active }),
    });
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)),
    );
  }

  async function deleteBanner(id: string) {
    if (!confirm("¿Eliminar este banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== id));
    toast.success("Banner eliminado");
  }

  async function moveOrder(banner: Banner, direction: "up" | "down") {
    const idx = banners.findIndex((b) => b.id === banner.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;

    const other = banners[swapIdx];
    await Promise.all([
      fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: other.order }),
      }),
      fetch(`/api/admin/banners/${other.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: banner.order }),
      }),
    ]);
    load();
  }

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Banners</h1>
        <Link
          href="/admin/banners/new"
          className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> Nuevo Banner
        </Link>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          No hay banners. Creá el primero.
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Vista previa</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {banners.map((banner, idx) => (
                <tr key={banner.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="w-6 text-center text-xs font-mono text-slate-400">{banner.order}</span>
                      <div className="flex flex-col">
                        <button type="button" onClick={() => moveOrder(banner, "up")} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                          <ChevronUp size={14} />
                        </button>
                        <button type="button" onClick={() => moveOrder(banner, "down")} disabled={idx === banners.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="h-10 w-20 rounded"
                      style={{ backgroundColor: banner.bgColor }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{banner.title}</p>
                    {banner.subtitle && <p className="text-xs text-slate-400">{banner.subtitle}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(banner)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        banner.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {banner.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/banners/${banner.id}/edit`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteBanner(banner.id)}
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
