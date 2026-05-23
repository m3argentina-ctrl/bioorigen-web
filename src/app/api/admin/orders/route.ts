import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";

  const orders = await prisma.order.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: "insensitive" } },
              { customerEmail: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

const BulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["pending", "paid", "shipped", "completed", "cancelled", "failed"]),
});

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = BulkStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { ids, status } = parsed.data;
  await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status } });
  return NextResponse.json({ updated: ids.length });
}

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export async function DELETE(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = BulkDeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { ids } = parsed.data;
  await prisma.order.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: ids.length });
}
