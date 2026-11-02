import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../../components/Ajakan";
import { LayananKartu } from "../../../../components/LayananKartu";
import { getKonten } from "../../../../lib/konten";
import { langDari, type LangParams } from "../../../../lib/page";
import { pageMeta } from "../../../../lib/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await langDari(params);
  const h = getKonten(lang).layananHalaman;
  return pageMeta({ lang, path: "/layanan", title: h.judul, description: h.pengantar });
}

export default async function LayananPage({ params }: LangParams) {
  const lang = await langDari(params);
  const k = getKonten(lang);
  const h = k.layananHalaman;
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{h.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{h.pengantar}</p>
        </Container>
      </section>
      <Section id="daftar-layanan" title="">
        <ul className="grid gap-6 sm:grid-cols-2">
          {k.layanan.map((l) => (
            <li key={l.slug}>
              <LayananKartu l={l} cta={h.cta} lang={lang} judulTag="h2" />
            </li>
          ))}
        </ul>
      </Section>
      <Ajakan lang={lang} />
    </main>
  );
}
