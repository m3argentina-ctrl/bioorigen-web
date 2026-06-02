import nodemailer from "nodemailer";

// Escapa lo que el navegador interpretaría como HTML (nombre/serie los pone el
// admin, pero por las dudas no inyectamos crudo en el cuerpo del mail).
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Remitente de los mails. Con una casilla propia (WNPower, etc.) el login SMTP y
// el "from" coinciden; con un relay (Brevo, SendGrid…) el login es la credencial
// del servicio y el "from" es tu address verificado del dominio. MAIL_FROM separa
// ambos; si no se define, cae a SMTP_USER (compatibilidad hacia atrás).
function fromAddress(label: string): string {
  const addr = process.env.MAIL_FROM || process.env.SMTP_USER || "";
  return `"${label}" <${addr}>`;
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
}) {
  const transporter = getTransporter();
  if (!transporter) return;

  const adminEmail = process.env.CONTACT_EMAIL ?? "consultas@bioorigen.com.ar";

  await transporter.sendMail({
    from: fromAddress("Bio Origen Web"),
    to: adminEmail,
    subject: `Nuevo mensaje: ${data.subject}`,
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><b>Nombre:</b> ${data.name}</p>
      <p><b>Email:</b> ${data.email}</p>
      ${data.phone ? `<p><b>Teléfono:</b> ${data.phone}</p>` : ""}
      <p><b>Asunto:</b> ${data.subject}</p>
      <hr/>
      <p>${data.message.replace(/\n/g, "<br/>")}</p>
    `,
  });

  await transporter.sendMail({
    from: fromAddress("Bio Origen"),
    to: data.email,
    subject: "Recibimos tu mensaje — Bio Origen",
    html: `
      <h2>¡Hola ${data.name}!</h2>
      <p>Recibimos tu mensaje sobre "<b>${data.subject}</b>".</p>
      <p>Te responderemos a la brevedad a este email.</p>
      <br/>
      <p>Saludos,<br/>Equipo Bio Origen</p>
    `,
  });
}

// Aviso de alerta de un equipo al cliente (alarma / sin conexión). No lanza: si
// no hay SMTP configurado o el envío falla, devuelve { ok:false }.
export async function sendAlertEmail(
  to: string,
  a: { kind: string; nombre: string; deviceId: string; detail?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, error: "SMTP no configurado" };

  const isAlarm = a.kind === "alarm";
  const titulo = isAlarm ? "🚨 ALARMA del equipo" : "⚠️ Equipo sin conexión";
  const color = isAlarm ? "#dc2626" : "#d97706";
  const subject = `${isAlarm ? "🚨 ALARMA" : "⚠️ Sin conexión"} — ${a.nombre}`;

  try {
    await transporter.sendMail({
      from: fromAddress("Bio Origen"),
      to,
      subject,
      html: `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:auto">
          <div style="background:${color};color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">
            <h2 style="margin:0;font-size:18px">${titulo}</h2>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:20px">
            <p style="margin:0 0 6px"><b>Equipo:</b> ${esc(a.nombre)}</p>
            <p style="margin:0 0 6px;color:#64748b"><b>ID:</b> ${esc(a.deviceId)}</p>
            ${a.detail ? `<p style="margin:10px 0 0;font-size:15px"><b>${esc(a.detail)}</b></p>` : ""}
            <hr style="border:0;border-top:1px solid #e5e7eb;margin:16px 0"/>
            <p style="margin:0;font-size:12px;color:#94a3b8">
              Aviso automático de tu deshidratador Bio Origen.
            </p>
          </div>
        </div>
      `,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
