import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site } from "../content/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"),
  title: `${site.brand} — ${site.tagline}`,
  description: site.description,
  openGraph: {
    title: site.brand,
    description: site.description,
    locale: site.locale,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme={site.theme}>
      <body>{children}</body>
    </html>
  );
}
