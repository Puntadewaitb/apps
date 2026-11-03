import type { Metadata } from "next";
import { Badge, Container } from "@tpl/ui";
import { Flash } from "../../../../../components/admin/Flash";
import { tombolTabel } from "../../../../../components/admin/ui";
import { db } from "../../../../../lib/db";
import { formatTanggal, rupiah } from "../../../../../lib/format";
import { requireAdmin } from "../../../../../lib/session";

export const metadata: Metadata = { title: "Program Donasi" };
export const dynamic = "force-dynamic";

export default async function DaftarProgram({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin("donasi", "/admin/donasi/program");
  const rows = await db().donationProgram.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Program Donasi</h1>
          <a href="/admin/donasi/program/baru" className={tombolTabel}>
            + Program baru
          </a>
        </div>
        <div className="mt-4">
          <Flash ok={(await searchParams).ok} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-kelola-program">
            <caption className="sr-only">Daftar program donasi</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Program
                </th>
                <th scope="col" className="p-3">
                  Target
                </th>
                <th scope="col" className="p-3">
                  Batas waktu
                </th>
                <th scope="col" className="p-3">
                  Status
                </th>
                <th scope="col" className="p-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  data-testid="baris-kelola-program"
                  className="border-t border-border"
                >
                  <td className="p-3 font-medium text-fg">{p.title}</td>
                  <td className="p-3 text-muted">{rupiah(p.target)}</td>
                  <td className="p-3 text-muted">{p.deadline ? formatTanggal(p.deadline) : "—"}</td>
                  <td className="p-3">
                    {p.active ? <Badge tone="primary">Aktif</Badge> : <Badge>Nonaktif</Badge>}
                  </td>
                  <td className="p-3">
                    <a href={`/admin/donasi/program/${p.id}`} className={tombolTabel}>
                      Ubah
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Program tidak dihapus agar riwayat donasi tetap utuh — nonaktifkan untuk
          menyembunyikannya.
        </p>
      </Container>
    </main>
  );
}
