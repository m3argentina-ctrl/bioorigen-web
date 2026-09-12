import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bannerData = await readFile(join(process.cwd(), "public/og-banner.png"));
  const bannerSrc = `data:image/png;base64,${bannerData.toString("base64")}`;

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
        {/* Banner con los 3 modelos */}
        <img
          src={bannerSrc}
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
