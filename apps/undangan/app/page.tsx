import { notFound } from "next/navigation";
import { Undangan } from "../components/Undangan";
import { db } from "../lib/db";
import { getActiveEvent } from "../lib/event";
import { guestNameFromParam } from "../lib/guest-name";
import { KODE_RE } from "../lib/schemas";

// Data acara dibaca dari DB saat request (berubah tanpa build ulang).
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const ev = await getActiveEvent();
  return ev ? { title: ev.title } : {};
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string | string[]; kode?: string | string[] }>;
}) {
  const { to, kode: kodeParam } = await searchParams;
  const ev = await getActiveEvent();
  if (!ev) notFound();

  // Tautan pribadi: ?kode=DEMO-0001 → nama & batas jumlah orang dari data tamu.
  const kodeRaw = Array.isArray(kodeParam) ? kodeParam[0] : kodeParam;
  const guest =
    kodeRaw && KODE_RE.test(kodeRaw)
      ? await db().guest.findUnique({ where: { code: kodeRaw.toUpperCase() } })
      : null;
  const tamu = guest && guest.eventId === ev.id ? guest : null;

  return <Undangan ev={ev} guestName={tamu?.name ?? guestNameFromParam(to)} tamu={tamu} />;
}
