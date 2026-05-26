import nodemailer from "nodemailer";

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
    from: `"Bio Origen Web" <${process.env.SMTP_USER}>`,
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
    from: `"Bio Origen" <${process.env.SMTP_USER}>`,
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
