import { Badge, ButtonLink, Card, Container, Section, buildWhatsAppUrl } from "@tpl/ui";
import { PostKartu } from "../../components/PostKartu";
import { ppdb } from "../../content/ppdb";
import { profil } from "../../content/profil";
import { program } from "../../content/program";
import { sekolah } from "../../content/sekolah";
import { postTerbaru } from "../../lib/posts";
import { guruAktif } from "../../lib/teachers";

// Data dari database → dirender per-request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, guru] = await Promise.all([postTerbaru(3), guruAktif()]);
  const angka = [
    { nilai: String(sekolah.siswa), label: "Siswa aktif" },
    { nilai: String(guru.length), label: "Guru & staf" },
    { nilai: String(program.ekstrakurikuler.daftar.length), label: "Ekstrakurikuler" },
    { nilai: sekolah.akreditasi, label: "Akreditasi" },
  ];
  const s = profil.sambutan;
  return (
    <main id="isi">
      <section className="bg-surface py-14 sm:py-20">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge tone="primary">
              Akreditasi {sekolah.akreditasi} · sejak {sekolah.tahunBerdiri}
            </Badge>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">
              {sekolah.nama}
            </h1>
            <p className="mt-4 text-lg text-muted">{sekolah.tagline}</p>
            <p className="mt-3 text-muted">{sekolah.deskripsi}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/program" size="lg">
                Lihat Program
              </ButtonLink>
              <ButtonLink href="/ppdb" size="lg" variant="secondary">
                PPDB {ppdb.tahunAjaran}
              </ButtonLink>
              <ButtonLink
                href={buildWhatsAppUrl(sekolah.kontak.whatsapp, sekolah.kontak.pesanWhatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="secondary"
              >
                Hubungi via WhatsApp
              </ButtonLink>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/hero.svg"
            alt="Ilustrasi gedung sekolah (placeholder)"
            width={800}
            height={560}
            fetchPriority="high"
            decoding="async"
            className="h-auto w-full rounded-xl border border-border"
          />
        </Container>
      </section>

      <section aria-labelledby="angka-judul" className="border-y border-border py-10">
        <Container>
          <h2 id="angka-judul" className="sr-only">
            Sekolah dalam angka
          </h2>
          <dl className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4" data-testid="angka">
            {angka.map((a) => (
              <div key={a.label}>
                <dd className="text-3xl font-bold text-primary sm:text-4xl">{a.nilai}</dd>
                <dt className="mt-1 text-sm text-muted">{a.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-center text-xs text-muted">
            Angka di atas fiktif untuk keperluan demo template.
          </p>
        </Container>
      </section>

      <Section id="sambutan" title={s.judul}>
        <div className="grid items-center gap-8 md:grid-cols-[12rem_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.foto}
            alt={`Foto ${s.nama} (placeholder)`}
            width={320}
            height={320}
            loading="lazy"
            decoding="async"
            className="h-auto w-48 rounded-xl border border-border"
          />
          <div className="max-w-3xl">
            <p className="text-fg">{s.paragraf[1]}</p>
            <p className="mt-3 font-semibold text-fg">
              {s.nama}
              <span className="block text-sm font-normal text-muted">{s.jabatan}</span>
            </p>
            <ButtonLink href="/profil" variant="secondary" className="mt-4">
              Selengkapnya tentang kami
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section
        id="program"
        tone="surface"
        title="Program Unggulan"
        subtitle="Kurikulum nasional yang diperkaya program khas sekolah."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {program.akademik.daftar.map((p) => (
            <li key={p.id}>
              <Card className="h-full" data-testid="kartu-program">
                <span aria-hidden="true" className="text-3xl">
                  {p.ikon}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-fg">{p.nama}</h3>
                <p className="mt-1 text-muted">{p.ringkas}</p>
              </Card>
            </li>
          ))}
        </ul>
        <ButtonLink href="/program" variant="secondary" className="mt-8">
          Semua program & ekstrakurikuler
        </ButtonLink>
      </Section>

      <Section id="terbaru" title="Berita & Pengumuman Terbaru">
        <ul className="grid gap-4 md:grid-cols-3" data-testid="daftar-terbaru">
          {posts.map((p) => (
            <li key={p.slug}>
              <PostKartu p={p} />
            </li>
          ))}
        </ul>
        <ButtonLink href="/berita" variant="secondary" className="mt-8">
          Semua berita & pengumuman
        </ButtonLink>
      </Section>
    </main>
  );
}
