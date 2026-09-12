import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim() || "https://bioorigen.com.ar";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0f1f0f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px 30px",
        }}
      >
        {/* Banner con los 3 modelos (cargado por URL pública) */}
        <img
          src={`${siteUrl}/og-banner.png`}
          width={1120}
          height={355}
          style={{ objectFit: "cover", objectPosition: "center" }}
        />

        {/* Texto debajo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            Hornos deshidratadores Bio Origen
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#7ec86a",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Línea Familiar y Comercial · Fabricación argentina · bioorigen.com.ar
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
