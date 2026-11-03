import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card, Container, Section } from "@tpl/ui";
import { FormKonfirmasi } from "../../../../components/donasi/FormKonfirmasi";
import { ProgresBar } from "../../../../components/donasi/ProgresBar";
import { donasi } from "../../../../content/donasi";
import {
  donaturTerbaru,
  progresKosong,
  progresSemua,
  programBySlug,
  terbukaUntukDonasi,
} from "../../../../lib/donasi";
import { formatTanggal } from "../../../../lib/format";
import { kirimKonfirmasi } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await programBySlug((await params).slug);
  if (!p || !p.active) return { title: "Program tidak ditemukan", robots: { index: false } };
  return { title: p.title, description: p.description.slice(0, 160) };
}

export default async function ProgramDonasi({ params }: Props) {
  const p = await programBySlug((await params).slug);
  if (!p || !p.active) notFound(); // program nonaktif tidak publik
  const [progres, donatur] = await Promise.all([progresSemua(), donaturTerbaru(p.id)]);
  const g = progres.get(p.id) ?? progresKosong();
  const buka = terbukaUntukDonasi(p);
  return (
    <main id="isi">
      <section className="bg-surface py-12 sm:py-16">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
            <ol className="flex flex-wrap gap-2">
              <li>
                <a href="/donasi" className="underline underline-offset-2">
                  Donasi & Infaq
                </a>
                <span aria-hidden="true"> /</span>
              </li>
              <li aria-current="page" className="font-medium text-fg">
                {p.title}
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{p.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{p.description}</p>
          <div className="mt-6 max-w-2xl">
            <ProgresBar
              terkumpul={g.terkumpul}
              target={p.target}
              persen={g.persen}
              donatur={g.donatur}
            />
            <p className="mt-2 text-sm text-muted">
              {p.deadline ? `Batas waktu: ${formatTanggal(p.deadline)}` : "Tanpa batas waktu"}
              {!buka && <Badge className="ml-2">Ditutup</Badge>}
            </p>
          </div>
        </Container>
      </section>

      <Section id="cara" title="Cara berdonasi">
        <ol className="list-decimal space-y-2 pl-5 text-fg">
          <li>Transfer ke salah satu rekening resmi berikut:</li>
        </ol>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="daftar-rekening">
          {donasi.rekening.map((r) => (
            <li key={r.nomor}>
              <Card>
                <p className="text-sm font-semibold text-primary">{r.bank}</p>
                <p className="font-mono text-lg font-bold text-fg">{r.nomor}</p>
                <p className="text-sm text-muted">a.n. {r.atasNama}</p>
              </Card>
            </li>
          ))}
        </ul>
        <ol start={2} className="mt-3 list-decimal space-y-2 pl-5 text-fg">
          <li>Isi formulir konfirmasi di bawah dan unggah bukti transfer.</li>
          <li>Pengurus memverifikasi; donasi terverifikasi ikut dihitung pada progres.</li>
        </ol>
      </Section>

      <Section id="konfirmasi" tone="surface" title="Konfirmasi transfer">
        <div className="max-w-xl">
          {buka ? (
            <FormKonfirmasi action={kirimKonfirmasi} slug={p.slug} minimal={donasi.minimal} />
          ) : (
            <p
              role="status"
              data-testid="donasi-ditutup"
              className="rounded-md border border-border bg-bg p-4 text-fg"
            >
              Program ini sudah ditutup untuk donasi baru. Terima kasih atas dukungan Anda.
            </p>
          )}
        </div>
      </Section>

      <Section id="donatur" title="Donatur terbaru">
        {donatur.length === 0 ? (
          <p className="text-muted" data-testid="donatur-kosong">
            Jadilah donatur pertama.
          </p>
        ) : (
          <ul className="space-y-3" data-testid="daftar-donatur">
            {donatur.map((d) => (
              <li
                key={d.id}
                data-testid="item-donatur"
                className="rounded-lg border border-border bg-bg p-4"
              >
                <p className="font-semibold text-fg">{d.nama}</p>
                {d.pesan && <p className="text-sm text-muted">&ldquo;{d.pesan}&rdquo;</p>}
                <p className="text-xs text-muted">{formatTanggal(d.tanggal)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}
