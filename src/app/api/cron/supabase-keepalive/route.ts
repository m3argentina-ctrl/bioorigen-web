import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Keepalive del proyecto Supabase (free tier: se pausa a los ~7 días sin actividad).
 *
 * IMPORTANTE: la base de datos de la app es Neon, NO Supabase. De Supabase solo se
 * usa Storage (imágenes/videos/fichas). Por eso el Postgres de Supabase queda 100%
 * ocioso y el proyecto se pausa igual aunque las imágenes se sirvan.
 * → Este endpoint toca A PROPÓSITO las dos superficies: base de datos y storage.
 *
 * Disparadores (redundantes a propósito):
 *   1. GitHub Actions .github/workflows/supabase-keepalive.yml  ← el confiable
 *   2. Cron de Vercel en vercel.json                            ← respaldo
 * Los crons del plan Hobby de Vercel son best-effort: no alcanzan por sí solos.
 */

type PingResult = { ok: boolean; detail: string };

function authorize(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Distinto de un token inválido: acá el problema es de configuración y hay
    // que verlo enseguida, no confundirlo con un 401 genérico.
    return { ok: false, status: 503, error: "CRON_SECRET no está definido en el entorno" };
  }
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!m || m[1].trim() !== secret) {
    return { ok: false, status: 401, error: "no autorizado" };
  }
  return { ok: true };
}

/** Lectura real contra el Postgres de Supabase (vía PostgREST). */
async function pingDatabase(url: string, key: string): Promise<PingResult> {
  const supabase = createClient(url, key);
  // Tablas que quedaron de antes de migrar a Neon. Si alguna desaparece,
  // se cae al catálogo de PostgREST, que también consulta la base.
  for (const table of ["Product", "SiteConfig"]) {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
    if (!error) return { ok: true, detail: `select head en "${table}"` };
  }
  const r = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!r.ok) return { ok: false, detail: `PostgREST respondió HTTP ${r.status}` };
  return { ok: true, detail: "catálogo de PostgREST" };
}

async function pingStorage(url: string, key: string): Promise<PingResult> {
  const supabase = createClient(url, key);
  const { data, error } = await supabase.storage.listBuckets();
  if (error) return { ok: false, detail: error.message };
  return { ok: true, detail: `buckets: ${(data ?? []).map((b) => b.name).join(", ") || "ninguno"}` };
}

async function handle(req: Request) {
  const auth = authorize(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 },
    );
  }

  const started = Date.now();
  const [database, storage] = await Promise.all([
    pingDatabase(url, key).catch((e) => ({ ok: false, detail: String(e?.message ?? e) })),
    pingStorage(url, key).catch((e) => ({ ok: false, detail: String(e?.message ?? e) })),
  ]);

  // La base es la que evita la pausa; storage solo no alcanza.
  const ok = database.ok && storage.ok;
  return NextResponse.json(
    { ok, ms: Date.now() - started, ts: new Date().toISOString(), database, storage },
    { status: ok ? 200 : 500 },
  );
}

export const GET = handle;
export const POST = handle;
