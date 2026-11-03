import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TombolCetak } from "../../../../../../components/admin/TombolCetak";
import { db } from "../../../../../../lib/db";
import { ORDER_STATUS_LABEL, ORDER_STATUSES, isOneOf } from "../../../../../../lib/domain";
import { rupiah } from "../../../../../../lib/format";
import { requireAdmin } from "../../../../../../lib/session";
import { getPengaturan } from "../../../../../../lib/setting";

export const metadata: Metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

const wib = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(d);

/** Invoice siap cetak (A4). Menu admin disembunyikan saat dicetak (kelas print:hidden di layout). */
export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("pesanan", `/admin/pesanan/${id}/invoice`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const [o, s] = await Promise.all([
    db().order.findUnique({
      where: { id: Number(id) },
      include: { items: { orderBy: { id: "asc" } } },
    }),
    getPengaturan(),
  ]);
  if (!o) notFound();
  const status = isOneOf(ORDER_STATUSES, o.status) ? ORDER_STATUS_LABEL[o.status] : "—";
  const lunas = o.status !== "MENUNGGU_BAYAR" && o.status !== "DIBATALKAN";
  return (
    <main
      id="isi"
      className="mx-auto max-w-3xl bg-white p-8 text-black print:max-w-none print:p-0"
      data-testid="invoice"
    >
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a href={`/admin/pesanan/${o.id}`} className="text-sm underline">
          ← Detail pesanan
        </a>
        <TombolCetak />
      </div>
      <header className="flex items-start justify-between gap-6 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="inv-toko">
            {s.nama}
          </h1>
          {s.alamat && <p className="mt-1 text-sm">{s.alamat}</p>}
          {s.whatsapp && <p className="text-sm">WhatsApp: +{s.whatsapp}</p>}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold tracking-wide">INVOICE</p>
          <p className="font-mono text-sm" data-testid="inv-kode">
            {o.code}
          </p>
          <p className="text-sm">{wib(o.createdAt)}</p>
          <p className="mt-1 text-sm font-semibold" data-testid="inv-status">
            {lunas ? "LUNAS" : status.toUpperCase()}
          </p>
        </div>
      </header>
      <section className="mt-4 text-sm" aria-labelledby="inv-untuk">
        <h2 id="inv-untuk" className="font-semibold">
          Ditagihkan / dikirim kepada
        </h2>
        <p>{o.customerName}</p>
        <p>{o.customerPhone}</p>
        <p className="whitespace-pre-line">{o.address}</p>
        <p>{o.city}</p>
      </section>
      <table className="mt-6 w-full text-left text-sm">
        <caption className="sr-only">Rincian barang</caption>
        <thead>
          <tr className="border-b border-gray-400">
            <th scope="col" className="py-2">
              Barang
            </th>
            <th scope="col" className="py-2 text-right">
              Harga
            </th>
            <th scope="col" className="py-2 text-right">
              Jml
            </th>
            <th scope="col" className="py-2 text-right">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id} className="border-b border-gray-200">
              <td className="py-2">
                {i.productName}
                {i.variantName !== "Standar" && ` (${i.variantName})`}
              </td>
              <td className="py-2 text-right">{rupiah(i.unitPrice)}</td>
              <td className="py-2 text-right">{i.qty}</td>
              <td className="py-2 text-right">{rupiah(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 w-64 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{rupiah(o.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Ongkir</dt>
          <dd>{rupiah(o.shippingCost)}</dd>
        </div>
        {o.discount > 0 && (
          <div className="flex justify-between">
            <dt>Diskon{o.voucherCode && ` (${o.voucherCode})`}</dt>
            <dd>-{rupiah(o.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-400 pt-1 text-base font-bold">
          <dt>Total</dt>
          <dd data-testid="inv-total">{rupiah(o.total)}</dd>
        </div>
      </dl>
      {!lunas && o.status !== "DIBATALKAN" && s.rekening.length > 0 && (
        <section className="mt-8 text-sm" aria-labelledby="inv-bayar">
          <h2 id="inv-bayar" className="font-semibold">
            Pembayaran via transfer
          </h2>
          {s.catatanBayar && <p>{s.catatanBayar}</p>}
          <ul className="mt-1">
            {s.rekening.map((r, i) => (
              <li key={i}>
                {r.bank} · {r.nomor} · a.n. {r.atasNama}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-10 text-center text-xs text-gray-600">
        Terima kasih telah berbelanja di {s.nama}.
      </p>
    </main>
  );
}
