import { getRecipes } from "@/lib/queries";
import RecetasContent from "./RecetasContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recetas — Bio Origen",
  description: "Recetas saludables con frutas deshidratadas, charqui y snacks naturales Bio Origen. Fácil preparación, ingredientes artesanales sin conservantes.",
  alternates: { canonical: "/recetas" },
};

export default async function RecetasPage() {
  const recipes = await getRecipes();
  return <RecetasContent recipes={recipes} />;
}
