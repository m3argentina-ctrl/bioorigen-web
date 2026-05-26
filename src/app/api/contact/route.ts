import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendContactNotification } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  subject: z.enum(["Consulta sobre productos", "Consulta sobre envíos", "Soporte técnico", "Mayoristas", "Otro"]),
  message: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 422 });
  }

  const msg = await prisma.contactMessage.create({ data: parsed.data });

  // Email en background — no bloquea la respuesta
  sendContactNotification(parsed.data).catch(() => null);

  return NextResponse.json({ ok: true, id: msg.id });
}
