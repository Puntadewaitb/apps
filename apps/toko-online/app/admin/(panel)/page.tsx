import type { Metadata } from "next";
import { Badge, Card, Container } from "@tpl/ui";
import { ORDER_STATUS_LABEL, isOneOf, ORDER_STATUSES } from "../../../lib/domain";
import { rupiah } from "../../../lib/format";
import { ambilRingkasan } from "../../../lib/ringkasan";
import { requireAdmin } from "../../../lib/session";

export const metadata: Metadata = { title: "Ringkasan" };
export const dynamic = "force-dynamic";

const wib = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ akses?: string }>;
}) {
  const user = await requireAdmin("ringkasan", "/admin");
  const r = (await ambilRingkasan(user.role))!;
  const ditolak = (await searchParams).akses === "ditolak";
  const kartu = [
    {
      id: "pesanan-hari-ini",
      judul: "Pesanan hari ini",
      nilai: String(r.pesananHariIni),
      ket: "tanggal pesanan (WIB)",
    },
    {
      id: "omzet-hari-ini",
      judul: "Omzet hari ini",
      nilai: rupiah(r.omzetHariIni),
      ket: "pesanan sudah dibayar, tidak dibatalkan",
    },
    {
      id: "menunggu-bayar",
      judul: "Menunggu pembayaran",
      nilai: String(r.menungguBayar),
      ket: "semua waktu",
    },
    {
      id: "perlu-diproses",
      judul: "Perlu diproses",
      nilai: String(r.perluDiproses),
      ket: "sudah dibayar, belum diproses",
    },
    {
      id: "stok-menipis",
      judul: "Stok menipis",
      nilai: String(r.stokMenipis),
      ket: "varian dengan stok 1–5",
    },
    {
      id: "stok-habis",
      judul: "Stok habis",
      nilai: String(r.stokHabis),
      ket: "varian aktif bersetok 0",
    },
    {
      id: "produk-aktif",
      judul: "Produk aktif",
      nilai: String(r.produkAktif),
      ket: "tampil di toko",
    },
  ];
  return (
    <main id="isi" className="py-10">
      <Container>
        <h1 className="text-2xl font-bold text-fg">Dashboard Admin</h1>
        <p className="text-sm text-muted" data-testid="info-pengguna">
          {user.name} · {user.role === "ADMIN" ? "Administrator" : "Staf"}
        </p>
        {ditolak && (
          <p
            role="alert"
            data-testid="akses-ditolak"
            className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
          >
            Anda tidak memiliki akses ke halaman tersebut.
          </p>
        )}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kartu.map((k) => (
            <li key={k.id}>
              <Card className="h-full" data-testid={`kartu-${k.id}`}>
                <p className="text-sm text-muted">{k.judul}</p>
                <p className="mt-1 text-2xl font-bold text-fg" data-testid={`nilai-${k.id}`}>
                  {k.nilai}
                </p>
                <p className="mt-1 text-xs text-muted">{k.ket}</p>
              </Card>
            </li>
          ))}
        </ul>
        <section className="mt-10" aria-labelledby="terbaru">
          <h2 id="terbaru" className="text-lg font-semibold text-fg">
            Pesanan terbaru
          </h2>
          {r.terbaru.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Belum ada pesanan.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-bg">
              <table className="w-full text-left text-sm" data-testid="tabel-terbaru">
                <caption className="sr-only">Lima pesanan terbaru</caption>
                <thead className="bg-surface text-fg">
                  <tr>
                    <th scope="col" className="p-3">
                      Kode
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
                      Waktu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.terbaru.map((o) => (
                    <tr key={o.code} className="border-t border-border">
                      <td className="p-3 font-mono">
                        <a href={`/admin/pesanan/${o.id}`} className="underline">
                          {o.code}
                        </a>
                      </td>
                      <td className="p-3">{o.customerName}</td>
                      <td className="p-3">{rupiah(o.total)}</td>
                      <td className="p-3">
                        <Badge>
                          {isOneOf(ORDER_STATUSES, o.status) ? ORDER_STATUS_LABEL[o.status] : "—"}
                        </Badge>
                      </td>
                      <td className="p-3">{wib(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
