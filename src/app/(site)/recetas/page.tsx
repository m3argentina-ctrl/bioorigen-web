import { getRecipes } from "@/lib/queries";
import RecetasContent from "./RecetasContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recetas — Bio Origen",
  description: "Recetas con alimentos deshidratados Bio Origen",
};

export default async function RecetasPage() {
  const recipes = await getRecipes();
  return <RecetasContent recipes={recipes} />;
}
