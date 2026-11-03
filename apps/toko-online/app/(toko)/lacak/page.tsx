import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormLacak } from "../../../components/FormLacak";
import { normalisasiKodePesanan } from "../../../lib/lacak";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
  robots: { index: false, follow: false },
};

export default async function LacakPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const k = (await searchParams).kode;
  const kodeAwal = normalisasiKodePesanan(Array.isArray(k) ? k[0] : k);
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-fg">Lacak Pesanan</h1>
        <p className="mt-2 mb-8 text-muted">
          Masukkan kode pesanan dan nomor HP yang Anda pakai saat memesan.
        </p>
        <FormLacak kodeAwal={kodeAwal} />
        <noscript>
          <p className="rounded-lg border border-border p-4 text-muted">
            Halaman ini memerlukan JavaScript.
          </p>
        </noscript>
      </Container>
    </main>
  );
}
