import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteShell } from "../../../components/SiteShell";
import { HTML_LANG, LANGS, OG_LOCALE, isLang } from "../../../lib/i18n";
import { getKonten } from "../../../lib/konten";
import "../../globals.css";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

type Props = { children: ReactNode; params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const k = getKonten(lang);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"),
    title: {
      default: `${k.perusahaan.nama} — ${k.perusahaan.tagline}`,
      template: `%s | ${k.perusahaan.nama}`,
    },
    description: k.perusahaan.deskripsi,
    applicationName: k.perusahaan.nama,
    openGraph: {
      title: k.perusahaan.nama,
      description: k.perusahaan.deskripsi,
      siteName: k.perusahaan.nama,
      locale: OG_LOCALE[lang],
      type: "website",
    },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const k = getKonten(lang);
  return (
    <html lang={HTML_LANG[lang]} data-theme={k.tema}>
      <body>
        <SiteShell lang={lang}>{children}</SiteShell>
      </body>
    </html>
  );
}
