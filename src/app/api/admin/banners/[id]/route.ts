import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const banner = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!banner) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(banner);
}

const UpdateSchema = z.object({
  imageUrl: z.string().optional(),
  imageUrlMobile: z.string().optional().nullable(),
  alt: z.string().optional(),
  eyebrow: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  ctaNewTab: z.boolean().optional(),
  href: z.string().optional().nullable(),
  align: z.enum(["left", "center", "right"]).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  overlay: z.number().min(0).max(1).optional(),
  height: z.enum(["small", "medium", "large", "full"]).optional(),
  textColor: z.string().optional().nullable(),
  ctaColor: z.string().optional().nullable(),
  ctaTextColor: z.string().optional().nullable(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = UpdateSchema.parse(await request.json());
    const data = {
      ...body,
      ...(body.startsAt !== undefined && { startsAt: body.startsAt ? new Date(body.startsAt) : null }),
      ...(body.endsAt !== undefined && { endsAt: body.endsAt ? new Date(body.endsAt) : null }),
    };
    const banner = await prisma.banner.update({ where: { id: params.id }, data });
    return NextResponse.json(banner);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ errors: e.issues.map(i => i.message) }, { status: 422 });
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.banner.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
