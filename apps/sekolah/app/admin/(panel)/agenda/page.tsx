import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { HapusButton } from "../../../../components/admin/HapusButton";
import { tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { formatHariTanggal, formatJam } from "../../../../lib/format";
import { requireAdmin } from "../../../../lib/session";
import { hapusAgenda } from "./actions";

export const metadata: Metadata = { title: "Kelola Agenda" };
export const dynamic = "force-dynamic";

export default async function DaftarAgenda({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin("agenda", "/admin/agenda");
  const rows = await db().agenda.findMany({
    orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    take: 300,
  });
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Kelola Agenda</h1>
          <a href="/admin/agenda/baru" className={tombolTabel}>
            + Kegiatan baru
          </a>
        </div>
        <div className="mt-4">
          <Flash ok={(await searchParams).ok} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-agenda">
            <caption className="sr-only">Daftar agenda</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Kegiatan
                </th>
                <th scope="col" className="p-3">
                  Waktu (WIB)
                </th>
                <th scope="col" className="p-3">
                  Lokasi
                </th>
                <th scope="col" className="p-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} data-testid="baris-agenda" className="border-t border-border">
                  <td className="p-3 font-medium text-fg">{a.title}</td>
                  <td className="p-3 text-muted">
                    {formatHariTanggal(a.startsAt)}, {formatJam(a.startsAt)}
                  </td>
                  <td className="p-3 text-muted">{a.location || "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/admin/agenda/${a.id}`} className={tombolTabel}>
                        Ubah
                      </a>
                      <form action={hapusAgenda}>
                        <input type="hidden" name="id" value={a.id} />
                        <HapusButton konfirmasi={`Hapus agenda "${a.title}"?`} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </main>
  );
}
