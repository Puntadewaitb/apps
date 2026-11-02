import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormPpdb } from "../../../../components/ppdb/FormPpdb";
import { ppdb } from "../../../../content/ppdb";
import { daftarPpdb } from "../actions";

export const metadata: Metadata = { title: "Formulir Pendaftaran PPDB" };

export default function DaftarPage() {
  return (
    <main id="isi" className="py-12">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-fg">Formulir Pendaftaran</h1>
        <p className="mt-2 mb-8 text-muted">Tahun ajaran {ppdb.tahunAjaran}</p>
        {ppdb.dibuka ? (
          <FormPpdb action={daftarPpdb} />
        ) : (
          <p
            role="status"
            data-testid="ppdb-ditutup"
            className="rounded-md border border-border bg-surface p-4 text-fg"
          >
            Pendaftaran sedang ditutup.
          </p>
        )}
      </Container>
    </main>
  );
}
