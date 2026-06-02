import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Token de acceso del cliente: 24 bytes → base64url (~32 chars). Es la credencial
// del link privado /cliente/<token> (la ruta pública exige length >= 12).
function genAccessToken() {
  return randomBytes(24).toString("base64url");
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: {
      equipos: {
        select: { id: true, deviceId: true, nombre: true, activo: true },
        orderBy: { deviceId: "asc" },
      },
    },
  });
  return NextResponse.json(clientes);
}

const CreateSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.union([z.string().trim().email(), z.literal(""), z.null()]).optional(),
  telegramChatId: z.string().trim().optional().nullable(),
  notifyChannel: z.enum(["ninguno", "email", "telegram", "ambos"]).optional(),
  notas: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = CreateSchema.parse(await request.json());
    const cliente = await prisma.cliente.create({
      data: {
        nombre: body.nombre,
        email: body.email ? body.email : null,
        telegramChatId: body.telegramChatId || null,
        notifyChannel: body.notifyChannel ?? "ambos",
        notas: body.notas || null,
        accessToken: genAccessToken(),
      },
    });
    return NextResponse.json(cliente, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al crear (¿email duplicado?)" },
      { status: 409 },
    );
  }
}
