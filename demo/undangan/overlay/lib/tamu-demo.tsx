"use client";

// OVERLAY sample statis: halaman dirender SATU kali saat build, jadi personalisasi tamu dibaca di klien dari URL:
//   ?to=Nama+Tamu   → nama di sampul & isian awal form
//   ?kode=DEMO-0001 → nama & batas jumlah orang dari data tamu (daftar tamu seed disertakan oleh halaman)
// Memakai useSyncExternalStore: render awal = nilai server (cocok dengan HTML statis), lalu nilai dari URL.
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_GUEST, guestNameFromParam } from "./guest-name";
import { DEFAULT_MAX_PAX, KODE_RE } from "./schemas";

export type TamuDemo = { code: string; name: string; maxPax: number };

const TamuCtx = createContext<TamuDemo[]>([]);

export function TamuProvider({ tamu, children }: { tamu: TamuDemo[]; children: ReactNode }) {
  return <TamuCtx.Provider value={tamu}>{children}</TamuCtx.Provider>;
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

function useQuery(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
}

function useTamuAktif() {
  const query = useQuery();
  const daftar = useContext(TamuCtx);
  const sp = new URLSearchParams(query);
  const kodeRaw = sp.get("kode");
  const tamu =
    kodeRaw && KODE_RE.test(kodeRaw)
      ? (daftar.find((t) => t.code === kodeRaw.toUpperCase()) ?? null)
      : null;
  const name = tamu?.name ?? guestNameFromParam(sp.get("to") ?? undefined);
  return { tamu, name };
}

/** Nama untuk sampul: `serverName` selama render server/hydration, lalu nama dari URL. */
export function useGuestName(serverName: string): string {
  const { tamu, name } = useTamuAktif();
  const query = useQuery();
  return query ? (tamu?.name ?? name) : serverName;
}

/** Isian awal "Nama" di form (kosong bila nama tamu default). */
export function useNamaIsian(fallback: string): string {
  const { tamu, name } = useTamuAktif();
  return tamu?.name ?? (name === DEFAULT_GUEST ? fallback : name);
}

export function useTamuForm(awal: { defaultName: string; kode?: string; maxPax: number }) {
  const { tamu } = useTamuAktif();
  const defaultName = useNamaIsian(awal.defaultName);
  return {
    defaultName,
    kode: tamu?.code ?? awal.kode,
    maxPax: tamu?.maxPax ?? awal.maxPax ?? DEFAULT_MAX_PAX,
  };
}
