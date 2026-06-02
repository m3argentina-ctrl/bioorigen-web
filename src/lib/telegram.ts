// Avisos por Telegram (Bot API). Diseñado para NO romper nunca el flujo que lo
// invoca: si falta el token o la API falla, devuelve { ok:false } y loguea, pero
// jamás lanza. Así un fallo de Telegram no tira abajo el ingest ni el watchdog.
//
// Variables de entorno:
//   TELEGRAM_BOT_TOKEN      token del bot (BotFather)            — obligatorio
//   TELEGRAM_ADMIN_CHAT_ID  chat/grupo de Bio Origen (admin)    — recomendado
// El chat del cliente (si lo tiene) sale de Cliente.telegramChatId.

import { fmtAgo } from "@/lib/fleet";

const API = "https://api.telegram.org";

export type TelegramResult = { ok: boolean; error?: string };

// Escapa los caracteres que Telegram interpreta en parse_mode HTML.
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Envío a un chat concreto. Devuelve ok=false (sin lanzar) ante cualquier error.
export async function sendTelegram(
  chatId: string,
  text: string,
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN ausente" };
  if (!chatId) return { ok: false, error: "chatId vacío" };
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // No queremos que un Telegram lento cuelgue el request del firmware.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Destinatarios de un aviso: el admin global + (si existe y es distinto) el
// chat del cliente. Sin admin configurado y sin chat de cliente → lista vacía.
export function alertRecipients(clienteChatId?: string | null): string[] {
  const out: string[] = [];
  const admin = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (admin) out.push(admin);
  if (clienteChatId && clienteChatId.trim() && clienteChatId.trim() !== admin) {
    out.push(clienteChatId.trim());
  }
  return out;
}

// Envía el mismo texto a varios chats. ok=true si al menos uno se entregó.
export async function broadcast(
  chatIds: string[],
  text: string,
): Promise<TelegramResult> {
  if (chatIds.length === 0) return { ok: false, error: "sin destinatarios" };
  const results = await Promise.all(chatIds.map((c) => sendTelegram(c, text)));
  const anyOk = results.some((r) => r.ok);
  if (anyOk) return { ok: true };
  return { ok: false, error: results.map((r) => r.error).join("; ") };
}

// Formato unificado de un evento para Telegram (lo usan ingest y watchdog).
export function fmtEventoMsg(p: {
  kind: string; // alarm | offline | ...
  nombre: string;
  deviceId: string;
  detail?: string | null; // texto extra (temperatura, "hace 5 min", etc.)
}): string {
  const head =
    p.kind === "alarm"
      ? "🚨 <b>ALARMA</b>"
      : p.kind === "offline"
        ? "⚠️ <b>SIN CONEXIÓN</b>"
        : `ℹ️ <b>${escapeHtml(p.kind.toUpperCase())}</b>`;
  const lines = [
    head,
    `${escapeHtml(p.nombre)} (<code>${escapeHtml(p.deviceId)}</code>)`,
  ];
  if (p.detail) lines.push(escapeHtml(p.detail));
  return lines.join("\n");
}

// Detalle "último dato hace …" para avisos de offline.
export function offlineDetail(lastSeenAt: Date | null, now: number): string {
  if (!lastSeenAt) return "Sin datos previos";
  const secs = Math.floor((now - lastSeenAt.getTime()) / 1000);
  return `Último dato ${fmtAgo(secs)}`;
}
