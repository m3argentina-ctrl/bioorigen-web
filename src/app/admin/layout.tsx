import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminShell from "./AdminShell";
import { prisma } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Login page: sin sidebar, solo centrado.
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        {children}
      </div>
    );
  }

  const unreadContactCount = await prisma.contactMessage.count({
    where: { status: "unread" },
  });

  return (
    <AdminShell userName={session.user?.name ?? null} unreadContactCount={unreadContactCount}>
      {children}
    </AdminShell>
  );
}
