"use client";

import { CONTOH, cekStatusPpdbDemo } from "../../lib/demo-ppdb";
import { FormStatus } from "./FormStatus";

export function FormStatusDemo() {
  return (
    <>
      <p
        role="note"
        className="mb-6 rounded-md border border-border bg-surface p-3 text-sm text-fg"
        data-testid="contoh-status"
      >
        <strong>Versi demo.</strong> Coba nomor <code className="font-mono">{CONTOH.nomor}</code>{" "}
        dengan token <code className="font-mono">{CONTOH.token}</code>, atau daftar dulu lewat
        formulir (data hanya tersimpan di peramban Anda).
      </p>
      <FormStatus action={cekStatusPpdbDemo} />
    </>
  );
}
