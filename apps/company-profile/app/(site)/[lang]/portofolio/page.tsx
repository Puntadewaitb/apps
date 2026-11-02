import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { Ajakan } from "../../../../components/Ajakan";
import { ProyekKartu } from "../../../../components/ProyekKartu";
import { fmt, localizeHref } from "../../../../lib/i18n";
import { getKonten, getUi, kategoriValid, proyekPerKategori } from "../../../../lib/konten";
import { langDari } from "../../../../lib/page";
import { pageMeta } from "../../../../lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ kategori?: string | string[] }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const lang = await langDari(params);
  const p = getKonten(lang).portofolio;
  // Canonical tanpa ?kategori= agar variasi filter tidak dianggap halaman duplikat.
  return pageMeta({ lang, path: "/portofolio", title: p.judul, description: p.pengantar });
}

export default async function PortofolioPage({ params, searchParams }: Props) {
  const lang = await langDari(params);
  const p = getKonten(lang).portofolio;
  const u = getUi(lang);
  const aktif = kategoriValid((await searchParams).kategori, lang);
  const daftar = proyekPerKategori(aktif, lang);
  const dasar = localizeHref(lang, "/portofolio");

  const chip = (aktifChip: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium ${
      aktifChip
        ? "border-primary bg-primary text-primary-fg"
        : "border-border bg-bg text-fg hover:bg-surface"
    }`;

  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{p.judul}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{p.pengantar}</p>
        </Container>
      </section>

      <Section id="proyek" title="">
        {/* Filter berbasis URL (?kategori=): berfungsi tanpa JavaScript & bisa dibagikan */}
        <nav aria-label={p.filter.label} className="mb-8 flex flex-wrap gap-2">
          <a href={dasar} aria-current={aktif ? undefined : "true"} className={chip(!aktif)}>
            {p.filter.semua}
          </a>
          {p.kategori.map((c) => (
            <a
              key={c.id}
              href={`${dasar}?kategori=${c.id}`}
              aria-current={aktif === c.id ? "true" : undefined}
              className={chip(aktif === c.id)}
            >
              {c.nama}
            </a>
          ))}
        </nav>

        <p className="mb-4 text-sm text-muted" role="status" data-testid="jumlah-proyek">
          {fmt(daftar.length === 1 ? u.proyek.jumlahSatu : u.proyek.jumlah, { n: daftar.length })}
        </p>
        {daftar.length === 0 ? (
          <p className="text-muted">{p.filter.kosong}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((x) => (
              <li key={x.slug}>
                <ProyekKartu p={x} lang={lang} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-sm text-muted">{p.catatan}</p>
      </Section>
      <Ajakan lang={lang} />
    </main>
  );
}
