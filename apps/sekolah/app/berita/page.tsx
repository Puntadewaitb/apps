import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { PostKartu } from "../../components/PostKartu";
import { daftarBerita, parseHalaman, parseJenis } from "../../lib/berita";

export const metadata: Metadata = {
  title: "Berita & Pengumuman",
  description: "Kabar terbaru, prestasi, dan pengumuman resmi sekolah.",
};
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ jenis?: string | string[]; halaman?: string | string[] }> };

const chip = (on: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium ${
    on
      ? "border-primary bg-primary text-primary-fg"
      : "border-border bg-bg text-fg hover:bg-surface"
  }`;

function href(jenis: string | undefined, halaman: number) {
  const q = new URLSearchParams();
  if (jenis) q.set("jenis", jenis);
  if (halaman > 1) q.set("halaman", String(halaman));
  const s = q.toString();
  return s ? `/berita?${s}` : "/berita";
}

export default async function BeritaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const kind = parseJenis(sp.jenis);
  const jenis = kind?.toLowerCase();
  const { items, total, halaman, jumlahHalaman } = await daftarBerita({
    kind,
    halaman: parseHalaman(sp.halaman),
  });
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">Berita & Pengumuman</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">
            Kabar terbaru, prestasi, dan pengumuman resmi sekolah.
          </p>
        </Container>
      </section>
      <Section id="daftar-berita" title="">
        {/* Filter berbasis URL: berfungsi tanpa JavaScript & bisa dibagikan */}
        <nav aria-label="Jenis tulisan" className="mb-6 flex flex-wrap gap-2">
          <a href="/berita" aria-current={kind ? undefined : "true"} className={chip(!kind)}>
            Semua
          </a>
          <a
            href="/berita?jenis=berita"
            aria-current={jenis === "berita" ? "true" : undefined}
            className={chip(jenis === "berita")}
          >
            Berita
          </a>
          <a
            href="/berita?jenis=pengumuman"
            aria-current={jenis === "pengumuman" ? "true" : undefined}
            className={chip(jenis === "pengumuman")}
          >
            Pengumuman
          </a>
        </nav>
        <p className="mb-4 text-sm text-muted" role="status" data-testid="jumlah-berita">
          {total} tulisan
        </p>
        {items.length === 0 ? (
          <p className="text-muted">Belum ada tulisan.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li key={p.id}>
                <PostKartu p={p} judulTag="h2" />
              </li>
            ))}
          </ul>
        )}
        {jumlahHalaman > 1 && (
          <nav
            aria-label="Halaman"
            className="mt-8 flex flex-wrap items-center gap-2"
            data-testid="paginasi"
          >
            {halaman > 1 && (
              <a href={href(jenis, halaman - 1)} rel="prev" className={chip(false)}>
                ← Sebelumnya
              </a>
            )}
            {Array.from({ length: jumlahHalaman }, (_, i) => i + 1).map((n) => (
              <a
                key={n}
                href={href(jenis, n)}
                aria-current={n === halaman ? "page" : undefined}
                className={chip(n === halaman)}
              >
                {n}
              </a>
            ))}
            {halaman < jumlahHalaman && (
              <a href={href(jenis, halaman + 1)} rel="next" className={chip(false)}>
                Berikutnya →
              </a>
            )}
          </nav>
        )}
      </Section>
    </main>
  );
}
