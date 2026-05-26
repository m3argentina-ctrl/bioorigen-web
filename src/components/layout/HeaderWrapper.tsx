import Header from "./Header";
import { prisma } from "@/lib/db";

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    });
  } catch {
    return [];
  }
}

export default async function HeaderWrapper() {
  const categories = await getCategories();
  return <Header categories={categories} />;
}
