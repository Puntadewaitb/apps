import type { Metadata } from "next";
import { Badge, Button, Container } from "@tpl/ui";
import { input } from "../../../../components/admin/ui";
import { can } from "../../../../lib/auth-core";
import { db } from "../../../../lib/db";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, isOneOf } from "../../../../lib/domain";
import { rupiah } from "../../../../lib/format";
import { parseHalaman } from "../../../../lib/katalog";
import { requireAdmin } from "../../../../lib/session";

export const metadata: Metadata = { title: "Kelola Pesanan" };
export const dynamic = "force-dynamic";

const PER_HALAMAN = 25;
const wib = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);
const url = (o: { status?: string; q?: string; halaman?: number }) => {
  const p = new URLSearchParams();
  if (o.status) p.set("status", o.status);
  if (o.q) p.set("q", o.q);
  if (o.halaman && o.halaman > 1) p.set("halaman", String(o.halaman));
  return `/admin/pesanan${p.size ? `?${p}` : ""}`;
};

export default async function DaftarPesanan({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAdmin("pesanan", "/admin/pesanan");
  const sp = await searchParams;
  const status = isOneOf(ORDER_STATUSES, sp.status) ? sp.status : undefined;
  // Wildcard LIKE (% _ \) dibuang dari kata kunci agar dicari sebagai teks biasa.
  const qMentah = (sp.q ?? "").trim().slice(0, 60);
  const q = qMentah.replace(/[%_\\]/g, "").trim();
  const where = {
    ...(status ? { status } : {}),
    // Kata kunci yang HANYA berisi wildcard (mis. "%") tidak cocok dengan apa pun (bukan "semua").
    ...(qMentah && !q ? { id: -1 } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q.toUpperCase() } },
            { customerName: { contains: q } },
            { customerPhone: { contains: q.replace(/\D/g, "") || "\u0000" } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db().order.count({ where }),
    db().order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (parseHalaman(sp.halaman) - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
    }),
  ]);
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const halaman = Math.min(parseHalaman(sp.halaman), jumlahHalaman);
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Kelola Pesanan</h1>
          {can(user.role, "laporan") && (
            <a
              href={`/admin/pesanan/ekspor${status ? `?status=${status}` : ""}`}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface"
              data-testid="ekspor-csv"
            >
              Ekspor CSV{status ? ` (${ORDER_STATUS_LABEL[status]})` : ""}
            </a>
          )}
        </div>
        <form
          method="get"
          role="search"
          aria-label="Cari pesanan"
          className="my-6 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
        >
          <div>
            <label htmlFor="q" className="text-sm font-medium text-fg">
              Cari kode / nama / HP
            </label>
            <input id="q" name="q" defaultValue={q} maxLength={60} className={`mt-1 ${input}`} />
          </div>
          <div>
            <label htmlFor="status" className="text-sm font-medium text-fg">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className={`mt-1 ${input}`}
            >
              <option value="">Semua</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">
            Terapkan
          </Button>
        </form>
        <p className="mb-2 text-sm text-muted" data-testid="jumlah-pesanan">
          {total} pesanan · halaman {halaman} dari {jumlahHalaman}
        </p>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-pesanan">
            <caption className="sr-only">Daftar pesanan</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Kode
                </th>
                <th scope="col" className="p-3">
                  Waktu
                </th>
                <th scope="col" className="p-3">
                  Pembeli
                </th>
                <th scope="col" className="p-3">
                  Total
                </th>
                <th scope="col" className="p-3">
                  Status
                </th>
                <th scope="col" className="p-3">
                  Bukti
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} data-testid="baris-pesanan" className="border-t border-border">
                  <td className="p-3 font-mono">
                    <a href={`/admin/pesanan/${o.id}`} className="underline">
                      {o.code}
                    </a>
                  </td>
                  <td className="p-3">{wib(o.createdAt)}</td>
                  <td className="p-3">{o.customerName}</td>
                  <td className="p-3">{rupiah(o.total)}</td>
                  <td className="p-3">
                    <Badge
                      tone={
                        o.status === "DIBATALKAN"
                          ? "danger"
                          : o.status === "MENUNGGU_BAYAR"
                            ? "neutral"
                            : "primary"
                      }
                    >
                      {isOneOf(ORDER_STATUSES, o.status) ? ORDER_STATUS_LABEL[o.status] : "—"}
                    </Badge>
                  </td>
                  <td className="p-3">{o.paymentProof ? "Ada" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {jumlahHalaman > 1 && (
          <nav
            aria-label="Halaman pesanan"
            className="mt-6 flex items-center justify-center gap-3 text-sm"
          >
            {halaman > 1 && (
              <a href={url({ status, q, halaman: halaman - 1 })} rel="prev" className="underline">
                Sebelumnya
              </a>
            )}
            <span aria-current="page">Halaman {halaman}</span>
            {halaman < jumlahHalaman && (
              <a href={url({ status, q, halaman: halaman + 1 })} rel="next" className="underline">
                Berikutnya
              </a>
            )}
          </nav>
        )}
      </Container>
    </main>
  );
}
