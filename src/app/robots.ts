import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://bioorigen.com.ar";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/checkout/", "/cliente/", "/proveedor/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
