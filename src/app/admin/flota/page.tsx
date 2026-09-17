"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  RefreshCw,
  Cpu,
  Wifi,
  WifiOff,
  AlertTriangle,
  Thermometer,
  Droplets,
  Target,
  Link2,
  Check,
  Plus,
  X,
  Copy,
  Key,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  RUN_STATE_LABELS,
  OP_MODE_LABELS,
  fmtAgo,
  fmtDuration,
  hasSession,
  sessionPct,
  PROG_STAGE_COUNT,
  type FleetItem,
  type FleetSummary,
} from "@/lib/fleet";

const POLL_MS = 20_000;

type Equipo = FleetItem & { clienteToken: string | null };
type Summary = FleetSummary;

function KpiCard({
  label,
  value,
  icon: Icon,
  cls,
}: {
  label: string;
  value: number;
  icon: typeof Cpu;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-slate-800">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function FlotaAdminPage() {
  const [items, setItems] = useState<Equipo[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, online: 0, offline: 0, alarm: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const firstLoad = useRef(true);

  function copyText(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
    });
  }

  function copyLink(equipoId: string, token: string) {
    const url = `${window.location.origin}/cliente/${token}`;
    copyText(equipoId, url);
  }

  const load = useCallback(() => {
    if (firstLoad.current) setLoading(true);
    else setRefreshing(true);
    fetch("/api/admin/flota")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setSummary(data.summary ?? { total: 0, online: 0, offline: 0, alarm: 0 });
        setLastUpdate(new Date());
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
        firstLoad.current = false;
      });
  }, []);

  useEffect(() => {
    load();
    // Sólo consulta mientras la pestaña está a la vista: un panel olvidado
    // abierto no despierta la base ni gasta comandos de Redis.
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (id === null) id = setInterval(load, POLL_MS); };
    const stop = () => { if (id !== null) { clearInterval(id); id = null; } };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { load(); start(); }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [load]);

  return (
    <div className="space-y-5">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Flota</h1>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {lastUpdate && (
            <span>Actualizado {lastUpdate.toLocaleTimeString("es-AR")}</span>
          )}
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-lg bg-bio-green px-4 py-1.5 font-semibold text-white hover:opacity-90"
          >
            <Plus size={14} />
            Nuevo equipo
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Equipos"  value={summary.total}   icon={Cpu}     cls="bg-slate-100 text-slate-600" />
        <KpiCard label="En línea" value={summary.online}  icon={Wifi}    cls="bg-emerald-100 text-emerald-600" />
        <KpiCard label="Offline"  value={summary.offline} icon={WifiOff} cls="bg-slate-100 text-slate-400" />
        <KpiCard label="Alarmas"  value={summary.alarm}   icon={AlertTriangle} cls="bg-red-100 text-red-600" />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left w-10" />
                <th className="px-4 py-3 text-left">Equipo</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Modo</th>
                <th className="px-4 py-3 text-right">Temp.</th>
                <th className="px-4 py-3 text-right">Humedad</th>
                <th className="px-4 py-3 text-left">Tiempo</th>
                <th className="px-4 py-3 text-left">Ultimo contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((e) => {
                const st =
                  e.lastRunState !== null
                    ? RUN_STATE_LABELS[e.lastRunState] ?? { label: `Estado ${e.lastRunState}`, cls: "bg-slate-100 text-slate-500" }
                    : null;
                return (
                  <tr
                    key={e.id}
                    className={`transition-colors ${e.alarm ? "bg-red-50" : "hover:bg-slate-50"}`}
                  >
                    {/* Punto online/offline */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          e.online ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        title={e.online ? "En linea" : "Offline"}
                      />
                    </td>
                    {/* Equipo */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">
                        {e.nombre ?? e.deviceId}
                      </p>
                      <p className="font-mono text-xs text-slate-400">
                        {e.deviceId}
                        {e.modelo ? ` · ${e.modelo}` : ""}
                      </p>
                    </td>
                    {/* Cliente */}
                    <td className="px-4 py-3 text-slate-600">
                      {e.clienteNombre ? (
                        <div className="flex items-center gap-2">
                          <span>{e.clienteNombre}</span>
                          {e.clienteToken && (
                            <button
                              type="button"
                              onClick={() => copyLink(e.id, e.clienteToken!)}
                              title="Copiar link de acceso del cliente"
                              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors ${
                                copiedId === e.id
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              }`}
                            >
                              {copiedId === e.id ? <Check size={12} /> : <Link2 size={12} />}
                              {copiedId === e.id ? "Copiado" : "Link"}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {/* Estado */}
                    <td className="px-4 py-3">
                      {st ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                          {e.alarm && <AlertTriangle size={11} />}
                          {st.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    {/* Modo */}
                    <td className="px-4 py-3">
                      {e.lastOpMode !== null && OP_MODE_LABELS[e.lastOpMode] ? (
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${OP_MODE_LABELS[e.lastOpMode].cls}`}>
                            {OP_MODE_LABELS[e.lastOpMode].label}
                          </span>
                          {e.lastOpMode === 2 && e.lastProg && (
                            <span className="text-xs text-slate-400 truncate max-w-[12rem]" title={e.lastProg}>
                              {e.lastProg}
                              {e.lastEtapa !== null && (
                                <> · Etapa {e.lastEtapa + 1}/{PROG_STAGE_COUNT}</>
                              )}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    {/* Temp */}
                    <td className="px-4 py-3 text-right">
                      {e.lastTemp !== null && e.lastTemp !== undefined ? (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Thermometer size={13} className="text-slate-400" />
                          {e.lastTemp.toFixed(1)}°
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {/* Humedad + objetivo (sólo en proceso y con corte por humedad;
                        el equipo conserva el objetivo de la última sesión) */}
                    <td className="px-4 py-3 text-right">
                      {e.lastHum !== null ? (
                        <div className="flex flex-col items-end gap-0.5">
                          {e.lastHumFault ? (
                            <span className="text-xs font-medium text-red-500">Sensor falla</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <Droplets size={13} className="text-sky-400" />
                              {e.lastHum.toFixed(0)}%
                            </span>
                          )}
                          {(e.lastRunState === 2 || e.lastRunState === 3) &&
                            e.lastHumTgt !== null &&
                            e.lastHumTgt > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <Target size={11} />
                                obj {e.lastHumTgt.toFixed(0)}%
                              </span>
                            )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {/* Tiempo (programado / restante) */}
                    <td className="px-4 py-3 text-xs">
                      {hasSession(e) ? (
                        !e.lastWarmup && e.lastRunState === 2 ? (
                          <span className="font-medium text-amber-600">Calentando…</span>
                        ) : (
                          <div className="min-w-[7rem]">
                            <div className="flex items-baseline gap-1">
                              <span className="font-semibold text-slate-700">
                                {fmtDuration(e.lastRemainingS)}
                              </span>
                              <span className="text-slate-400">
                                / {fmtDuration(e.lastTotalS)}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  e.lastRunState === 3 ? "bg-amber-400" : "bg-bio-green"
                                }`}
                                style={{ width: `${sessionPct(e)}%` }}
                              />
                            </div>
                          </div>
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {/* Ultimo contacto */}
                    <td className={`px-4 py-3 text-xs ${e.online ? "text-slate-400" : "text-slate-400"}`}>
                      {fmtAgo(e.secondsSinceSeen)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              Sin equipos registrados.
            </p>
          )}
        </div>
      )}

      {showNew && (
        <NewEquipoModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: Nuevo equipo
// ---------------------------------------------------------------------------
function NewEquipoModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [deviceId, setDeviceId] = useState("");
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ deviceId: string; token: string } | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId.trim()) {
      toast.error("El Device ID es obligatorio");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/flota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: deviceId.trim(), nombre: nombre.trim() || null }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      toast.success("Equipo creado");
    } else {
      const d = await res.json().catch(() => null);
      toast.error(typeof d?.error === "string" ? d.error : "No se pudo crear");
    }
  }

  function copyToken() {
    if (!result) return;
    navigator.clipboard.writeText(result.token).then(() => {
      setTokenCopied(true);
      toast.success("Token copiado");
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {result ? "Equipo creado" : "Nuevo equipo"}
          </h2>
          <button
            type="button"
            onClick={result ? () => { onCreated(); } : onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <form onSubmit={submit} className="space-y-3">
            <Field label="Device ID *" hint="Identificador unico del equipo (ej: IND30S-0001)">
              <input
                autoFocus
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value.replace(/[^A-Za-z0-9_-]/g, ""))}
                className="input font-mono"
                placeholder="IND30S-0001"
              />
            </Field>
            <Field label="Nombre (alias visible)" hint="Lo que se muestra en la flota">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                placeholder="IND-30MTO-SMART #1"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Creando…" : "Crear equipo"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">
                Equipo <span className="font-mono">{result.deviceId}</span> registrado.
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                Copiá el token y usalo para provisionar el firmware.
              </p>
            </div>

            <Field label="Token del equipo (secreto Bearer)">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={result.token}
                  className="input font-mono text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={copyToken}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    tokenCopied
                      ? "bg-emerald-100 text-emerald-700"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {tokenCopied ? <Check size={14} /> : <Copy size={14} />}
                  {tokenCopied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </Field>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <Key size={14} className="mt-0.5 text-amber-600" />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold">Provision en el firmware:</p>
                  <code className="mt-1 block rounded bg-amber-100 px-2 py-1 font-mono text-[11px] leading-relaxed">
                    .\tools\provision\provision.ps1 -DevId &quot;{result.deviceId}&quot; -Token &quot;{result.token}&quot; -Port COM3
                  </code>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onCreated}
                className="rounded-lg bg-bio-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Listo
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
        }
        :global(.input:focus) {
          border-color: #4a7c59;
          box-shadow: 0 0 0 1px #4a7c59;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {hint && <span className="mb-1 block text-[11px] text-slate-400">{hint}</span>}
      {children}
    </label>
  );
}
