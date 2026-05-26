"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, LogOut } from "lucide-react";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminShell({
  children,
  userName,
  unreadContactCount = 0,
}: {
  children: React.ReactNode;
  userName: string | null;
  unreadContactCount?: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar userName={userName} unreadContactCount={unreadContactCount} />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar userName={userName} onClose={() => setSidebarOpen(false)} unreadContactCount={unreadContactCount} />
          </div>
        </>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-700 lg:ml-0">
            Panel de Administración
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
