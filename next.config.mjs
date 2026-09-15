/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Sin optimización de Vercel: las imágenes ya se suben redimensionadas a 1200px WebP
    // (api/admin/upload) y así no se consume el cupo de Image Transformations del plan Hobby.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "bioorigen.com.ar" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "https", hostname: "acdn-us.mitiendanube.com" },
    ],
  },
};

export default nextConfig;
