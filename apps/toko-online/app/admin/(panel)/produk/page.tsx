import type { Metadata } from "next";
import { Badge, Button, Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { HapusButton } from "../../../../components/admin/HapusButton";
import { input, tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { rupiah } from "../../../../lib/format";
import { cocokKata, hargaMulai, stokTotal } from "../../../../lib/katalog";
import { requireAdmin } from "../../../../lib/session";
import { hapusProduk, ubahAktif } from "./actions";

export const metadata: Metadata = { title: "Kelola Produk" };
export const dynamic = "force-dynamic";

const STATUS = ["semua", "aktif", "nonaktif"] as const;

export default async function DaftarProduk({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; q?: string; status?: string }>;
}) {
  await requireAdmin("produk", "/admin/produk");
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 60);
  const status = (STATUS as readonly string[]).includes(sp.status ?? "") ? sp.status! : "semua";
  const semua = await db().product.findMany({
    where: status === "semua" ? {} : { active: status === "aktif" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 500,
    include: {
      category: { select: { name: true } },
      variants: { select: { price: true, stock: true, active: true } },
    },
  });
  const rows = q ? semua.filter((p) => cocokKata(q, p.name, p.slug)) : semua;
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Kelola Produk</h1>
          <a href="/admin/produk/baru" className={tombolTabel}>
            + Produk baru
          </a>
        </div>
        <div className="mt-4">
          <Flash ok={sp.ok} />
        </div>
        <form
          method="get"
          role="search"
          aria-label="Cari produk"
          className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
        >
          <div>
            <label htmlFor="q" className="text-sm font-medium text-fg">
              Cari nama
            </label>
            <input id="q" name="q" defaultValue={q} maxLength={60} className={`mt-1 ${input}`} />
          </div>
          <div>
            <label htmlFor="status" className="text-sm font-medium text-fg">
              Status
            </label>
            <select id="status" name="status" defaultValue={status} className={`mt-1 ${input}`}>
              <option value="semua">Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
        </form>
        <p className="mb-2 text-sm text-muted" data-testid="jumlah-produk">
          {rows.length} produk
        </p>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-produk">
            <caption className="sr-only">Daftar produk</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Produk
                </th>
                <th scope="col" className="p-3">
                  Kategori
                </th>
                <th scope="col" className="p-3">
                  Harga
                </th>
                <th scope="col" className="p-3">
                  Stok
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
                <tr key={p.id} data-testid="baris-produk" className="border-t border-border">
                  <td className="p-3 font-medium text-fg">{p.name}</td>
                  <td className="p-3">{p.category.name}</td>
                  <td className="p-3">
                    {rupiah(hargaMulai({ price: p.price, variants: p.variants }))}
                  </td>
                  <td className="p-3">{stokTotal({ price: p.price, variants: p.variants })}</td>
                  <td className="p-3">
                    {p.active ? <Badge tone="success">Aktif</Badge> : <Badge>Nonaktif</Badge>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/admin/produk/${p.id}`} className={tombolTabel}>
                        Ubah
                      </a>
                      <form action={ubahAktif}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className={tombolTabel}>
                          {p.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                      <form action={hapusProduk}>
                        <input type="hidden" name="id" value={p.id} />
                        <HapusButton
                          konfirmasi={`Hapus produk "${p.name}" beserta variannya? Riwayat pesanan tetap tersimpan.`}
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
