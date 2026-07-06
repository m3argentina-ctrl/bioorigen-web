import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupplierOrdersInTx, notifySuppliers } from "@/lib/dropshipping";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(order);
}

const UpdateSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "completed", "cancelled", "failed"]),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { status } = UpdateSchema.parse(await request.json());

    let shouldNotify = false;

    const order = await prisma.$transaction(async (tx) => {
      const prev = await tx.order.findUnique({ where: { id: params.id } });
      if (!prev) throw new Error("Orden no encontrada");

      const updated = await tx.order.update({ where: { id: params.id }, data: { status } });

      // Si la orden acaba de pasar a "paid" por primera vez, crear órdenes de proveedor.
      if (status === "paid" && prev.status !== "paid") {
        const created = await createSupplierOrdersInTx(tx, prev);
        if (created) shouldNotify = true;
      }

      return updated;
    });

    // Email a proveedores fuera de la transacción.
    if (shouldNotify) {
      await notifySuppliers(params.id);
    }

    return NextResponse.json(order);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
