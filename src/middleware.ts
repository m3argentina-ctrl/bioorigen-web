import { withAuth } from "next-auth/middleware";

// Protege el panel de administración (todo /admin salvo el login) y redirige
// al login propio. Las APIs /api/admin/* se protegen además una por una con
// requireAdmin().
//
// OJO: con la carpeta src/, Next.js SÓLO lee el middleware desde
// src/middleware.ts. En la raíz del proyecto se ignora sin avisar: ahí estuvo
// hasta 2026-09 y /admin/* se servía sin sesión (las APIs sí rechazaban).
export default withAuth({
  pages: { signIn: "/admin/login" },
});

export const config = {
  matcher: ["/admin", "/admin/((?!login$).*)"],
};
