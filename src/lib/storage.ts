import { createClient } from "@supabase/supabase-js";

const BUCKET = "bioorigen";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  return createClient(url, key);
}

const ALLOWED_MIME = ["image/*", "video/*", "application/pdf"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureBucket(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b: { name: string }) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true, allowedMimeTypes: ALLOWED_MIME });
  } else {
    await supabase.storage.updateBucket(BUCKET, { public: true, allowedMimeTypes: ALLOWED_MIME });
  }
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: "images" | "datasheets" | "videos",
): Promise<string> {
  const supabase = getClient();
  await ensureBucket(supabase);

  const ext = fileName.split(".").pop() ?? "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteStorageFile(publicUrl: string) {
  try {
    const supabase = getClient();
    const marker = `/${BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const path = publicUrl.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // No bloquear si falla el delete en storage
  }
}
