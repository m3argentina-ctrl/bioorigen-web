import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const h = req.headers.get("authorization") ?? "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() === secret : false;
}

async function ping() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan credenciales de Supabase");

  const supabase = createClient(url, key);
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  return { buckets: data?.map((b) => b.name) ?? [] };
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  try {
    const result = await ping();
    return NextResponse.json({ ok: true, ts: Date.now(), ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
