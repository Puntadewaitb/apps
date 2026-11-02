import { Badge, Card, Container, Section } from "@tpl/ui";
import { sekolah } from "../content/sekolah";
import { postTerbaru } from "../lib/posts";

// Data dari database → dirender per-request (halaman publik lengkap dibangun di S2–S3).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await postTerbaru(3);
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
      <Section id="terbaru" title="Berita & Pengumuman Terbaru">
        <ul className="grid gap-4 md:grid-cols-3" data-testid="daftar-terbaru">
          {posts.map((p) => (
            <li key={p.slug}>
              <Card className="h-full">
                <Badge tone={p.kind === "PENGUMUMAN" ? "primary" : "neutral"}>
                  {p.kind === "PENGUMUMAN" ? "Pengumuman" : "Berita"}
                </Badge>
                <h3 className="mt-3 font-semibold text-fg">{p.title}</h3>
                <p className="mt-1 text-muted">{p.excerpt}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
