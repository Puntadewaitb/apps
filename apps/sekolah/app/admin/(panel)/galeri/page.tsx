import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { HapusButton } from "../../../../components/admin/HapusButton";
import { tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { hapusAlbum } from "./actions";

export const metadata: Metadata = { title: "Kelola Galeri" };
export const dynamic = "force-dynamic";

export default async function DaftarAlbum({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin("galeri", "/admin/galeri");
  const rows = await db().gallery.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { _count: { select: { images: true } } },
  });
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Kelola Galeri</h1>
          <a href="/admin/galeri/baru" className={tombolTabel}>
            + Album baru
          </a>
        </div>
        <div className="mt-4">
          <Flash ok={(await searchParams).ok} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-album">
            <caption className="sr-only">Daftar album</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Album
                </th>
                <th scope="col" className="p-3">
                  Foto
                </th>
                <th scope="col" className="p-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} data-testid="baris-album" className="border-t border-border">
                  <td className="p-3 font-medium text-fg">{a.title}</td>
                  <td className="p-3 text-muted">{a._count.images}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/admin/galeri/${a.id}`} className={tombolTabel}>
                        Kelola
                      </a>
                      <form action={hapusAlbum}>
                        <input type="hidden" name="id" value={a.id} />
                        <HapusButton
                          konfirmasi={`Hapus album "${a.title}" beserta semua fotonya?`}
                        />
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
