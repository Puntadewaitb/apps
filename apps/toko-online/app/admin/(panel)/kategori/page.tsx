import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormKategori } from "../../../../components/admin/FormKategori";
import { Flash } from "../../../../components/admin/Flash";
import { HapusButton } from "../../../../components/admin/HapusButton";
import { tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/session";
import { hapusKategori, simpanKategori } from "./actions";

export const metadata: Metadata = { title: "Kelola Kategori" };
export const dynamic = "force-dynamic";

export default async function DaftarKategori({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; galat?: string }>;
}) {
  await requireAdmin("kategori", "/admin/kategori");
  const sp = await searchParams;
  const rows = await db().category.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  const maks = rows.reduce((a, r) => Math.max(a, r.sort), 0);
  return (
    <main id="isi" className="py-10">
      <Container>
        <h1 className="text-2xl font-bold text-fg">Kelola Kategori</h1>
        <div className="mt-4">
          <Flash ok={sp.ok} galat={sp.galat} />
        </div>
        <section
          aria-labelledby="tambah"
          className="mb-8 rounded-lg border border-border bg-bg p-4"
        >
          <h2 id="tambah" className="mb-3 font-semibold text-fg">
            Kategori baru
          </h2>
          <FormKategori action={simpanKategori} nilai={{ name: "", sort: maks + 1 }} />
        </section>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-kategori">
            <caption className="sr-only">Daftar kategori</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Urutan
                </th>
                <th scope="col" className="p-3">
                  Nama
                </th>
                <th scope="col" className="p-3">
                  Slug
                </th>
                <th scope="col" className="p-3">
                  Produk
                </th>
                <th scope="col" className="p-3">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id} data-testid="baris-kategori" className="border-t border-border">
                  <td className="p-3">{k.sort}</td>
                  <td className="p-3 font-medium text-fg">{k.name}</td>
                  <td className="p-3 font-mono text-muted">{k.slug}</td>
                  <td className="p-3">{k._count.products}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/admin/kategori/${k.id}`} className={tombolTabel}>
                        Ubah
                      </a>
                      <form action={hapusKategori}>
                        <input type="hidden" name="id" value={k.id} />
                        <HapusButton konfirmasi={`Hapus kategori "${k.name}"?`} />
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
