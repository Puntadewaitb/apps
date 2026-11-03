import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Button, Container } from "@tpl/ui";
import { Flash } from "../../../../../components/admin/Flash";
import { input, tombolTabel } from "../../../../../components/admin/ui";
import { db } from "../../../../../lib/db";
import { ORDER_STATUS_LABEL, isOneOf, ORDER_STATUSES } from "../../../../../lib/domain";
import { rupiah } from "../../../../../lib/format";
import { requireAdmin } from "../../../../../lib/session";
import { pilihanStatus } from "../../../../../lib/status";
import { simpanCatatan, ubahStatus } from "../actions";

export const metadata: Metadata = { title: "Detail Pesanan" };
export const dynamic = "force-dynamic";

const wib = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);

export default async function DetailPesanan({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; galat?: string }>;
}) {
  const { id } = await params;
  await requireAdmin("pesanan", `/admin/pesanan/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const sp = await searchParams;
  const o = await db().order.findUnique({
    where: { id: Number(id) },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!o) notFound();
  const berikut = pilihanStatus(o.status);
  const label = isOneOf(ORDER_STATUSES, o.status) ? ORDER_STATUS_LABEL[o.status] : "—";
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-4xl">
        <a href="/admin/pesanan" className="text-sm underline">
          ← Daftar pesanan
        </a>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">
            Pesanan{" "}
            <span className="font-mono" data-testid="kode">
              {o.code}
            </span>
          </h1>
          <div className="flex gap-2">
            <a
              href={`/admin/pesanan/${o.id}/invoice`}
              className={tombolTabel}
              data-testid="link-invoice"
            >
              Invoice (cetak)
            </a>
            {o.paymentProof && (
              <a
                href={`/admin/pesanan/bukti/${o.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={tombolTabel}
                data-testid="link-bukti"
              >
                Lihat bukti bayar
              </a>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">Dibuat {wib(o.createdAt)}</p>
        <div className="mt-4">
          <Flash ok={sp.ok} galat={sp.galat} />
        </div>
        <section aria-labelledby="status" className="rounded-lg border border-border bg-bg p-4">
          <h2 id="status" className="font-semibold text-fg">
            Status
          </h2>
          <p className="mt-1" data-testid="status-saat-ini">
            <Badge tone="primary">{label}</Badge>
          </p>
          {berikut.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Status ini final dan tidak dapat diubah.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2" data-testid="aksi-status">
              {berikut.map((ke) => (
                <form key={ke} action={ubahStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="dari" value={o.status} />
                  <input type="hidden" name="ke" value={ke} />
                  <Button
                    type="submit"
                    variant={ke === "DIBATALKAN" ? "secondary" : "primary"}
                    data-testid={`ke-${ke}`}
                  >
                    {ke === "DIBATALKAN" ? "Batalkan pesanan" : `Tandai: ${ORDER_STATUS_LABEL[ke]}`}
                  </Button>
                </form>
              ))}
            </div>
          )}
          {berikut.includes("DIBATALKAN") && (
            <p className="mt-2 text-xs text-muted">
              Pembatalan mengembalikan stok barang dan kuota voucher.
            </p>
          )}
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section aria-labelledby="pembeli" className="rounded-lg border border-border bg-bg p-4">
            <h2 id="pembeli" className="font-semibold text-fg">
              Pembeli
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="text-muted">Nama</dt>
                <dd data-testid="p-nama">{o.customerName}</dd>
              </div>
              <div>
                <dt className="text-muted">No. HP</dt>
                <dd data-testid="p-hp">{o.customerPhone}</dd>
              </div>
              {o.customerEmail && (
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd>{o.customerEmail}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Kota</dt>
                <dd>{o.city}</dd>
              </div>
              <div>
                <dt className="text-muted">Alamat</dt>
                <dd className="whitespace-pre-line">{o.address}</dd>
              </div>
              {o.note && (
                <div>
                  <dt className="text-muted">Catatan pembeli</dt>
                  <dd className="whitespace-pre-line">{o.note}</dd>
                </div>
              )}
            </dl>
          </section>
          <section aria-labelledby="rincian" className="rounded-lg border border-border bg-bg p-4">
            <h2 id="rincian" className="font-semibold text-fg">
              Rincian
            </h2>
            <ul className="mt-2 divide-y divide-border text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {i.productName}
                    {i.variantName !== "Standar" && ` (${i.variantName})`} × {i.qty}
                  </span>
                  <span className="whitespace-nowrap">{rupiah(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="whitespace-nowrap">{rupiah(o.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Ongkir</dt>
                <dd className="whitespace-nowrap">{rupiah(o.shippingCost)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between">
                  <dt>Diskon{o.voucherCode && ` (${o.voucherCode})`}</dt>
                  <dd>-{rupiah(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-fg">
                <dt>Total</dt>
                <dd data-testid="total" className="whitespace-nowrap">
                  {rupiah(o.total)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section
          aria-labelledby="catatan"
          className="mt-6 rounded-lg border border-border bg-bg p-4"
        >
          <h2 id="catatan" className="font-semibold text-fg">
            Catatan internal
          </h2>
          <p className="text-xs text-muted">
            Hanya terlihat oleh admin/staf — tidak tampil di halaman pelacakan pembeli.
          </p>
          <form action={simpanCatatan} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={o.id} />
            <label htmlFor="catatan-isi" className="sr-only">
              Catatan internal
            </label>
            <textarea
              id="catatan-isi"
              name="catatan"
              rows={3}
              maxLength={500}
              defaultValue={o.adminNote}
              className={input}
            />
            <Button type="submit" variant="secondary">
              Simpan catatan
            </Button>
          </form>
        </section>
      </Container>
    </main>
  );
}
