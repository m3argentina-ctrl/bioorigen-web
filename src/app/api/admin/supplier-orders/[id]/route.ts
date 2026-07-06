import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const so = await prisma.supplierOrder.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      order: { select: { id: true, total: true, customerName: true, paymentStatus: true } },
    },
  });
  if (!so) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(so);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = await request.json();
  const { status, trackingNumber, carrier, adminNotes } = body;

  const now = new Date();
  const timestamps: Record<string, Date | null> = {};
  if (status === "shipped") timestamps.shippedAt = now;
  if (status === "delivered") timestamps.deliveredAt = now;
  if (status === "paid") timestamps.paidAt = now;

  const updated = await prisma.supplierOrder.update({
    where: { id: params.id },
    data: {
      ...(status ? { status } : {}),
      ...(trackingNumber !== undefined ? { trackingNumber: trackingNumber || null } : {}),
      ...(carrier !== undefined ? { carrier: carrier || null } : {}),
      ...(adminNotes !== undefined ? { adminNotes: adminNotes || null } : {}),
      ...timestamps,
    },
  });
  return NextResponse.json(updated);
}
