import { geserBulan, gridBulan, kunciBulan, petaPerHari, type AgendaItem } from "../lib/agenda";
import { formatBulanTahun, hariWib } from "../lib/format";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

type Props = {
  tahun: number;
  bulan: number;
  items: Array<AgendaItem & { title: string }>;
  sekarang?: Date;
};

/** Kalender bulanan (tabel) + navigasi bulan berbasis URL (?bulan=YYYY-MM) — jalan tanpa JavaScript. */
export function Kalender({ tahun, bulan, items, sekarang = new Date() }: Props) {
  const grid = gridBulan(tahun, bulan);
  const peta = petaPerHari(items);
  const judul = new Map(items.map((i) => [i.id, i.title]));
  const hariIni = hariWib(sekarang);
  const prev = geserBulan(tahun, bulan, -1);
  const next = geserBulan(tahun, bulan, 1);
  const nama = formatBulanTahun(new Date(Date.UTC(tahun, bulan - 1, 15)));
  const linkCls =
    "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface";

  return (
    <div data-testid="kalender" data-bulan={kunciBulan(tahun, bulan)}>
      <nav aria-label="Navigasi bulan" className="mb-4 flex items-center justify-between gap-2">
        <a
          href={`/agenda?bulan=${kunciBulan(prev.tahun, prev.bulan)}`}
          rel="prev"
          className={linkCls}
        >
          <span aria-hidden="true">← </span>Bulan sebelumnya
        </a>
        <a href="/agenda" className={linkCls}>
          Bulan ini
        </a>
        <a
          href={`/agenda?bulan=${kunciBulan(next.tahun, next.bulan)}`}
          rel="next"
          className={linkCls}
        >
          Bulan berikutnya<span aria-hidden="true"> →</span>
        </a>
      </nav>
      <table className="w-full table-fixed border-collapse text-sm">
        <caption
          className="mb-2 text-left text-xl font-bold capitalize text-fg"
          data-testid="judul-bulan"
        >
          {nama}
        </caption>
        <thead>
          <tr>
            {HARI.map((h, i) => (
              <th
                key={h}
                scope="col"
                className="border border-border bg-surface p-1 text-xs font-semibold text-fg sm:p-2"
              >
                <abbr title={h} className="no-underline">
                  {SINGKAT[i]}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((minggu) => (
            <tr key={minggu[0]!.tanggal}>
              {minggu.map((s) => {
                const ids = peta.get(s.tanggal) ?? [];
                return (
                  <td
                    key={s.tanggal}
                    data-tanggal={s.tanggal}
                    data-jumlah={ids.length}
                    className={`h-14 border border-border p-1 align-top sm:h-24 sm:p-1.5 ${s.diBulanIni ? "bg-bg" : "bg-surface text-muted"}`}
                  >
                    <span
                      {...(s.tanggal === hariIni ? { "aria-current": "date" as const } : {})}
                      className={`inline-block min-w-6 rounded-full text-center text-xs sm:text-sm ${s.tanggal === hariIni ? "bg-primary font-bold text-primary-fg" : ""}`}
                    >
                      {s.hari}
                    </span>
                    {s.diBulanIni && ids.length > 0 && (
                      <>
                        <ul className="mt-1 hidden space-y-1 sm:block">
                          {ids.slice(0, 2).map((id) => (
                            <li key={id}>
                              <a
                                href={`#agenda-${id}`}
                                className="block truncate rounded bg-primary/10 px-1 py-0.5 text-xs text-primary underline-offset-2 hover:underline"
                              >
                                {judul.get(id)}
                              </a>
                            </li>
                          ))}
                          {ids.length > 2 && (
                            <li className="text-xs text-muted">+{ids.length - 2} lagi</li>
                          )}
                        </ul>
                        <a
                          href={`#agenda-${ids[0]}`}
                          className="mt-1 flex justify-center gap-0.5 sm:hidden"
                        >
                          <span className="sr-only">{ids.length} kegiatan</span>
                          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
                        </a>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
