import { getRecipes } from "@/lib/queries";
import RecetasContent from "./RecetasContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recetas — Bio Origen",
  description: "Recetas para aprovechar al máximo tu deshidratador Bio Origen. Guías paso a paso para deshidratar frutas, verduras, carnes y más en casa o de forma profesional.",
  alternates: { canonical: "/recetas" },
};

export default async function RecetasPage() {
  const recipes = await getRecipes();
  return <RecetasContent recipes={recipes} />;
}
