import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminShell from "./AdminShell";

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

  return (
    <AdminShell userName={session.user?.name ?? null}>
      {children}
    </AdminShell>
  );
}
