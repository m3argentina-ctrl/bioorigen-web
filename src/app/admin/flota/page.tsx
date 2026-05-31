"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Cpu, Wifi, WifiOff, AlertTriangle, Thermometer, Link2, Check } from "lucide-react";
import {
  RUN_STATE_LABELS,
  OP_MODE_LABELS,
  fmtAgo,
  type FleetItem,
  type FleetSummary,
} from "@/lib/fleet";

const POLL_MS = 20_000;

// El admin además recibe el link de acceso del cliente (para copiar/compartir).
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
  const firstLoad = useRef(true);

  function copyLink(equipoId: string, token: string) {
    const url = `${window.location.origin}/cliente/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(equipoId);
      setTimeout(() => setCopiedId((id) => (id === equipoId ? null : id)), 1800);
    });
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
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-5">
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
                <th className="px-4 py-3 text-left">Último contacto</th>
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
                        title={e.online ? "En línea" : "Offline"}
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
                    {/* Último contacto */}
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
    </div>
  );
}
