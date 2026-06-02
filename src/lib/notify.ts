// Despacho de alertas multicanal (Telegram + email). Centraliza a quién y por
// qué medio se notifica un evento, según la preferencia del cliente:
//   notifyChannel: "ninguno" | "email" | "telegram" | "ambos"
//
// Regla: el ADMIN (grupo Bio Origen) recibe SIEMPRE por Telegram, sin importar
// la preferencia del cliente. La preferencia sólo controla qué recibe el cliente.

import { alertRecipients, broadcast, fmtEventoMsg } from "@/lib/telegram";
import { sendAlertEmail } from "@/lib/email";

export type AlertCliente =
  | {
      email: string | null;
      telegramChatId: string | null;
      notifyChannel: string | null;
    }
  | null
  | undefined;

export type AlertInput = {
  kind: string; // "alarm" | "offline"
  nombre: string;
  deviceId: string;
  detail?: string | null;
  cliente?: AlertCliente;
};

// Envía por los canales que correspondan. Devuelve true si se entregó por al
// menos uno (sirve para marcar el evento como notificado y no reintentarlo).
export async function notifyAlert(a: AlertInput): Promise<boolean> {
  const ch = a.cliente?.notifyChannel ?? "ambos";
  const wantTelegram = ch === "telegram" || ch === "ambos";
  const wantEmail = ch === "email" || ch === "ambos";

  // Telegram: el admin siempre; el chat del cliente sólo si eligió telegram/ambos.
  const clienteTg = wantTelegram ? a.cliente?.telegramChatId : null;
  const tgMsg = fmtEventoMsg({
    kind: a.kind,
    nombre: a.nombre,
    deviceId: a.deviceId,
    detail: a.detail,
  });
  const tg = await broadcast(alertRecipients(clienteTg), tgMsg);

  // Email: sólo al cliente, si eligió email/ambos y tiene email cargado.
  let emailOk = false;
  if (wantEmail && a.cliente?.email) {
    const r = await sendAlertEmail(a.cliente.email, {
      kind: a.kind,
      nombre: a.nombre,
      deviceId: a.deviceId,
      detail: a.detail,
    });
    emailOk = r.ok;
  }

  return tg.ok || emailOk;
}
