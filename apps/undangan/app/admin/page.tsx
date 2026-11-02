import { Card, Container } from "@tpl/ui";
import { requireAdmin } from "../../lib/admin-auth";
import { db } from "../../lib/db";
import { getActiveEvent } from "../../lib/event";
import { JENIS, namaAcara, resolveJenis } from "../../lib/jenis";

export default async function AdminHome() {
  await requireAdmin();
  const ev = await getActiveEvent();
  if (!ev) {
    return (
      <main className="py-10">
        <Container>
          <h1 className="text-2xl font-bold text-fg">Ringkasan</h1>
          <p className="mt-3 text-muted">Acara aktif belum ada. Jalankan seed: npm run db:seed.</p>
        </Container>
      </main>
    );
  }
  const [rsvp, tamu, wishes, sudahMerespons] = await Promise.all([
    db().rsvp.groupBy({
      by: ["status"],
      where: { eventId: ev.id },
      _count: { _all: true },
      _sum: { pax: true },
    }),
    db().guest.count({ where: { eventId: ev.id } }),
    db().wish.groupBy({ by: ["visible"], where: { eventId: ev.id }, _count: { _all: true } }),
    db().rsvp.findMany({
      where: { eventId: ev.id, guestId: { not: null } },
      distinct: ["guestId"],
      select: { guestId: true },
    }),
  ]);
  const hitung = (s: string) => rsvp.find((r) => r.status === s)?._count._all ?? 0;
  const orangHadir = rsvp.find((r) => r.status === "HADIR")?._sum.pax ?? 0;
  const tampil = wishes.find((w) => w.visible)?._count._all ?? 0;
  const tersembunyi = wishes.find((w) => !w.visible)?._count._all ?? 0;
  const jenis = resolveJenis(ev.jenis);

  const kartu: Array<[string, number | string, string]> = [
    ["Orang hadir", orangHadir, "total jumlah orang dari RSVP 'Hadir'"],
    ["RSVP Hadir", hitung("HADIR"), "konfirmasi"],
    ["Tidak hadir", hitung("TIDAK_HADIR"), "konfirmasi"],
    ["Masih ragu", hitung("RAGU"), "konfirmasi"],
    ["Tamu terdaftar", tamu, `${sudahMerespons.length} sudah merespons`],
    ["Ucapan tampil", tampil, `${tersembunyi} menunggu/disembunyikan`],
  ];

  return (
    <main className="py-10">
      <Container>
        <h1 className="text-2xl font-bold text-fg">Ringkasan</h1>
        <p className="mt-1 text-muted" data-testid="acara-aktif">
          {JENIS[jenis].judul}: {namaAcara(jenis, ev)} · tema {ev.tema}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {kartu.map(([judul, nilai, ket]) => (
            <Card key={judul} data-testid={`stat-${judul.toLowerCase().replace(/\s+/g, "-")}`}>
              <dt className="text-sm text-muted">{judul}</dt>
              <dd className="mt-1 text-3xl font-bold text-fg">{nilai}</dd>
              <p className="text-xs text-muted">{ket}</p>
            </Card>
          ))}
        </dl>
      </Container>
    </main>
  );
}
