import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormStatus } from "../../../../components/ppdb/FormStatus";
import { cekStatusPpdb } from "../actions";

export const metadata: Metadata = { title: "Cek Status Pendaftaran" };

export default function StatusPage() {
  return (
    <main id="isi" className="py-12">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-fg">Cek Status Pendaftaran</h1>
        <p className="mt-2 mb-8 text-muted">
          Masukkan nomor pendaftaran dan token akses yang Anda terima saat mendaftar.
        </p>
        <FormStatus action={cekStatusPpdb} />
      </Container>
    </main>
  );
}
