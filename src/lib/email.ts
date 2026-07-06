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

// ---------------------------------------------------------------------------
// Dropshipping — email al proveedor con la nueva orden
// ---------------------------------------------------------------------------
export async function sendSupplierOrderEmail(data: {
  supplierName: string;
  supplierEmail: string;
  supplierOrderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  items: Array<{ name: string; quantity: number }>;
  confirmUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, error: "SMTP no configurado" };

  const itemsHtml = data.items
    .map((i) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${esc(i.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td></tr>`)
    .join("");

  try {
    await transporter.sendMail({
      from: fromAddress("Bio Origen"),
      to: data.supplierEmail,
      subject: `Nueva orden de venta #${data.supplierOrderId.slice(-8).toUpperCase()} — Bio Origen`,
      html: `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:auto">
          <div style="background:#4A7C59;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="margin:0;font-size:20px">Nueva orden de envío directo</h2>
            <p style="margin:6px 0 0;opacity:.85;font-size:14px">Bio Origen — Orden #${esc(data.supplierOrderId.slice(-8).toUpperCase())}</p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px">
            <h3 style="margin:0 0 12px;font-size:16px;color:#1e293b">Datos del comprador</h3>
            <p style="margin:0 0 4px"><b>Nombre:</b> ${esc(data.customerName)}</p>
            <p style="margin:0 0 4px"><b>Teléfono:</b> ${esc(data.customerPhone)}</p>
            <p style="margin:0 0 4px"><b>Email:</b> ${esc(data.customerEmail)}</p>
            <p style="margin:0 0 16px"><b>Dirección de envío:</b><br/>${esc(data.shippingAddress).replace(/\n/g, "<br/>")}</p>
            <h3 style="margin:0 0 12px;font-size:16px;color:#1e293b">Productos a enviar</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">Producto</th>
                  <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">Cant.</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div style="margin-top:24px;text-align:center">
              <a href="${data.confirmUrl}"
                 style="display:inline-block;background:#4A7C59;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px">
                Confirmar envío / Ingresar tracking
              </a>
            </div>
            <p style="margin-top:20px;font-size:12px;color:#94a3b8;text-align:center">
              Por favor confirmá el envío ingresando el número de seguimiento tan pronto como despaches el pedido.<br/>
              Esto permite a Bio Origen informarle al cliente sobre el estado de su compra.
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

// Email al cliente informando que su paquete fue despachado.
export async function sendTrackingNotification(data: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  items: Array<{ name: string; quantity: number }>;
}): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, error: "SMTP no configurado" };

  const itemsHtml = data.items
    .map((i) => `<li>${esc(i.name)} × ${i.quantity}</li>`)
    .join("");

  try {
    await transporter.sendMail({
      from: fromAddress("Bio Origen"),
      to: data.customerEmail,
      subject: `Tu pedido está en camino — Bio Origen`,
      html: `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:auto">
          <div style="background:#4A7C59;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="margin:0;font-size:20px">¡Tu pedido está en camino! 🚚</h2>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px">
            <p>Hola <b>${esc(data.customerName)}</b>,</p>
            <p>Tu pedido fue despachado. Podés rastrearlo con los datos a continuación:</p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 6px"><b>Transportista:</b> ${esc(data.carrier)}</p>
              <p style="margin:0"><b>Número de seguimiento:</b> <span style="font-size:18px;font-weight:700;letter-spacing:2px">${esc(data.trackingNumber)}</span></p>
            </div>
            <p><b>Productos enviados:</b></p>
            <ul style="margin:0 0 16px;padding-left:20px;font-size:14px">${itemsHtml}</ul>
            <p style="font-size:13px;color:#64748b">Si tenés alguna consulta, respondé este email o escribinos a través de nuestro sitio.</p>
            <br/>
            <p>¡Muchas gracias por tu compra!<br/><b>Equipo Bio Origen</b></p>
          </div>
        </div>
      `,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
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
