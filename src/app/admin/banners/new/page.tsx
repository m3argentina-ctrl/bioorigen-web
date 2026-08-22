"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import BannerForm from "@/components/admin/BannerForm";

export default function NewBannerPage() {
  const router = useRouter();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/banners" className="text-sm text-slate-400 hover:text-slate-600">
          ← Banners
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Nuevo Banner</h1>
      </div>
      <BannerForm onSaved={() => router.push("/admin/banners")} />
    </div>
  );
}
