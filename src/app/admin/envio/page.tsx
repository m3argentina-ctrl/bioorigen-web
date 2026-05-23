"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Truck, Save } from "lucide-react";
import { formatPrice } from "@/lib/format";
import toast, { Toaster } from "react-hot-toast";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ShippingConfig = {
  id?: string;
  andreaniEnabled: boolean; andreaniDomicilio: number; andreaniSucursal: number;
  andreaniDays: string; andreaniInsurance: boolean;
  correoEnabled: boolean; correoDomicilio: number; correoSucursal: number;
  correoDays: string; correoInsurance: boolean;
};

type FreeRule = {
  id: string; enabled: boolean; name: string; type: string;
  minimumAmount: number | null; campaignName: string | null;
  startDate: string | null; endDate: string | null;
  freeZipCodes: string[]; productIds: string[]; categories: string[];
  couponCode: string | null; applyAndreani: boolean; applyCorreo: boolean;
  priority: number;
};

const TYPE_LABELS: Record<string, string> = {
  minimum_amount: "Por monto mínimo",
  always:         "Siempre gratis",
  never:          "Nunca gratis",
  by_date:        "Por fechas (campaña)",
  by_location:    "Por código postal",
  by_product:     "Por producto",
  by_category:    "Por categoría",
  by_coupon:      "Por cupón",
};

const EMPTY_RULE: Omit<FreeRule, "id"> = {
  enabled: true, name: "", type: "minimum_amount",
  minimumAmount: null, campaignName: null,
  startDate: null, endDate: null,
  freeZipCodes: [], productIds: [], categories: [],
  couponCode: null, applyAndreani: true, applyCorreo: true, priority: 0,
};

const DEFAULT_CONFIG: ShippingConfig = {
  andreaniEnabled: true, andreaniDomicilio: 13000, andreaniSucursal: 11000,
  andreaniDays: "2-4 días", andreaniInsurance: true,
  correoEnabled: true, correoDomicilio: 19000, correoSucursal: 16000,
  correoDays: "6-10 días", correoInsurance: false,
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EnvioAdminPage() {
  const [tab, setTab] = useState<"carriers" | "reglas">("reglas");
  const [config, setConfig] = useState<ShippingConfig>(DEFAULT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [rules, setRules] = useState<FreeRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<FreeRule | null>(null);
  const [ruleForm, setRuleForm] = useState<Omit<FreeRule, "id">>(EMPTY_RULE);
  const [savingRule, setSavingRule] = useState(false);

  // Cargar config de carriers
  useEffect(() => {
    fetch("/api/admin/shipping/config")
      .then((r) => r.json())
      .then((data) => { if (data) setConfig(data); });
  }, []);

  // Cargar reglas
  function loadRules() {
    setLoadingRules(true);
    fetch("/api/admin/shipping/free")
      .then((r) => r.json())
      .then((data) => { setRules(Array.isArray(data) ? data : []); setLoadingRules(false); });
  }
  useEffect(() => { loadRules(); }, []);

  // Guardar config carriers
  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    const res = await fetch("/api/admin/shipping/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSavingConfig(false);
    if (res.ok) toast.success("Configuración guardada");
    else toast.error("Error al guardar");
  }

  // Toggle activo/inactivo de regla
  async function toggleRule(rule: FreeRule) {
    await fetch(`/api/admin/shipping/free/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    loadRules();
  }

  // Eliminar regla
  async function deleteRule(id: string) {
    if (!confirm("¿Eliminar esta regla?")) return;
    await fetch(`/api/admin/shipping/free/${id}`, { method: "DELETE" });
    loadRules();
  }

  // Abrir formulario para nueva regla o edición
  function openForm(rule?: FreeRule) {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({ ...rule });
    } else {
      setEditingRule(null);
      setRuleForm(EMPTY_RULE);
    }
    setShowForm(true);
  }

  // Guardar regla
  async function saveRule(e: React.FormEvent) {
    e.preventDefault();
    setSavingRule(true);
    const url = editingRule ? `/api/admin/shipping/free/${editingRule.id}` : "/api/admin/shipping/free";
    const method = editingRule ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ruleForm),
    });
    setSavingRule(false);
    if (res.ok) {
      toast.success(editingRule ? "Regla actualizada" : "Regla creada");
      setShowForm(false);
      loadRules();
    } else {
      toast.error("Error al guardar la regla");
    }
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <Truck size={22} className="text-bio-green" />
        <h1 className="text-2xl font-bold text-slate-900">Configuración de envíos</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["reglas", "carriers"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {t === "reglas" ? "Envío gratis" : "Precios de carriers"}
          </button>
        ))}
      </div>

      {/* ── TAB: Reglas de envío gratis ── */}
      {tab === "reglas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Las reglas se evalúan por prioridad (mayor número = mayor prioridad). La primera que aplica gana.
            </p>
            <button type="button" onClick={() => openForm()}
              className="inline-flex items-center gap-2 rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              <Plus size={15} /> Nueva regla
            </button>
          </div>

          {/* Formulario inline */}
          {showForm && (
            <form onSubmit={saveRule} className="rounded-xl border-2 border-bio-green/30 bg-bio-green/5 p-5 space-y-4">
              <h3 className="font-bold text-slate-800">{editingRule ? "Editar regla" : "Nueva regla"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Inp label="Nombre de la regla *" required value={ruleForm.name}
                  onChange={(v) => setRuleForm((p) => ({ ...p, name: v }))} placeholder="Ej: Envío gratis > $90.000" />
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tipo *</label>
                  <select value={ruleForm.type} onChange={(e) => setRuleForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Campos según tipo */}
              {ruleForm.type === "minimum_amount" && (
                <Inp label="Monto mínimo (ARS) *" type="number" required
                  value={ruleForm.minimumAmount?.toString() ?? ""}
                  onChange={(v) => setRuleForm((p) => ({ ...p, minimumAmount: v ? Number(v) : null }))} />
              )}
              {ruleForm.type === "by_date" && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Inp label="Nombre campaña" value={ruleForm.campaignName ?? ""}
                    onChange={(v) => setRuleForm((p) => ({ ...p, campaignName: v || null }))} />
                  <Inp label="Fecha inicio" type="datetime-local"
                    value={ruleForm.startDate ? ruleForm.startDate.slice(0, 16) : ""}
                    onChange={(v) => setRuleForm((p) => ({ ...p, startDate: v || null }))} />
                  <Inp label="Fecha fin" type="datetime-local"
                    value={ruleForm.endDate ? ruleForm.endDate.slice(0, 16) : ""}
                    onChange={(v) => setRuleForm((p) => ({ ...p, endDate: v || null }))} />
                </div>
              )}
              {ruleForm.type === "by_location" && (
                <Inp label="Códigos postales (separados por coma)" placeholder="1000, 1100, B1648"
                  value={ruleForm.freeZipCodes.join(", ")}
                  onChange={(v) => setRuleForm((p) => ({ ...p, freeZipCodes: v.split(",").map((s) => s.trim()).filter(Boolean) }))} />
              )}
              {ruleForm.type === "by_category" && (
                <Inp label="Categorías (separadas por coma)" placeholder="Deshidratadores, Frutas"
                  value={ruleForm.categories.join(", ")}
                  onChange={(v) => setRuleForm((p) => ({ ...p, categories: v.split(",").map((s) => s.trim()).filter(Boolean) }))} />
              )}
              {ruleForm.type === "by_coupon" && (
                <Inp label="Código de cupón" placeholder="ENVIOGRATIS2025"
                  value={ruleForm.couponCode ?? ""}
                  onChange={(v) => setRuleForm((p) => ({ ...p, couponCode: v || null }))} />
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <Inp label="Prioridad" type="number"
                  value={ruleForm.priority.toString()}
                  onChange={(v) => setRuleForm((p) => ({ ...p, priority: Number(v) }))} />
                <div className="flex flex-col gap-2 pt-5">
                  <Check label="Aplica a Andreani" checked={ruleForm.applyAndreani}
                    onChange={(v) => setRuleForm((p) => ({ ...p, applyAndreani: v }))} />
                  <Check label="Aplica a Correo Arg." checked={ruleForm.applyCorreo}
                    onChange={(v) => setRuleForm((p) => ({ ...p, applyCorreo: v }))} />
                </div>
                <div className="flex items-end pb-1">
                  <Check label="Activa" checked={ruleForm.enabled}
                    onChange={(v) => setRuleForm((p) => ({ ...p, enabled: v }))} />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={savingRule}
                  className="rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {savingRule ? "Guardando…" : editingRule ? "Guardar cambios" : "Crear regla"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Tabla de reglas */}
          {loadingRules ? (
            <p className="text-slate-400">Cargando…</p>
          ) : rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
              No hay reglas. Hacé clic en &quot;Nueva regla&quot; para agregar la primera.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Condición</th>
                    <th className="px-4 py-3 text-center">Prior.</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{rule.name}</td>
                      <td className="px-4 py-3 text-slate-500">{TYPE_LABELS[rule.type] ?? rule.type}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {rule.type === "minimum_amount" && rule.minimumAmount && formatPrice(rule.minimumAmount)}
                        {rule.type === "by_date" && rule.campaignName}
                        {rule.type === "by_coupon" && rule.couponCode}
                        {rule.type === "by_location" && rule.freeZipCodes.join(", ")}
                        {rule.type === "by_category" && rule.categories.join(", ")}
                        {(rule.type === "always" || rule.type === "never") && "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">{rule.priority}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => toggleRule(rule)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            rule.enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}>
                          {rule.enabled ? <Eye size={11} /> : <EyeOff size={11} />}
                          {rule.enabled ? "Activa" : "Inactiva"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => openForm(rule)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => deleteRule(rule.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={14} />
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
      )}

      {/* ── TAB: Precios de carriers ── */}
      {tab === "carriers" && (
        <form onSubmit={saveConfig} className="space-y-5 max-w-2xl">
          {/* Andreani */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Andreani</h2>
              <Check label="Habilitado" checked={config.andreaniEnabled}
                onChange={(v) => setConfig((p) => ({ ...p, andreaniEnabled: v }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumInp label="Envío a domicilio (ARS)" value={config.andreaniDomicilio}
                onChange={(v) => setConfig((p) => ({ ...p, andreaniDomicilio: v }))} />
              <NumInp label="Retiro en sucursal (ARS)" value={config.andreaniSucursal}
                onChange={(v) => setConfig((p) => ({ ...p, andreaniSucursal: v }))} />
              <Inp label="Días estimados" value={config.andreaniDays}
                onChange={(v) => setConfig((p) => ({ ...p, andreaniDays: v }))} />
              <div className="flex items-end pb-1">
                <Check label="Seguro incluido" checked={config.andreaniInsurance}
                  onChange={(v) => setConfig((p) => ({ ...p, andreaniInsurance: v }))} />
              </div>
            </div>
          </div>

          {/* Correo Argentino */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Correo Argentino</h2>
              <Check label="Habilitado" checked={config.correoEnabled}
                onChange={(v) => setConfig((p) => ({ ...p, correoEnabled: v }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumInp label="Envío a domicilio (ARS)" value={config.correoDomicilio}
                onChange={(v) => setConfig((p) => ({ ...p, correoDomicilio: v }))} />
              <NumInp label="Retiro en sucursal (ARS)" value={config.correoSucursal}
                onChange={(v) => setConfig((p) => ({ ...p, correoSucursal: v }))} />
              <Inp label="Días estimados" value={config.correoDays}
                onChange={(v) => setConfig((p) => ({ ...p, correoDays: v }))} />
              <div className="flex items-end pb-1">
                <Check label="Seguro incluido" checked={config.correoInsurance}
                  onChange={(v) => setConfig((p) => ({ ...p, correoInsurance: v }))} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={savingConfig}
            className="inline-flex items-center gap-2 rounded-lg bg-bio-green px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            <Save size={15} /> {savingConfig ? "Guardando…" : "Guardar precios"}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Helpers de formulario ────────────────────────────────────────────────────

function Inp({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input type={type} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
    </label>
  );
}

function NumInp({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input type="number" value={value} min={0} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-bio-green" />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-bio-green focus:ring-bio-green" />
      {label}
    </label>
  );
}
