import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      customerName: true,
      items: true,
      subtotal: true,
      shipping: true,
      discount: true,
      total: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  return NextResponse.json(order);
}
