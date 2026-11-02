import { getActiveEvent } from "../../../lib/event";
import { buildIcs, type IcsEvent } from "../../../lib/ics";

export const dynamic = "force-dynamic";

const JAM = 3_600_000;

/** GET /api/kalender?acara=akad|resepsi (default: keduanya) → berkas .ics */
export async function GET(req: Request) {
  const ev = await getActiveEvent();
  if (!ev) return new Response("Acara tidak ditemukan.", { status: 404 });

  const pilih = new URL(req.url).searchParams.get("acara");
  if (pilih !== null && pilih !== "akad" && pilih !== "resepsi") {
    return new Response("Parameter acara tidak valid.", { status: 400 });
  }

  const resepsiTempat = ev.resepsiVenueName || ev.venueName;
  const resepsiAlamat = ev.resepsiVenueAddress || ev.venueAddress;
  const semua: Array<IcsEvent & { key: "akad" | "resepsi" }> = [
    {
      key: "akad",
      uid: `akad-${ev.slug}@undangan.local`,
      title: `Akad Nikah ${ev.groomName.split(" ")[0]} & ${ev.brideName.split(" ")[0]}`,
      start: ev.akadAt,
      end: new Date(ev.akadAt.getTime() + JAM),
      location: `${ev.venueName}, ${ev.venueAddress}`,
      description: ev.title,
    },
    {
      key: "resepsi",
      uid: `resepsi-${ev.slug}@undangan.local`,
      title: `Resepsi ${ev.groomName.split(" ")[0]} & ${ev.brideName.split(" ")[0]}`,
      start: ev.resepsiAt,
      end: new Date(ev.resepsiAt.getTime() + 3 * JAM),
      location: `${resepsiTempat}, ${resepsiAlamat}`,
      description: ev.title,
    },
  ];
  const events = semua.filter((e) => !pilih || e.key === pilih);

  return new Response(buildIcs(events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="undangan-${ev.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
