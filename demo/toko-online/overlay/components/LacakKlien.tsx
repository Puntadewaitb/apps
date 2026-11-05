"use client";

// OVERLAY sample statis: /lacak?kode=… dibaca di klien (versi lengkap membacanya di server lewat searchParams).
import { useSyncExternalStore } from "react";
import { CONTOH } from "../lib/demo-toko";
import { normalisasiKodePesanan } from "../lib/lacak";
import { FormLacak } from "./FormLacak";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export function LacakKlien() {
  const query = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const kodeAwal = normalisasiKodePesanan(new URLSearchParams(query).get("kode"));
  return (
    <>
      <p
        role="note"
        className="mb-6 rounded-md border border-border bg-surface p-3 text-sm text-fg"
        data-testid="contoh-lacak"
      >
        <strong>Versi demo.</strong> Coba kode <code className="font-mono">{CONTOH.kode}</code>{" "}
        dengan nomor HP <code className="font-mono">{CONTOH.telepon}</code>, atau lacak pesanan yang
        baru Anda buat di peramban ini.
      </p>
      <FormLacak key={kodeAwal} kodeAwal={kodeAwal} />
    </>
  );
}
