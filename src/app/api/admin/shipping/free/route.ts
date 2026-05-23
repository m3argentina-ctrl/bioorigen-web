import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const configs = await prisma.freeShippingConfig.findMany({
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(configs);
}

const Schema = z.object({
  enabled:       z.boolean().default(true),
  name:          z.string().min(1),
  type:          z.enum(["minimum_amount", "always", "never", "by_product", "by_category", "by_date", "by_location", "by_coupon"]),
  minimumAmount: z.number().positive().optional().nullable(),
  campaignName:  z.string().optional().nullable(),
  startDate:     z.string().optional().nullable(),
  endDate:       z.string().optional().nullable(),
  freeZipCodes:  z.array(z.string()).default([]),
  productIds:    z.array(z.string()).default([]),
  categories:    z.array(z.string()).default([]),
  couponCode:    z.string().optional().nullable(),
  applyAndreani: z.boolean().default(true),
  applyCorreo:   z.boolean().default(true),
  priority:      z.number().int().default(0),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = Schema.parse(await request.json());
    const config = await prisma.freeShippingConfig.create({
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate:   body.endDate   ? new Date(body.endDate)   : null,
      },
    });
    return NextResponse.json(config, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues }, { status: 400 });
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}
