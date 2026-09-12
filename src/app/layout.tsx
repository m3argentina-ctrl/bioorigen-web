import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

// Usar || (no ??) para que un valor vacío "" también caiga al default.
const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.trim() || "http://localhost:3000";
const title = "Bio Origen — Hornos deshidratadores para alimentos";
const description =
  "Fabricamos hornos deshidratadores para alimentos. Equipos familiares y comerciales. Envíos a todo el país.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  verification: { google: "f-zvhAa1Y7_qTC6MOuxYhJIBxil7hdkjArfhPYxVqgU" },
  title,
  description,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Bio Origen",
    locale: "es_AR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Bio Origen — Hornos deshidratadores" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${sans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
