import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const configs = await prisma.siteConfig.findMany({ orderBy: { key: "asc" } });
  const result = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json()) as Record<string, string>;
  const updates = await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
  return NextResponse.json({ updated: updates.length });
}
