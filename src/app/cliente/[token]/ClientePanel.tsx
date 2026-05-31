"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { RefreshCw, Wifi, WifiOff, AlertTriangle, Thermometer } from "lucide-react";
import {
  RUN_STATE_LABELS,
  OP_MODE_LABELS,
  fmtAgo,
  type FleetItem,
  type FleetSummary,
} from "@/lib/fleet";

const POLL_MS = 20_000;

export default function ClientePanel({
  token,
  clienteNombre,
}: {
  token: string;
  clienteNombre: string;
}) {
  const [items, setItems] = useState<FleetItem[]>([]);
  const [summary, setSummary] = useState<FleetSummary>({ total: 0, online: 0, offline: 0, alarm: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const first = useRef(true);

  const load = useCallback(() => {
    if (first.current) setLoading(true);
    else setRefreshing(true);
    fetch(`/api/cliente/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.items) {
          setItems(d.items);
          setSummary(d.summary ?? { total: 0, online: 0, offline: 0, alarm: 0 });
          setLastUpdate(new Date());
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
        first.current = false;
      });
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Encabezado */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Image src="/logo.svg" alt="Bio Origen" width={120} height={40} unoptimized className="h-9 w-auto" />
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-1 flex items-end justify-between">
          <h1 className="text-xl font-bold text-slate-800">Mis equipos</h1>
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Actualizado {lastUpdate.toLocaleTimeString("es-AR")}
            </span>
          )}
        </div>
        <p className="mb-5 text-sm text-slate-500">{clienteNombre}</p>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Kpi label="En línea" value={summary.online}  icon={Wifi}          cls="bg-emerald-100 text-emerald-600" />
          <Kpi label="Offline"  value={summary.offline} icon={WifiOff}       cls="bg-slate-100 text-slate-400" />
          <Kpi label="Alarmas"  value={summary.alarm}   icon={AlertTriangle} cls="bg-red-100 text-red-600" />
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            No tenés equipos registrados todavía.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((e) => (
              <EquipoCard key={e.id} e={e} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-300">
          Bio Origen · Monitoreo de equipos
        </p>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  cls,
}: {
  label: string;
  value: number;
  icon: typeof Wifi;
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

function EquipoCard({ e }: { e: FleetItem }) {
  const st =
    e.lastRunState !== null
      ? RUN_STATE_LABELS[e.lastRunState] ?? { label: `Estado ${e.lastRunState}`, cls: "bg-slate-100 text-slate-500" }
      : null;
  const mode =
    e.lastOpMode !== null ? OP_MODE_LABELS[e.lastOpMode] ?? null : null;

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        e.alarm ? "border-red-300 ring-1 ring-red-200" : "border-slate-100"
      }`}
    >
      {/* Título + estado online */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800">{e.nombre ?? e.deviceId}</p>
          <p className="text-xs text-slate-400">
            {e.modelo ? e.modelo : e.deviceId}
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            e.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${e.online ? "bg-emerald-500" : "bg-slate-400"}`} />
          {e.online ? "En línea" : "Offline"}
        </span>
      </div>

      {/* Métricas */}
      <div className="flex flex-wrap items-center gap-2">
        {st && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
            {e.alarm && <AlertTriangle size={11} />}
            {st.label}
          </span>
        )}
        {mode && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${mode.cls}`}>
            {mode.label}
            {e.lastOpMode === 2 && e.lastProg ? ` · ${e.lastProg}` : ""}
          </span>
        )}
        {e.lastTemp !== null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
            <Thermometer size={11} />
            {e.lastTemp.toFixed(1)}°C
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Último contacto: {fmtAgo(e.secondsSinceSeen)}
      </p>
    </div>
  );
}
