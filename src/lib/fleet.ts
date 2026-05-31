// Lógica compartida del panel de flota (servidor + cliente).
// IMPORTANTE: sin imports server-only (ni prisma ni next/headers) para que
// pueda usarse también desde componentes "use client".

// El firmware empuja heartbeat cada 60s; damos margen de 3 latidos (180s)
// para considerar un equipo "offline".
export const OFFLINE_THRESHOLD_MS = 180_000;
export const RUN_ALARM = 5; // run_state == 5 → RUN_STATE_ALARM (firmware app_state.h)

// Forma cruda del equipo tal como vuelve de Prisma (campos que usamos).
export type EquipoRow = {
  id: string;
  deviceId: string;
  nombre: string | null;
  modelo: string | null;
  serie: string | null;
  activo: boolean;
  clienteId: string | null;
  lastSeenAt: Date | null;
  lastReason: string | null;
  lastRunState: number | null;
  lastTemp: number | null;
  lastOpMode: number | null;
  lastProg: string | null;
  cliente?: { nombre: string } | null;
};

// Forma serializada que consumen los paneles (admin y cliente).
export type FleetItem = {
  id: string;
  deviceId: string;
  nombre: string | null;
  modelo: string | null;
  serie: string | null;
  activo: boolean;
  clienteId: string | null;
  clienteNombre: string | null;
  online: boolean;
  alarm: boolean;
  lastSeenAt: string | null;
  secondsSinceSeen: number | null;
  lastReason: string | null;
  lastRunState: number | null;
  lastTemp: number | null;
  lastOpMode: number | null;
  lastProg: string | null;
};

export type FleetSummary = { total: number; online: number; offline: number; alarm: number };

export function shapeEquipo(e: EquipoRow, now: number): FleetItem {
  const lastSeenMs = e.lastSeenAt ? e.lastSeenAt.getTime() : null;
  const secondsSinceSeen =
    lastSeenMs !== null ? Math.floor((now - lastSeenMs) / 1000) : null;
  // "online" derivado en vivo desde lastSeenAt (no del flag cacheado).
  const online = lastSeenMs !== null && now - lastSeenMs < OFFLINE_THRESHOLD_MS;
  const alarm = online && e.lastRunState === RUN_ALARM;

  return {
    id: e.id,
    deviceId: e.deviceId,
    nombre: e.nombre,
    modelo: e.modelo,
    serie: e.serie,
    activo: e.activo,
    clienteId: e.clienteId,
    clienteNombre: e.cliente?.nombre ?? null,
    online,
    alarm,
    lastSeenAt: e.lastSeenAt ? e.lastSeenAt.toISOString() : null,
    secondsSinceSeen,
    lastReason: e.lastReason,
    lastRunState: e.lastRunState,
    lastTemp: e.lastTemp,
    lastOpMode: e.lastOpMode,
    lastProg: e.lastProg,
  };
}

export function summarize(items: FleetItem[]): FleetSummary {
  return {
    total: items.length,
    online: items.filter((i) => i.online).length,
    offline: items.filter((i) => !i.online).length,
    alarm: items.filter((i) => i.alarm).length,
  };
}

// Etiquetas de run_state (índice = valor numérico del firmware).
export const RUN_STATE_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: "Reposo",       cls: "bg-slate-100 text-slate-500" },
  1: { label: "Configurando", cls: "bg-blue-100 text-blue-700" },
  2: { label: "En marcha",    cls: "bg-emerald-100 text-emerald-700" },
  3: { label: "Pausado",      cls: "bg-amber-100 text-amber-700" },
  4: { label: "Completado",   cls: "bg-green-100 text-green-700" },
  5: { label: "ALARMA",       cls: "bg-red-100 text-red-600" },
};

// Modo de operación (op_mode): 0 reposo · 1 manual · 2 programa.
export const OP_MODE_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: "Reposo",   cls: "bg-slate-100 text-slate-500" },
  1: { label: "Manual",   cls: "bg-indigo-100 text-indigo-700" },
  2: { label: "Programa", cls: "bg-violet-100 text-violet-700" },
};

export function fmtAgo(seconds: number | null): string {
  if (seconds === null) return "nunca";
  if (seconds < 60) return `hace ${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}
