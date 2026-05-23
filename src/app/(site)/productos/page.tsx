import { getProducts } from "@/lib/queries";
import { prisma } from "@/lib/db";
import ProductsBrowser from "./ProductsBrowser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Productos — Bio Origen",
};

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const [products, dbCategories] = await Promise.all([
    getProducts(),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  const initialCategory = searchParams.categoria ?? "todos";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-bio-dark">
        Nuestros productos
      </h1>
      <p className="mt-2 text-bio-dark/70">
        Alimentos deshidratados elaborados de forma artesanal.
      </p>

      {products.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-8 text-center text-sm text-bio-dark/60 shadow-card">
          No hay productos cargados todavía.
        </p>
      ) : (
        <ProductsBrowser
          products={products}
          initialCategory={initialCategory}
          dbCategories={dbCategories}
        />
      )}
    </div>
  );
}
