// OVERLAY sample statis: filter portofolio sebagai halaman statis per kategori (menggantikan ?kategori=).
import type { Metadata } from "next";
import { LANGS } from "../../../../../../lib/i18n";
import { getKonten } from "../../../../../../lib/konten";
import { langDari } from "../../../../../../lib/page";
import { pageMeta } from "../../../../../../lib/seo";
import { PortofolioIsi } from "../../page";

type Props = { params: Promise<{ lang: string; id: string }> };

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    getKonten(lang).portofolio.kategori.map((c) => ({ lang, id: c.id })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await langDari(params);
  const { id } = await params;
  const p = getKonten(lang).portofolio;
  return pageMeta({
    lang,
    path: `/portofolio/kategori/${id}`,
    title: p.judul,
    description: p.pengantar,
  });
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params;
  return PortofolioIsi({ params: Promise.resolve({ lang }), kategori: id });
}
