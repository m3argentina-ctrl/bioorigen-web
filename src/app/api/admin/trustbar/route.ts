import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const CONFIG_KEY = "trustbar_items";

type TrustBarItem = { id: string; icon: string; title: string; text: string; active: boolean; order: number };

async function getItems(): Promise<TrustBarItem[]> {
  const cfg = await prisma.siteConfig.findUnique({ where: { key: CONFIG_KEY } });
  return cfg ? JSON.parse(cfg.value) : [];
}

async function saveItems(items: TrustBarItem[]) {
  await prisma.siteConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value: JSON.stringify(items) },
    create: { key: CONFIG_KEY, value: JSON.stringify(items) },
  });
}

export async function GET() {
  return NextResponse.json(await getItems());
}

const ItemSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = ItemSchema.parse(await request.json());
  const items = await getItems();
  const newItem: TrustBarItem = { id: crypto.randomUUID(), ...body };
  items.push(newItem);
  await saveItems(items);
  return NextResponse.json(newItem, { status: 201 });
}
