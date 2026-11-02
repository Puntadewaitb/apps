import { ButtonLink, Container } from "@tpl/ui";
import { TambahTamuForm } from "../../../components/admin/TambahTamuForm";
import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { siteUrl } from "../../../lib/env";
import { getActiveEvent } from "../../../lib/event";
import { JENIS, namaAcara, resolveJenis } from "../../../lib/jenis";
import { tautanTamu, tautanWhatsApp } from "../../../lib/tamu";
import { hapusTamu } from "./actions";

const STATUS: Record<string, string> = { HADIR: "Hadir", TIDAK_HADIR: "Tidak hadir", RAGU: "Ragu" };

export default async function TamuPage() {
  await requireAdmin();
  const ev = await getActiveEvent();
  if (!ev) return null;
  const tamu = await db().guest.findMany({
    where: { eventId: ev.id },
    orderBy: { id: "desc" },
    include: { rsvps: { orderBy: { id: "desc" }, take: 1 } },
  });
  const base = siteUrl();
  const jenis = resolveJenis(ev.jenis);
  const acara = `${JENIS[jenis].judul.replace("Undangan ", "")} ${namaAcara(jenis, ev)}`;

  return (
    <main className="py-10">
      <Container className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Tamu & Tautan ({tamu.length})</h1>
          <ButtonLink href="/admin/ekspor/tamu" variant="secondary" size="sm">
            Ekspor CSV
          </ButtonLink>
        </div>

        <TambahTamuForm />

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Maks.</th>
                <th className="px-3 py-2">RSVP</th>
                <th className="px-3 py-2">Tautan pribadi</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tamu.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    Belum ada tamu.
                  </td>
                </tr>
              )}
              {tamu.map((t) => {
                const link = tautanTamu(base, t.code);
                return (
                  <tr
                    key={t.id}
                    className="border-t border-border align-top"
                    data-testid="baris-tamu"
                  >
                    <td className="px-3 py-2">{t.name}</td>
                    <td className="px-3 py-2">{t.maxPax}</td>
                    <td className="px-3 py-2">
                      {t.rsvps[0] ? (STATUS[t.rsvps[0].status] ?? t.rsvps[0].status) : "—"}
                    </td>
                    <td className="px-3 py-2 break-all">
                      <a href={link} className="text-primary underline">
                        {link}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <a
                        href={tautanWhatsApp({ phone: t.phone, nama: t.name, tautan: link, acara })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-3 text-primary underline"
                      >
                        Bagikan via WA
                      </a>
                      <form action={hapusTamu} className="inline">
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="text-danger underline"
                          aria-label={`Hapus ${t.name}`}
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">
          Bagikan tautan masing-masing tamu. Tautan membawa kode unik sehingga nama tamu, batas
          jumlah orang, dan RSVP terisi otomatis.
        </p>
      </Container>
    </main>
  );
}
