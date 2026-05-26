import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    // TODO: conectar con servicio de email marketing (Mailchimp, Brevo, etc.)
    console.log(`[newsletter] nueva suscripción: ${email}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
