import type { Metadata } from "next";
import { Container, Section } from "@tpl/ui";
import { Ajakan } from "../../components/Ajakan";
import { LayananKartu } from "../../components/LayananKartu";
import { getKonten } from "../../lib/konten";

const k = getKonten();

export const metadata: Metadata = {
  title: k.layananHalaman.judul,
  description: k.layananHalaman.pengantar,
};

export default function LayananPage() {
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
              <LayananKartu l={l} cta={h.cta} />
            </li>
          ))}
        </ul>
      </Section>
      <Ajakan />
    </main>
  );
}
