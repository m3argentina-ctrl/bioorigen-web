// Lógica compartida del panel de flota (servidor + cliente).
// IMPORTANTE: sin imports server-only (ni prisma ni next/headers) para que
// pueda usarse también desde componentes "use client".

// El firmware empuja heartbeat cada 60s; damos margen de 3 latidos (180s)
// para considerar un equipo "offline".
export const OFFLINE_THRESHOLD_MS = 180_000;
export const RUN_ALARM = 5; // run_state == 5 → RUN_STATE_ALARM (firmware app_state.h)
export const RUN_COMPLETED = 4; // run_state == 4 → RUN_STATE_COMPLETED (proceso terminado)
export const PROG_STAGE_COUNT = 3; // etapas por programa (firmware PROG_STAGE_COUNT)

// Potencia de UNA turbina: motor polo de sombra 220V × 0,40A ≈ 88 W.
// Igual a FAN_WATTS_PER_MODULE del firmware (app_config.h). La resistencia ya
// viene integrada en Wh (resWh), así que sólo necesitamos esta constante.
export const FAN_WATTS_PER_MODULE = 88;

// Última muestra de telemetría (sub-select con take:1). Trae los datos de la
// sesión en curso que NO están cacheados en Equipo: tiempo y etapa.
export type MuestraMini = {
  warmup: boolean;
  etapa: number | null;
  elapsedS: number | null;
  totalS: number | null;
  remainingS: number | null;
  spEff: number | null;
  drv: number | null; // % duty resistencia
  fan: number | null; // % duty turbinas
  tMin: number | null;
  tMax: number | null;
  resWh: number | null;  // Wh de UNA resistencia (acumulado de la sesión)
  fanOnS: number | null; // segundos con turbina encendida (sesión)
  numMod: number | null; // cantidad de módulos
};

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
  muestras?: MuestraMini[];
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
  // Sesión en curso (de la última muestra).
  lastWarmup: boolean;
  lastEtapa: number | null;
  lastElapsedS: number | null;
  lastTotalS: number | null;
  lastRemainingS: number | null;
  lastSpEff: number | null;
  lastDrv: number | null; // % duty resistencia
  lastFan: number | null; // % duty turbinas
  lastTMin: number | null;
  lastTMax: number | null;
  lastResWh: number | null;
  lastFanOnS: number | null;
  lastNumMod: number | null;
};

export type FleetSummary = { total: number; online: number; offline: number; alarm: number };

export function shapeEquipo(e: EquipoRow, now: number): FleetItem {
  const lastSeenMs = e.lastSeenAt ? e.lastSeenAt.getTime() : null;
  const secondsSinceSeen =
    lastSeenMs !== null ? Math.floor((now - lastSeenMs) / 1000) : null;
  // "online" derivado en vivo desde lastSeenAt (no del flag cacheado).
  const online = lastSeenMs !== null && now - lastSeenMs < OFFLINE_THRESHOLD_MS;
  const alarm = online && e.lastRunState === RUN_ALARM;
  const m = e.muestras?.[0];

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
    lastWarmup: m?.warmup ?? false,
    lastEtapa: m?.etapa ?? null,
    lastElapsedS: m?.elapsedS ?? null,
    lastTotalS: m?.totalS ?? null,
    lastRemainingS: m?.remainingS ?? null,
    lastSpEff: m?.spEff ?? null,
    lastDrv: m?.drv ?? null,
    lastFan: m?.fan ?? null,
    lastTMin: m?.tMin ?? null,
    lastTMax: m?.tMax ?? null,
    lastResWh: m?.resWh ?? null,
    lastFanOnS: m?.fanOnS ?? null,
    lastNumMod: m?.numMod ?? null,
  };
}

// kWh de la sesión (mismo cálculo que el LCD del equipo): integra la energía de
// la resistencia (ya en Wh) más la de las turbinas (segundos encendidas × 88 W),
// todo por módulo y multiplicado por la cantidad de módulos. Devuelve null si la
// muestra no trae datos de consumo (equipos con firmware viejo).
export function sessionKwh(e: {
  lastResWh: number | null;
  lastFanOnS: number | null;
  lastNumMod: number | null;
}): number | null {
  if (e.lastResWh === null && e.lastFanOnS === null) return null;
  const resWh = e.lastResWh ?? 0;
  const fanOnS = e.lastFanOnS ?? 0;
  const numMod = e.lastNumMod ?? 1;
  const whMod = resWh + (fanOnS * FAN_WATTS_PER_MODULE) / 3600;
  return (whMod * numMod) / 1000;
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

// Duración en HH:MM a partir de segundos (tiempo programado / restante).
export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Duración en HH:MM:SS (igual que el reloj grande del Controlador).
export function fmtHMS(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || seconds < 0) return "--:--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ¿El equipo tiene una sesión (Manual u Programa) en curso o pausada con tiempo
// programado? Define si mostramos el bloque de tiempo/etapa.
export function hasSession(e: {
  lastRunState: number | null;
  lastOpMode: number | null;
  lastTotalS: number | null;
}): boolean {
  const running = e.lastRunState === 2 || e.lastRunState === 3; // marcha / pausado
  return running && e.lastOpMode !== null && e.lastOpMode !== 0 && !!e.lastTotalS;
}

// % de avance de la sesión (0..100) a partir de elapsed/total.
export function sessionPct(e: {
  lastElapsedS: number | null;
  lastTotalS: number | null;
}): number {
  if (!e.lastTotalS || e.lastElapsedS === null) return 0;
  return Math.max(0, Math.min(100, Math.round((e.lastElapsedS / e.lastTotalS) * 100)));
}
