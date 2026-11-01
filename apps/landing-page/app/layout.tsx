import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Tracking } from "../components/Tracking";
import { site } from "../content/site";
import { siteUrl } from "../lib/seo";
import { resolveTheme } from "../lib/theme";
import "./globals.css";

const title = `${site.brand} — ${site.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: `%s | ${site.brand}` },
  description: site.description,
  applicationName: site.brand,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description: site.description,
    siteName: site.brand,
    locale: site.locale,
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image", title, description: site.description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme={resolveTheme(process.env.NEXT_PUBLIC_THEME, site.theme)}>
      <body>
        {children}
        <Tracking />
      </body>
    </html>
  );
}
