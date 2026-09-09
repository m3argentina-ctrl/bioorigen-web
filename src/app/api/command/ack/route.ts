import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AckSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(10),
});

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function POST(req: Request) {
  const token = bearer(req);
  if (!token) {
    return NextResponse.json({ error: "falta token" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = AckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ids requeridos" }, { status: 422 });
  }

  // Buscar los comandos y verificar que todos pertenecen al mismo equipo
  // cuyo token coincide.
  const comandos = await prisma.comando.findMany({
    where: { id: { in: parsed.data.ids }, status: "sent" },
    include: { equipo: { select: { token: true } } },
  });

  const now = new Date();
  let acked = 0;
  for (const cmd of comandos) {
    if (safeEqual(token, cmd.equipo.token)) {
      await prisma.comando.update({
        where: { id: cmd.id },
        data: { status: "acked", ackedAt: now },
      });
      acked++;
    }
  }

  return NextResponse.json({ acked });
}
