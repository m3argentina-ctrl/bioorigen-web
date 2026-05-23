"use client";

import { useEffect, useState } from "react";
import { Save, CreditCard, Building2, Smartphone } from "lucide-react";

type PaymentConfig = {
  bankTransferEnabled: boolean;
  bankTransferDiscount: number;
  bankName: string;
  bankHolder: string;
  bankCbu: string;
  bankAlias: string;
  bankNote: string;
  openpayEnabled: boolean;
};

const EMPTY: PaymentConfig = {
  bankTransferEnabled: false,
  bankTransferDiscount: 0,
  bankName: "",
  bankHolder: "",
  bankCbu: "",
  bankAlias: "",
  bankNote: "",
  openpayEnabled: false,
};

export default function PagosAdminPage() {
  const [form, setForm] = useState<PaymentConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/payment-config")
      .then((r) => r.json())
      .then((data) => { setForm(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : type === "number" ? Number(value) : value,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payment-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      setForm(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Medios de pago</h1>

      {/* MercadoPago — solo informativo */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#009EE3]/10">
            <CreditCard size={20} className="text-[#009EE3]" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">MercadoPago</p>
            <p className="text-xs text-slate-400">Tarjetas de crédito, débito y más · Siempre activo</p>
          </div>
          <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            Activo
          </span>
        </div>
      </div>

      {/* Transferencia bancaria */}
      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bio-green/10">
            <Building2 size={20} className="text-bio-green" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">Transferencia bancaria</p>
            <p className="text-xs text-slate-400">El cliente transfiere y coordina la entrega</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <span className="text-sm text-slate-600">Habilitar</span>
            <div className="relative">
              <input
                type="checkbox"
                name="bankTransferEnabled"
                checked={form.bankTransferEnabled}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  form.bankTransferEnabled ? "bg-bio-green" : "bg-slate-300"
                }`}
              />
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form.bankTransferEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>
        </div>

        {form.bankTransferEnabled && (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            {/* Descuento */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Descuento por transferencia (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="bankTransferDiscount"
                  value={form.bankTransferDiscount}
                  onChange={handleChange}
                  min={0}
                  max={50}
                  className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
                />
                <span className="text-sm text-slate-500">
                  {form.bankTransferDiscount > 0
                    ? `El cliente ahorra un ${form.bankTransferDiscount}% sobre el subtotal`
                    : "Sin descuento adicional"}
                </span>
              </div>
            </div>

            {/* Datos bancarios */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Banco" name="bankName" value={form.bankName} onChange={handleChange} placeholder="Ej: Banco Galicia" />
              <Field label="Titular de la cuenta" name="bankHolder" value={form.bankHolder} onChange={handleChange} placeholder="Ej: Bio Origen SRL" />
              <Field label="CBU" name="bankCbu" value={form.bankCbu} onChange={handleChange} placeholder="22 dígitos" />
              <Field label="Alias" name="bankAlias" value={form.bankAlias} onChange={handleChange} placeholder="Ej: BIORIGEN.PAGOS" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nota adicional <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                name="bankNote"
                value={form.bankNote}
                onChange={handleChange}
                rows={2}
                placeholder="Ej: Enviá el comprobante por WhatsApp al +54 9 11 1234-5678"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green resize-none"
              />
            </div>
          </div>
        )}

        {/* OpenPay */}
        <div className="space-y-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0066ff]/10">
              <Smartphone size={18} className="text-[#0066ff]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">OpenPay Argentina</p>
              <p className="text-xs text-slate-400">Tarjeta de crédito/débito · Pago directo en el sitio</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-sm text-slate-600">Habilitar</span>
              <div className="relative">
                <input type="checkbox" name="openpayEnabled" checked={form.openpayEnabled} onChange={handleChange} className="sr-only" />
                <div className={`h-6 w-11 rounded-full transition-colors ${form.openpayEnabled ? "bg-[#0066ff]" : "bg-slate-300"}`} />
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.openpayEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>
          {form.openpayEnabled && (
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Variables de entorno requeridas en <code>.env.local</code>:</p>
              <p><code>OPENPAY_AR_CLIENT_ID</code> — Cliente Id del dashboard</p>
              <p><code>OPENPAY_AR_CLIENT_SECRET</code> — Cliente Secret del dashboard</p>
              <p><code>OPENPAY_AR_SANDBOX=true</code> — Modo prueba (cambiar a <code>false</code> en producción)</p>
            </div>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-bio-green">¡Guardado!</span>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-bio-green px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, name, value, onChange, placeholder,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green"
      />
    </label>
  );
}
