import type { Metadata } from "next";
import { ButtonLink, Container } from "@tpl/ui";
import { localizeHref } from "../../../../lib/i18n";
import { getUi } from "../../../../lib/konten";
import { langDari, type LangParams } from "../../../../lib/page";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await langDari(params);
  return {
    title: getUi(lang).notFound.judul,
    robots: { index: false, follow: true },
  };
}

/**
 * Halaman 404. Tidak dirender lewat `notFound()`: dengan root layout dinamis `[lang]` Next menyajikan
 * cangkang error (tanpa HTML sisi-server). Sebagai gantinya `proxy.ts` me-rewrite URL tak dikenal ke sini
 * dengan status 404, sehingga 404 tampil penuh (navbar/footer, bahasa benar) bahkan tanpa JavaScript.
 */
export default async function TidakDitemukan({ params }: LangParams) {
  const lang = await langDari(params);
  const u = getUi(lang).notFound;
  return (
    <main id="isi" className="py-24">
      <Container className="max-w-xl text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold text-fg">{u.judul}</h1>
        <p className="mt-3 text-muted">{u.teks}</p>
        <ButtonLink href={localizeHref(lang, "/")} className="mt-8">
          {u.kembali}
        </ButtonLink>
      </Container>
    </main>
  );
}
