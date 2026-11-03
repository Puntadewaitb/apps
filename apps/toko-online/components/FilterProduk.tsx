import { Button } from "@tpl/ui";
import { LABEL_URUTAN, URUTAN, type Urutan } from "../lib/katalog";

type Props = {
  kategori?: string;
  q: string;
  urut: Urutan;
  daftarKategori: Array<{ slug: string; name: string }>;
};

const kontrol = "mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg";

/** Filter berbasis GET (tanpa JS): kategori, pencarian, urutan. Perubahan filter mengembalikan ke halaman 1. */
export function FilterProduk({ kategori, q, urut, daftarKategori }: Props) {
  const aktif = !!(kategori || q || urut !== "terbaru");
  return (
    <form
      method="get"
      action="/produk"
      role="search"
      aria-label="Cari dan saring produk"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <div>
        <label htmlFor="f-q" className="text-sm font-medium text-fg">
          Cari produk
        </label>
        <input
          id="f-q"
          name="q"
          type="search"
          defaultValue={q}
          maxLength={60}
          placeholder="mis. kopi, batik"
          className={kontrol}
        />
      </div>
      <div>
        <label htmlFor="f-kategori" className="text-sm font-medium text-fg">
          Kategori
        </label>
        <select id="f-kategori" name="kategori" defaultValue={kategori ?? ""} className={kontrol}>
          <option value="">Semua kategori</option>
          {daftarKategori.map((k) => (
            <option key={k.slug} value={k.slug}>
              {k.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-urut" className="text-sm font-medium text-fg">
          Urutkan
        </label>
        <select id="f-urut" name="urut" defaultValue={urut} className={kontrol}>
          {URUTAN.map((u) => (
            <option key={u} value={u}>
              {LABEL_URUTAN[u]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Terapkan</Button>
        {aktif && (
          <a href="/produk" className="text-sm text-primary underline">
            Reset
          </a>
        )}
      </div>
    </form>
  );
}
