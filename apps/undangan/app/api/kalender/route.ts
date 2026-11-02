import { getActiveEvent } from "../../../lib/event";
import { buildIcs, type IcsEvent } from "../../../lib/ics";
import { JENIS, namaAcara, resolveJenis } from "../../../lib/jenis";

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

  const jenis = resolveJenis(ev.jenis);
  const cfg = JENIS[jenis];
  const nama = namaAcara(jenis, ev);
  const resepsiTempat = ev.resepsiVenueName || ev.venueName;
  const resepsiAlamat = ev.resepsiVenueAddress || ev.venueAddress;
  const durasi = { akad: JAM, resepsi: 3 * JAM };
  const semua: Array<IcsEvent & { key: "akad" | "resepsi" }> = cfg.sesi.map((s) => {
    const akad = s.key === "akad";
    const start = akad ? ev.akadAt : ev.resepsiAt;
    return {
      key: s.key,
      uid: `${s.key}-${ev.slug}@undangan.local`,
      title: `${s.nama} ${nama}`,
      start,
      end: new Date(start.getTime() + (cfg.sesi.length === 1 ? 3 * JAM : durasi[s.key])),
      location: akad ? `${ev.venueName}, ${ev.venueAddress}` : `${resepsiTempat}, ${resepsiAlamat}`,
      description: ev.title,
    };
  });
  const events = semua.filter((e) => !pilih || e.key === pilih);
  if (events.length === 0)
    return new Response("Acara tidak tersedia untuk jenis ini.", { status: 404 });

  return new Response(buildIcs(events), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="undangan-${ev.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
