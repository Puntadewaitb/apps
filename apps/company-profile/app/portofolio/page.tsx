import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { Ajakan } from "../../components/Ajakan";
import { ProyekKartu } from "../../components/ProyekKartu";
import { getKonten, kategoriValid, proyekPerKategori } from "../../lib/konten";

const k = getKonten();

export const metadata: Metadata = {
  title: k.portofolio.judul,
  description: k.portofolio.pengantar,
};

type Props = { searchParams: Promise<{ kategori?: string | string[] }> };

export default async function PortofolioPage({ searchParams }: Props) {
  const p = k.portofolio;
  const aktif = kategoriValid((await searchParams).kategori);
  const daftar = proyekPerKategori(aktif);

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
          <a href="/portofolio" aria-current={aktif ? undefined : "true"} className={chip(!aktif)}>
            {p.filter.semua}
          </a>
          {p.kategori.map((c) => (
            <a
              key={c.id}
              href={`/portofolio?kategori=${c.id}`}
              aria-current={aktif === c.id ? "true" : undefined}
              className={chip(aktif === c.id)}
            >
              {c.nama}
            </a>
          ))}
        </nav>

        <p className="mb-4 text-sm text-muted" role="status" data-testid="jumlah-proyek">
          {daftar.length} proyek
        </p>
        {daftar.length === 0 ? (
          <p className="text-muted">{p.filter.kosong}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((x) => (
              <li key={x.slug}>
                <ProyekKartu p={x} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-sm text-muted">{p.catatan}</p>
      </Section>
      <Ajakan />
    </main>
  );
}
