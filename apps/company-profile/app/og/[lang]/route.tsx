import { ImageResponse } from "next/og";
import { LANGS, isLang } from "../../../lib/i18n";
import { getKonten } from "../../../lib/konten";

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

/** Gambar OpenGraph 1200×630 dibuat dari konten (tanpa aset eksternal). */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) return new Response("Not found", { status: 404 });
  const k = getKonten(lang);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      <div style={{ fontSize: 40, color: "#38bdf8", fontWeight: 700 }}>{k.perusahaan.nama}</div>
      <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.15, marginTop: 24 }}>
        {k.hero.judul}
      </div>
      <div style={{ fontSize: 30, color: "#cbd5e1", marginTop: 32 }}>{k.perusahaan.tagline}</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
