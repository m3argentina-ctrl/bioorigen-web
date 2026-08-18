import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const CONFIG_KEY = "topbar_items";
type TopBarItem = { id: string; icon: string; text: string; active: boolean; order: number };

async function getItems(): Promise<TopBarItem[]> {
  const cfg = await prisma.siteConfig.findUnique({ where: { key: CONFIG_KEY } });
  return cfg ? JSON.parse(cfg.value) : [];
}
async function saveItems(items: TopBarItem[]) {
  await prisma.siteConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value: JSON.stringify(items) },
    create: { key: CONFIG_KEY, value: JSON.stringify(items) },
  });
}

const UpdateSchema = z.object({
  icon: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = UpdateSchema.parse(await request.json());
  const items = await getItems();
  const idx = items.findIndex((i) => i.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  items[idx] = { ...items[idx], ...body };
  await saveItems(items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(_req: Request, { params }: Params) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const items = await getItems();
  await saveItems(items.filter((i) => i.id !== params.id));
  return NextResponse.json({ ok: true });
}
