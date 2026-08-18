"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ICON_OPTIONS, DynamicIcon } from "@/lib/icons";

export default function NewTopBarItemPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ icon: "CreditCard", text: "", order: 0, active: true });

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/topbar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, order: Number(form.order) }),
    });
    if (res.ok) router.push("/admin/topbar");
    else setSaving(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/topbar" className="rounded p-1 text-slate-400 hover:text-slate-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo ítem barra superior</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Ícono</label>
          <div className="grid grid-cols-8 gap-2">
            {ICON_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => set("icon", name)}
                title={name}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors ${
                  form.icon === name
                    ? "border-bio-green bg-bio-green/10 text-bio-green"
                    : "border-slate-200 text-slate-500 hover:border-slate-400"
                }`}
              >
                <DynamicIcon name={name} size={18} />
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">Seleccionado: {form.icon}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Texto</label>
          <input
            type="text"
            required
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bio-green"
            placeholder="Ej: 3 cuotas sin interés"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Orden</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => set("order", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bio-green"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-bio-green focus:ring-bio-green"
              />
              Visible
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/topbar" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancelar
          </Link>
          <button type="submit" disabled={saving} className="rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "Guardando…" : "Crear ítem"}
          </button>
        </div>
      </form>
    </div>
  );
}
