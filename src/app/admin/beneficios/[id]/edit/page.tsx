"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ICON_OPTIONS, DynamicIcon } from "@/lib/icons";

export default function EditBeneficioPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    icon: "Sprout",
    title: "",
    text: "",
    order: 0,
    active: true,
  });

  useEffect(() => {
    fetch(`/api/admin/valueprops/${id}`)
      .then((r) => r.json())
      .then((data) => setForm({
        icon: data.icon,
        title: data.title,
        text: data.text,
        order: data.order,
        active: data.active,
      }));
  }, [id]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/valueprops/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, order: Number(form.order) }),
    });
    if (res.ok) {
      router.push("/admin/beneficios");
    } else {
      const data = await res.json();
      setError(data.error ? JSON.stringify(data.error) : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/beneficios" className="rounded p-1 text-slate-400 hover:text-slate-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar beneficio</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        {/* Icon picker */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Ícono</label>
          <div className="grid grid-cols-7 gap-2">
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bio-green"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            required
            rows={3}
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bio-green"
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
              Visible en el inicio
            </label>
          </div>
        </div>

        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/beneficios"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
