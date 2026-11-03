import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Container } from "@tpl/ui";
import { Flash } from "../../../../../components/admin/Flash";
import { tombolTabel } from "../../../../../components/admin/ui";
import { db } from "../../../../../lib/db";
import { DONATION_STATUS_LABEL, isOneOf, DONATION_STATUSES } from "../../../../../lib/domain";
import { formatTanggal, formatJam, rupiah } from "../../../../../lib/format";
import { requireAdmin } from "../../../../../lib/session";
import { ubahStatusDonasi } from "../actions";

export const metadata: Metadata = { title: "Tinjau Donasi" };
export const dynamic = "force-dynamic";

export default async function DonasiDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  await requireAdmin("donasi", `/admin/donasi/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const d = await db().donation.findUnique({
    where: { id: Number(id) },
    include: { program: { select: { title: true } } },
  });
  if (!d) notFound();
  const st = isOneOf(DONATION_STATUSES, d.status) ? d.status : undefined;
  const aksi: Array<{ status: string; label: string }> = [
    { status: "TERVERIFIKASI", label: "Verifikasi" },
    { status: "DITOLAK", label: "Tolak" },
    { status: "MENUNGGU", label: "Kembalikan ke menunggu" },
  ].filter((a) => a.status !== d.status);
  const baris: Array<[string, string]> = [
    ["Program", d.program.title],
    ["Nama donatur", d.donorName],
    ["Tampil anonim", d.anonymous ? "Ya" : "Tidak"],
    ["Nominal", rupiah(d.amount)],
    ["Pesan", d.message || "—"],
    ["Dikirim", `${formatTanggal(d.createdAt)}, ${formatJam(d.createdAt)} WIB`],
    [
      "Diverifikasi",
      d.verifiedAt ? `${formatTanggal(d.verifiedAt)}, ${formatJam(d.verifiedAt)} WIB` : "—",
    ],
  ];
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
          <a href="/admin/donasi" className="underline underline-offset-2">
            Donasi
          </a>
          <span aria-hidden="true"> / </span>
          <span>#{d.id}</span>
        </nav>
        <h1 className="text-2xl font-bold text-fg">Konfirmasi donasi #{d.id}</h1>
        <p className="mt-2">
          <Badge
            tone={d.status === "TERVERIFIKASI" ? "primary" : "neutral"}
            data-testid="status-donasi"
          >
            {st ? DONATION_STATUS_LABEL[st] : d.status}
          </Badge>
        </p>
        <div className="mt-4">
          <Flash ok={(await searchParams).ok} />
        </div>
        <dl
          className="grid gap-x-8 gap-y-3 rounded-lg border border-border bg-bg p-5 sm:grid-cols-2"
          data-testid="data-donasi"
        >
          {baris.map(([k, v]) => (
            <div key={k}>
              <dt className="text-sm font-medium text-fg">{k}</dt>
              <dd className="break-words text-muted">{v}</dd>
            </div>
          ))}
        </dl>
        <section aria-labelledby="h-bukti" className="mt-6">
          <h2 id="h-bukti" className="mb-1 text-lg font-semibold text-fg">
            Bukti transfer
          </h2>
          {d.proofPath ? (
            <a
              href={`/admin/donasi/bukti/${d.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
              data-testid="link-bukti"
            >
              Buka bukti transfer
            </a>
          ) : (
            <p className="text-muted">Tidak ada bukti.</p>
          )}
        </section>
        <section aria-labelledby="h-aksi" className="mt-6">
          <h2 id="h-aksi" className="mb-2 text-lg font-semibold text-fg">
            Tindakan
          </h2>
          <div className="flex flex-wrap gap-2">
            {aksi.map((a) => (
              <form key={a.status} action={ubahStatusDonasi}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="status" value={a.status} />
                <button type="submit" className={tombolTabel}>
                  {a.label}
                </button>
              </form>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Hanya donasi berstatus Terverifikasi yang dihitung pada progres program.
          </p>
        </section>
      </Container>
    </main>
  );
}
