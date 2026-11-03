import type { Metadata } from "next";
import { Badge, Button, Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { input } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { cocokKata } from "../../../../lib/katalog";
import { AMBANG_STOK_MENIPIS } from "../../../../lib/ringkasan";
import { requireAdmin } from "../../../../lib/session";
import { ubahStok } from "./actions";

export const metadata: Metadata = { title: "Manajemen Stok" };
export const dynamic = "force-dynamic";

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; galat?: string; q?: string }>;
}) {
  await requireAdmin("stok", "/admin/stok");
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 60);
  const semua = await db().variant.findMany({
    orderBy: [{ stock: "asc" }, { id: "asc" }],
    take: 1000,
    include: { product: { select: { name: true, active: true } } },
  });
  const rows = q ? semua.filter((v) => cocokKata(q, v.product.name, v.name, v.sku)) : semua;
  return (
    <main id="isi" className="py-10">
      <Container>
        <h1 className="text-2xl font-bold text-fg">Manajemen Stok</h1>
        <p className="mt-1 text-sm text-muted">
          Isi selisih stok: angka positif menambah (barang masuk), negatif mengurangi
          (rusak/koreksi). Diurutkan dari stok terendah.
        </p>
        <div className="mt-4">
          <Flash ok={sp.ok} galat={sp.galat} />
        </div>
        <form
          method="get"
          role="search"
          aria-label="Cari varian"
          className="mb-6 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="q" className="text-sm font-medium text-fg">
              Cari produk / varian / SKU
            </label>
            <input id="q" name="q" defaultValue={q} maxLength={60} className={`mt-1 ${input}`} />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-stok">
            <caption className="sr-only">Stok per varian</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Produk
                </th>
                <th scope="col" className="p-3">
                  Varian
                </th>
                <th scope="col" className="p-3">
                  SKU
                </th>
                <th scope="col" className="p-3">
                  Stok
                </th>
                <th scope="col" className="p-3">
                  Ubah stok
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} data-testid="baris-stok" className="border-t border-border">
                  <td className="p-3 font-medium text-fg">
                    {v.product.name} {!v.product.active && <Badge>Produk nonaktif</Badge>}
                  </td>
                  <td className="p-3">
                    {v.name} {!v.active && <Badge>Nonaktif</Badge>}
                  </td>
                  <td className="p-3 font-mono text-muted">{v.sku}</td>
                  <td className="p-3" data-testid="nilai-stok">
                    <strong>{v.stock}</strong>{" "}
                    {v.stock <= 0 ? (
                      <Badge tone="danger">Habis</Badge>
                    ) : v.stock <= AMBANG_STOK_MENIPIS ? (
                      <Badge tone="danger">Menipis</Badge>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <form action={ubahStok} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={v.id} />
                      <input type="hidden" name="q" value={q} />
                      <label className="sr-only" htmlFor={`delta-${v.id}`}>
                        Selisih stok {v.product.name} {v.name}
                      </label>
                      <input
                        id={`delta-${v.id}`}
                        name="delta"
                        inputMode="numeric"
                        placeholder="+10 / -2"
                        className={`w-28 ${input}`}
                      />
                      <Button type="submit" size="sm" variant="secondary">
                        Terapkan
                      </Button>
                    </form>
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
