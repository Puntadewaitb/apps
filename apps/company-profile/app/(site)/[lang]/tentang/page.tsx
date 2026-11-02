import type { Metadata } from "next";
import { Card, Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../../components/Ajakan";
import { fmt } from "../../../../lib/i18n";
import { getKonten, getUi } from "../../../../lib/konten";
import { langDari, type LangParams } from "../../../../lib/page";
import { pageMeta } from "../../../../lib/seo";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await langDari(params);
  const t = getKonten(lang).tentang;
  return pageMeta({ lang, path: "/tentang", title: t.judul, description: t.pengantar });
}

export default async function TentangPage({ params }: LangParams) {
  const lang = await langDari(params);
  const t = getKonten(lang).tentang;
  const u = getUi(lang).tentang;
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{t.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{t.pengantar}</p>
        </Container>
      </section>

      <Section id="visi-misi" title={u.visiMisi}>
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <h3 className="font-serif text-xl font-bold text-fg">{u.visi}</h3>
            <p className="mt-2 text-muted" data-testid="visi">
              {t.visiMisi.visi}
            </p>
          </Card>
          <Card>
            <h3 className="font-serif text-xl font-bold text-fg">{u.misi}</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted" data-testid="misi">
              {t.visiMisi.misi.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </Card>
        </div>
      </Section>

      <Section id="nilai" tone="surface" title={u.nilai}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.nilai.map((n) => (
            <li key={n.judul}>
              <Card className="h-full">
                <h3 className="font-semibold text-fg">{n.judul}</h3>
                <p className="mt-1 text-muted">{n.teks}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="sejarah" title={t.sejarah.judul}>
        <ol className="relative max-w-3xl space-y-8 border-l-2 border-primary/30 pl-6">
          {t.sejarah.peristiwa.map((p) => (
            <li key={p.tahun} data-testid="peristiwa" className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-bg"
              />
              <time className="text-sm font-semibold text-primary">{p.tahun}</time>
              <h3 className="mt-1 text-lg font-semibold text-fg">{p.judul}</h3>
              <p className="mt-1 text-muted">{p.teks}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="tim" tone="surface" title={t.tim.judul}>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.tim.anggota.map((a) => (
            <li key={a.nama}>
              <Card className="h-full text-center" data-testid="anggota-tim">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.foto}
                  alt={fmt(u.foto, { nama: a.nama })}
                  width={160}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  className="mx-auto h-32 w-32 rounded-full border-4 border-bg object-cover"
                />
                <h3 className="mt-4 font-semibold text-fg">{a.nama}</h3>
                <p className="text-sm font-medium text-primary">{a.jabatan}</p>
                <p className="mt-2 text-sm text-muted">{a.bio}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
      <Ajakan lang={lang} />
    </main>
  );
}
