// OVERLAY sample statis: berkas kalender .ics dibuat SAAT BUILD (menggantikan GET /api/kalender).
import { getActiveEvent } from "../../lib/event";
import { buildIcs, type IcsEvent } from "../../lib/ics";
import { JENIS, namaAcara, resolveJenis } from "../../lib/jenis";

export const dynamic = "force-static";

const JAM = 3_600_000;

export async function GET() {
  const ev = await getActiveEvent();
  if (!ev) return new Response("Acara tidak ditemukan.", { status: 404 });
  const jenis = resolveJenis(ev.jenis);
  const cfg = JENIS[jenis];
  const nama = namaAcara(jenis, ev);
  const resepsiTempat = ev.resepsiVenueName || ev.venueName;
  const resepsiAlamat = ev.resepsiVenueAddress || ev.venueAddress;
  const durasi = { akad: JAM, resepsi: 3 * JAM };
  const events: IcsEvent[] = cfg.sesi.map((s) => {
    const akad = s.key === "akad";
    const start = akad ? ev.akadAt : ev.resepsiAt;
    return {
      uid: `${s.key}-${ev.slug}@undangan.local`,
      title: `${s.nama} ${nama}`,
      start,
      end: new Date(start.getTime() + (cfg.sesi.length === 1 ? 3 * JAM : durasi[s.key])),
      location: akad ? `${ev.venueName}, ${ev.venueAddress}` : `${resepsiTempat}, ${resepsiAlamat}`,
      description: ev.title,
    };
  });
  return new Response(buildIcs(events), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
}
