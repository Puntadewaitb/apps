import { daftarHalaman, urlKatalog, type Urutan } from "../lib/katalog";

type Props = { halaman: number; jumlah: number; kategori?: string; q?: string; urut: Urutan };

export function Paginasi({ halaman, jumlah, kategori, q, urut }: Props) {
  if (jumlah <= 1) return null;
  const href = (n: number) => urlKatalog({ kategori, q, urut, halaman: n });
  const tombol =
    "inline-flex min-w-10 items-center justify-center rounded-md border border-border px-3 py-2 text-sm hover:bg-surface";
  return (
    <nav aria-label="Halaman katalog" className="mt-10" data-testid="paginasi">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {halaman > 1 && (
          <li>
            <a href={href(halaman - 1)} rel="prev" className={tombol}>
              Sebelumnya
            </a>
          </li>
        )}
        {daftarHalaman(halaman, jumlah).map((n, i) =>
          n === null ? (
            <li key={`e${i}`} aria-hidden="true" className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <a
                href={href(n)}
                aria-label={`Halaman ${n}`}
                aria-current={n === halaman ? "page" : undefined}
                className={
                  n === halaman
                    ? `${tombol} border-primary bg-primary text-primary-fg hover:bg-primary`
                    : tombol
                }
              >
                {n}
              </a>
            </li>
          ),
        )}
        {halaman < jumlah && (
          <li>
            <a href={href(halaman + 1)} rel="next" className={tombol}>
              Berikutnya
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
