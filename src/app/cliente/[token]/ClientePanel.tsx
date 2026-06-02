"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import Image from "next/image";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Thermometer,
  X,
  Flame,
  Fan,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  RUN_STATE_LABELS,
  OP_MODE_LABELS,
  fmtAgo,
  fmtDuration,
  fmtHMS,
  hasSession,
  sessionPct,
  sessionKwh,
  PROG_STAGE_COUNT,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const first = useRef(true);

  // Equipo seleccionado re-derivado de `items` para que siga vivo con el polling.
  const selected = selectedId ? items.find((i) => i.id === selectedId) ?? null : null;

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
              <EquipoCard key={e.id} e={e} onOpen={() => setSelectedId(e.id)} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          La información se actualiza cada 60 segundos
        </p>
        <p className="mt-1 text-center text-xs text-slate-300">
          Bio Origen · Monitoreo de equipos
        </p>
      </main>

      {selected && (
        <ControllerScreen e={selected} onClose={() => setSelectedId(null)} />
      )}
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

function EquipoCard({ e, onOpen }: { e: FleetItem; onOpen: () => void }) {
  const st =
    e.lastRunState !== null
      ? RUN_STATE_LABELS[e.lastRunState] ?? { label: `Estado ${e.lastRunState}`, cls: "bg-slate-100 text-slate-500" }
      : null;
  const mode =
    e.lastOpMode !== null ? OP_MODE_LABELS[e.lastOpMode] ?? null : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      title="Ver detalle del equipo"
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
        e.alarm
          ? "border-red-300 ring-1 ring-red-200"
          : "border-slate-200 hover:border-bio-green/50"
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

      <SesionInfo e={e} />

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <p className="text-xs text-slate-400">
          Último contacto: {fmtAgo(e.secondsSinceSeen)}
        </p>
        <span className="flex items-center gap-0.5 text-xs font-semibold text-bio-green">
          Ver detalle
          <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

// Bloque de sesión: tiempo programado / restante, etapa actual (en Programa) y
// barra de progreso. Sólo se muestra cuando hay una sesión activa con tiempo.
function SesionInfo({ e }: { e: FleetItem }) {
  if (!hasSession(e)) return null;

  const calentando = !e.lastWarmup && e.lastRunState === 2;
  const pausado = e.lastRunState === 3;
  const esPrograma = e.lastOpMode === 2;
  const pct = sessionPct(e);

  return (
    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600">
          {esPrograma && e.lastEtapa !== null
            ? `Etapa ${e.lastEtapa + 1}/${PROG_STAGE_COUNT}`
            : "Sesión"}
          {e.lastSpEff !== null && (
            <span className="ml-1.5 font-normal text-slate-400">
              objetivo {e.lastSpEff.toFixed(0)}°C
            </span>
          )}
        </span>
        {calentando ? (
          <span className="font-semibold text-amber-600">Calentando…</span>
        ) : (
          <span className="text-slate-500">
            Restan{" "}
            <b className="text-slate-700">{fmtDuration(e.lastRemainingS)}</b>
            <span className="text-slate-400"> / {fmtDuration(e.lastTotalS)}</span>
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${
            pausado ? "bg-amber-400" : "bg-bio-green"
          }`}
          style={{ width: `${calentando ? 0 : pct}%` }}
        />
      </div>
      {pausado && (
        <p className="mt-1 text-[11px] font-medium text-amber-600">En pausa</p>
      )}
    </div>
  );
}

// Vista "Controlador": modal oscuro que imita la pantalla LCD del equipo.
// Sólo lectura. Muestra la etapa actual (no el detalle de las 3 etapas).
function ControllerScreen({ e, onClose }: { e: FleetItem; onClose: () => void }) {
  const st =
    e.lastRunState !== null
      ? RUN_STATE_LABELS[e.lastRunState] ??
        { label: `Estado ${e.lastRunState}`, cls: "bg-slate-100 text-slate-500" }
      : null;
  const mode = e.lastOpMode !== null ? OP_MODE_LABELS[e.lastOpMode] ?? null : null;
  const session = hasSession(e);
  const calentando = !e.lastWarmup && e.lastRunState === 2;
  const pausado = e.lastRunState === 3;
  const esPrograma = e.lastOpMode === 2;
  const pct = sessionPct(e);
  const resOn = (e.lastDrv ?? 0) > 5;
  const fanOn = (e.lastFan ?? 0) > 5;
  const kwh = sessionKwh(e);

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Barra de estado (como el header del Controlador) */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/70 bg-slate-800/60 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                e.online ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{e.nombre ?? e.deviceId}</p>
              <p className="truncate font-mono text-[11px] text-slate-400">{e.deviceId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                e.online ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-400"
              }`}
            >
              {e.online ? <Wifi size={11} /> : <WifiOff size={11} />}
              {e.online ? "En línea" : "Offline"}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Estado + modo */}
          <div className="flex flex-wrap items-center gap-2">
            {st && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}
              >
                {e.alarm && <AlertTriangle size={11} />}
                {st.label}
              </span>
            )}
            {mode && (
              <span className="inline-flex items-center rounded-full bg-slate-700/70 px-2.5 py-0.5 text-xs font-semibold text-slate-200">
                {mode.label}
                {esPrograma && e.lastProg ? ` · ${e.lastProg}` : ""}
              </span>
            )}
            {esPrograma && e.lastEtapa !== null && (
              <span className="inline-flex items-center rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                Etapa {e.lastEtapa + 1}/{PROG_STAGE_COUNT}
              </span>
            )}
          </div>

          {/* Temperatura grande + Set Point */}
          <div className="flex items-end justify-between rounded-2xl bg-slate-800/50 px-5 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Temperatura</p>
              <p className="text-5xl font-bold leading-none text-orange-400">
                {e.lastTemp !== null ? e.lastTemp.toFixed(1) : "--"}
                <span className="ml-1 text-2xl text-orange-300/70">°C</span>
              </p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-[11px] uppercase tracking-wide text-slate-400">
                <Target size={11} /> Set Point
              </p>
              <p className="text-2xl font-semibold text-emerald-300">
                {e.lastSpEff !== null ? `${e.lastSpEff.toFixed(0)}°` : "--"}
              </p>
            </div>
          </div>

          {/* Resistencia / Turbinas */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              icon={<Flame size={15} />}
              label="Resistencia"
              on={resOn}
              onColor="text-orange-400"
              detail={e.lastDrv !== null ? `${Math.round(e.lastDrv)}%` : null}
            />
            <StatBox
              icon={<Fan size={15} />}
              label="Turbinas"
              on={fanOn}
              onColor="text-sky-400"
              detail={e.lastFan !== null ? `${Math.round(e.lastFan)}%` : null}
            />
          </div>

          {/* Tiempo (reloj grande + barra) */}
          {session ? (
            <div className="rounded-2xl bg-slate-800/50 px-5 py-4">
              {calentando ? (
                <p className="text-center text-lg font-semibold text-amber-400">Calentando…</p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400">
                      Restante
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Programado {fmtDuration(e.lastTotalS)}
                    </span>
                  </div>
                  <p className="mt-1 text-center font-mono text-4xl font-bold tracking-wider text-bio-green">
                    {fmtHMS(e.lastRemainingS)}
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full ${pausado ? "bg-amber-400" : "bg-bio-green"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pausado && (
                    <p className="mt-2 text-center text-xs font-medium text-amber-400">En pausa</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-800/30 px-5 py-4 text-center text-sm text-slate-400">
              Sin sesión activa
            </div>
          )}

          {/* T MIN / T MAX */}
          <div className="grid grid-cols-2 gap-3">
            <MinMaxBox label="T MÍN" value={e.lastTMin} cls="text-sky-300" />
            <MinMaxBox label="T MÁX" value={e.lastTMax} cls="text-orange-300" />
          </div>

          {/* Consumo de energía de la sesión (mismo cálculo que el LCD) */}
          {kwh !== null && (
            <div className="rounded-2xl bg-slate-800/50 px-5 py-4">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
                <Zap size={12} className="text-green-400" /> Consumo de energía
              </p>
              <p className="mt-1 text-3xl font-bold text-green-400">
                {kwh.toFixed(2)}
                <span className="ml-1 text-lg font-semibold text-green-300/70">kWh</span>
              </p>
            </div>
          )}

          <p className="text-center text-xs text-slate-500">
            Último contacto: {fmtAgo(e.secondsSinceSeen)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Caja Resistencia / Turbinas: ON/OFF + % de duty.
function StatBox({
  icon,
  label,
  on,
  onColor,
  detail,
}: {
  icon: ReactNode;
  label: string;
  on: boolean;
  onColor: string;
  detail: string | null;
}) {
  return (
    <div className="rounded-2xl bg-slate-800/50 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
        <span className={on ? onColor : "text-slate-500"}>{icon}</span>
        {label}
      </p>
      <div className="mt-1 flex items-baseline justify-between">
        <span className={`text-lg font-bold ${on ? onColor : "text-slate-500"}`}>
          {on ? "ON" : "OFF"}
        </span>
        {detail && <span className="text-xs text-slate-400">{detail}</span>}
      </div>
    </div>
  );
}

// Caja T MÍN / T MÁX de la sesión.
function MinMaxBox({
  label,
  value,
  cls,
}: {
  label: string;
  value: number | null;
  cls: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-800/50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold ${cls}`}>
        {value !== null ? `${value.toFixed(1)}°C` : "—"}
      </p>
    </div>
  );
}
