"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import { DynamicIcon } from "@/lib/icons";

type ValueProp = {
  id: string;
  icon: string;
  title: string;
  text: string;
  order: number;
  active: boolean;
};

export default function BeneficiosPage() {
  const [props, setProps] = useState<ValueProp[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/valueprops");
    if (res.ok) setProps(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(vp: ValueProp) {
    await fetch(`/api/admin/valueprops/${vp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !vp.active }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este beneficio?")) return;
    await fetch(`/api/admin/valueprops/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Beneficios del inicio</h1>
        <Link
          href="/admin/beneficios/new"
          className="inline-flex items-center gap-2 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={16} /> Agregar
        </Link>
      </div>

      <p className="text-sm text-slate-500">
        Son las tarjetas que aparecen debajo del banner en la página de inicio.
      </p>

      {loading ? (
        <p className="text-slate-400">Cargando…</p>
      ) : props.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          No hay beneficios. Hacé clic en &quot;Agregar&quot; para crear el primero.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Orden</th>
                <th className="px-4 py-3 text-left">Ícono</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {props.map((vp) => (
                <tr key={vp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">
                    <div className="flex items-center gap-1">
                      <GripVertical size={14} />
                      {vp.order}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bio-beige text-bio-green">
                      <DynamicIcon name={vp.icon} size={18} />
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{vp.title}</td>
                  <td className="max-w-xs px-4 py-3 text-slate-500 truncate">{vp.text}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(vp)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        vp.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {vp.active ? <Eye size={12} /> : <EyeOff size={12} />}
                      {vp.active ? "Visible" : "Oculto"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/beneficios/${vp.id}/edit`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(vp.id)}
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
