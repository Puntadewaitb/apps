// OVERLAY sample statis: halaman dirender sekali saat build dari data seed. Nama tamu (?to= / ?kode=) dibaca di
// klien oleh TamuProvider/useGuestName (lihat lib/tamu-demo.tsx).
import { notFound } from "next/navigation";
import { Undangan } from "../components/Undangan";
import { db } from "../lib/db";
import { getActiveEvent } from "../lib/event";
import { DEFAULT_GUEST } from "../lib/guest-name";
import { TamuProvider } from "../lib/tamu-demo";

export async function generateMetadata() {
  const ev = await getActiveEvent();
  return ev ? { title: ev.title } : {};
}

export default async function HomePage() {
  const ev = await getActiveEvent();
  if (!ev) notFound();
  const tamu = await db().guest.findMany({
    where: { eventId: ev.id },
    select: { code: true, name: true, maxPax: true },
    orderBy: { code: "asc" },
  });
  return (
    <TamuProvider tamu={tamu}>
      <Undangan ev={ev} guestName={DEFAULT_GUEST} tamu={null} />
    </TamuProvider>
  );
}
