import type { Metadata } from "next";
import { Badge, Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { HapusButton } from "../../../../components/admin/HapusButton";
import { tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { formatTanggal } from "../../../../lib/format";
import { requireAdmin } from "../../../../lib/session";
import { hapusBerita, ubahStatusBerita } from "./actions";

export const metadata: Metadata = { title: "Kelola Berita" };
export const dynamic = "force-dynamic";

/** Terbit tetapi tanggalnya belum tiba. */
function apaTerjadwal(published: boolean, publishedAt: Date | null) {
  return published && !!publishedAt && publishedAt.getTime() > Date.now();
}

export default async function DaftarBerita({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin("berita", "/admin/berita");
  const rows = await db().post.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
    select: { id: true, slug: true, title: true, kind: true, published: true, publishedAt: true },
  });
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Kelola Berita & Pengumuman</h1>
          <a href="/admin/berita/baru" className={tombolTabel}>
            + Tulisan baru
          </a>
        </div>
        <div className="mt-4">
          <Flash ok={(await searchParams).ok} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-berita">
            <caption className="sr-only">Daftar berita dan pengumuman</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Judul
                </th>
                <th scope="col" className="p-3">
                  Jenis
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
              {rows.map((r) => {
                const terjadwal = apaTerjadwal(r.published, r.publishedAt);
                return (
                  <tr key={r.id} data-testid="baris-berita" className="border-t border-border">
                    <td className="p-3 font-medium text-fg">{r.title}</td>
                    <td className="p-3 text-muted">
                      {r.kind === "PENGUMUMAN" ? "Pengumuman" : "Berita"}
                    </td>
                    <td className="p-3">
                      {!r.published ? (
                        <Badge>Draf</Badge>
                      ) : terjadwal ? (
                        <Badge tone="primary">Terjadwal {formatTanggal(r.publishedAt!)}</Badge>
                      ) : (
                        <Badge tone="primary">Terbit</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={`/admin/berita/${r.id}`} className={tombolTabel}>
                          Ubah
                        </a>
                        <form action={ubahStatusBerita}>
                          <input type="hidden" name="id" value={r.id} />
                          <button type="submit" className={tombolTabel}>
                            {r.published ? "Jadikan draf" : "Terbitkan"}
                          </button>
                        </form>
                        <form action={hapusBerita}>
                          <input type="hidden" name="id" value={r.id} />
                          <HapusButton
                            konfirmasi={`Hapus "${r.title}"? Tindakan ini tidak bisa dibatalkan.`}
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Container>
    </main>
  );
}
