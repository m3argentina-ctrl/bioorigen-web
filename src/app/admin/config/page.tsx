"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const FIELDS = [
  { key: "contact_email", label: "Email de contacto", type: "email" },
  { key: "contact_phone", label: "Teléfono", type: "text" },
  { key: "whatsapp", label: "WhatsApp", type: "text" },
  { key: "instagram", label: "URL Instagram", type: "url" },
  { key: "facebook", label: "URL Facebook", type: "url" },
  { key: "shipping_cost", label: "Costo de envío (ARS)", type: "number" },
  { key: "free_shipping_from", label: "Envío gratis desde (ARS)", type: "number" },
];

export default function ConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setMaintenance(data.maintenance_mode === "true");
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, maintenance_mode: String(maintenance) }),
    });
    setSaving(false);
    if (res.ok) toast.success("Configuración guardada");
    else toast.error("Error al guardar");
  }

  if (loading) return <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Toaster position="top-right" />
      <h1 className="text-xl font-bold text-slate-800">Configuración del sitio</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        {FIELDS.map(({ key, label, type }) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            <input
              type={type}
              value={config[key] ?? ""}
              onChange={(e) => setConfig((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
            />
          </label>
        ))}

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
            className="h-4 w-4 accent-bio-orange"
          />
          <div>
            <p className="text-sm font-medium text-slate-700">Modo mantenimiento</p>
            <p className="text-xs text-slate-400">Oculta el sitio al público</p>
          </div>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-bio-green py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </form>
    </div>
  );
}
