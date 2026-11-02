import type { Metadata } from "next";
import { Badge, Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { HapusButton } from "../../../../components/admin/HapusButton";
import { tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { hapusGuru } from "./actions";

export const metadata: Metadata = { title: "Kelola Guru & Staf" };
export const dynamic = "force-dynamic";

export default async function DaftarGuru({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin("guru", "/admin/guru");
  const rows = await db().teacher.findMany({ orderBy: [{ sort: "asc" }, { id: "asc" }] });
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Kelola Guru & Staf</h1>
          <a href="/admin/guru/baru" className={tombolTabel}>
            + Guru baru
          </a>
        </div>
        <div className="mt-4">
          <Flash ok={(await searchParams).ok} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-guru">
            <caption className="sr-only">Daftar guru dan staf</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Urutan
                </th>
                <th scope="col" className="p-3">
                  Nama
                </th>
                <th scope="col" className="p-3">
                  Jabatan
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
              {rows.map((g) => (
                <tr key={g.id} data-testid="baris-guru" className="border-t border-border">
                  <td className="p-3 text-muted">{g.sort}</td>
                  <td className="p-3 font-medium text-fg">{g.name}</td>
                  <td className="p-3 text-muted">{g.position}</td>
                  <td className="p-3">
                    {g.active ? <Badge tone="primary">Tampil</Badge> : <Badge>Disembunyikan</Badge>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/admin/guru/${g.id}`} className={tombolTabel}>
                        Ubah
                      </a>
                      <form action={hapusGuru}>
                        <input type="hidden" name="id" value={g.id} />
                        <HapusButton konfirmasi={`Hapus ${g.name}?`} />
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
