import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const msg = await prisma.contactMessage.findUnique({ where: { id: params.id } });
  if (!msg) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (msg.status === "unread") {
    await prisma.contactMessage.update({ where: { id: params.id }, data: { status: "read" } });
    return NextResponse.json({ ...msg, status: "read" });
  }

  return NextResponse.json(msg);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { status } = body as { status?: string };
  if (!status || !["unread", "read", "replied"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 422 });
  }

  const updated = await prisma.contactMessage.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.contactMessage.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
