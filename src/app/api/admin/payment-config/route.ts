import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  bankTransferEnabled: z.boolean(),
  bankTransferDiscount: z.number().int().min(0).max(50),
  bankName: z.string().max(100),
  bankHolder: z.string().max(100),
  bankCbu: z.string().max(30),
  bankAlias: z.string().max(50),
  bankNote: z.string().max(300),
  openpayEnabled: z.boolean(),
});

async function getConfig() {
  const cfg = await prisma.paymentConfig.findFirst();
  if (cfg) return cfg;
  return prisma.paymentConfig.create({ data: {} });
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  return NextResponse.json(await getConfig());
}

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const cfg = await getConfig();
  const updated = await prisma.paymentConfig.update({
    where: { id: cfg.id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}
