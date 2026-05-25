import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Build a synthetic request carrying the current cookies so getToken can
  // read the next-auth session token without needing the raw Request object.
  const req = new NextRequest("http://localhost", {
    headers: { cookie: cookieHeader },
  });

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}
