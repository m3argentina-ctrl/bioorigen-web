import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ClientePanel from "./ClientePanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mis equipos · Bio Origen",
  robots: { index: false, follow: false }, // link privado: no indexar
};

export default async function ClientePage({
  params,
}: {
  params: { token: string };
}) {
  const cliente = await prisma.cliente.findUnique({
    where: { accessToken: params.token },
    select: { nombre: true },
  });

  if (!cliente) notFound();

  return <ClientePanel token={params.token} clienteNombre={cliente.nombre} />;
}
