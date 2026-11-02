import { ButtonLink, Container } from "@tpl/ui";
import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { getActiveEvent } from "../../../lib/event";

const STATUS: Record<string, string> = { HADIR: "Hadir", TIDAK_HADIR: "Tidak hadir", RAGU: "Ragu" };
const waktu = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function RsvpPage() {
  await requireAdmin();
  const ev = await getActiveEvent();
  if (!ev) return null;
  const rows = await db().rsvp.findMany({
    where: { eventId: ev.id },
    orderBy: { id: "desc" },
    include: { guest: { select: { code: true } } },
    take: 500,
  });
  return (
    <main className="py-10">
      <Container className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Rekap RSVP ({rows.length})</h1>
          <ButtonLink href="/admin/ekspor/rsvp" variant="secondary" size="sm">
            Ekspor CSV
          </ButtonLink>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-3 py-2">Waktu (WIB)</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Orang</th>
                <th className="px-3 py-2">Kode tamu</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    Belum ada RSVP.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border" data-testid="baris-rsvp">
                  <td className="whitespace-nowrap px-3 py-2">{waktu.format(r.createdAt)}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{STATUS[r.status] ?? r.status}</td>
                  <td className="px-3 py-2">{r.pax}</td>
                  <td className="px-3 py-2">{r.guest?.code ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </main>
  );
}
