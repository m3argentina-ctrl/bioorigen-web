"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoProveedorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    paymentTerms: "",
    active: true,
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/admin/proveedores");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/proveedores" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Nuevo proveedor</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Cond. de pago</label>
            <input
              type="text"
              placeholder="ej: 30 días neto"
              value={form.paymentTerms}
              onChange={(e) => set("paymentTerms", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Notas internas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-bio-green focus:outline-none focus:ring-1 focus:ring-bio-green"
            />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-bio-green focus:ring-bio-green"
            />
            <label htmlFor="active" className="text-sm font-medium text-slate-700">Proveedor activo</label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-bio-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-bio-green/90 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Guardando..." : "Guardar proveedor"}
          </button>
          <Link
            href="/admin/proveedores"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
