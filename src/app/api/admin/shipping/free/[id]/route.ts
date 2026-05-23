import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const UpdateSchema = z.object({
  enabled:       z.boolean().optional(),
  name:          z.string().min(1).optional(),
  type:          z.enum(["minimum_amount", "always", "never", "by_product", "by_category", "by_date", "by_location", "by_coupon"]).optional(),
  minimumAmount: z.number().positive().optional().nullable(),
  campaignName:  z.string().optional().nullable(),
  startDate:     z.string().optional().nullable(),
  endDate:       z.string().optional().nullable(),
  freeZipCodes:  z.array(z.string()).optional(),
  productIds:    z.array(z.string()).optional(),
  categories:    z.array(z.string()).optional(),
  couponCode:    z.string().optional().nullable(),
  applyAndreani: z.boolean().optional(),
  applyCorreo:   z.boolean().optional(),
  priority:      z.number().int().optional(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());
    const config = await prisma.freeShippingConfig.update({
      where: { id: params.id },
      data: {
        ...body,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        endDate:   body.endDate   !== undefined ? (body.endDate   ? new Date(body.endDate)   : null) : undefined,
      },
    });
    return NextResponse.json(config);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.freeShippingConfig.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
