"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BannerForm from "@/components/admin/BannerForm";
import type { Banner } from "@/types/banner";

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    fetch(`/api/admin/banners/${id}`)
      .then((r) => r.json())
      .then((data) =>
        setBanner({
          ...data,
          startsAt: data.startsAt ? new Date(data.startsAt).toISOString().slice(0, 16) : null,
          endsAt: data.endsAt ? new Date(data.endsAt).toISOString().slice(0, 16) : null,
        }),
      );
  }, [id]);

  if (!banner) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-bio-green border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/banners" className="text-sm text-slate-400 hover:text-slate-600">
          ← Banners
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Editar Banner</h1>
      </div>
      <BannerForm banner={banner} onSaved={() => router.push("/admin/banners")} />
    </div>
  );
}
