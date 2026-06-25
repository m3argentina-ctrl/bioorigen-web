import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-auth";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_IMAGE_MB = 5;
const MAX_PDF_MB = 20;
const MAX_VIDEO_MB = 200;
const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOCS = ["application/pdf"];
const ALLOWED_VIDEOS = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

const IMAGE_MAX_PX = 1200;

async function resizeImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mime: string }> {
  // GIF animado: no redimensionar para no perder animación
  if (mimeType === "image/gif") return { buffer, mime: mimeType };

  const resized = await sharp(buffer)
    .resize(IMAGE_MAX_PX, IMAGE_MAX_PX, {
      fit: "inside",        // mantiene proporciones, nunca agranda
      withoutEnlargement: true,
    })
    .webp({ quality: 85 }) // convierte todo a WebP
    .toBuffer();

  return { buffer: resized, mime: "image/webp" };
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const type = (form.get("type") as string) ?? "image";

    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const isImage = type === "image";
    const isVideo = type === "video";
    const allowed = isImage ? ALLOWED_IMAGES : isVideo ? ALLOWED_VIDEOS : ALLOWED_DOCS;
    const maxMb = isImage ? MAX_IMAGE_MB : isVideo ? MAX_VIDEO_MB : MAX_PDF_MB;

    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: `Tipo no permitido: ${file.type}` }, { status: 400 });
    }
    if (file.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Archivo demasiado grande (máx ${maxMb} MB)` }, { status: 400 });
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    let mimeType = file.type;
    const folder = isImage ? "images" : isVideo ? "videos" : "datasheets";

    if (isImage) {
      const processed = await resizeImage(buffer, mimeType);
      buffer = processed.buffer;
      mimeType = processed.mime;
    }

    const url = await uploadFile(buffer, file.name, mimeType, folder);

    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al subir archivo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
