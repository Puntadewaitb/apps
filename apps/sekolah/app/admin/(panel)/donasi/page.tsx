import type { Metadata } from "next";
import { Badge, Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import {
  DONATION_STATUSES,
  DONATION_STATUS_LABEL,
  isOneOf,
  type DonationStatus,
} from "../../../../lib/domain";
import { progresKosong, progresSemua } from "../../../../lib/donasi";
import { formatTanggal, rupiah } from "../../../../lib/format";
import { requireAdmin } from "../../../../lib/session";

export const metadata: Metadata = { title: "Kelola Donasi" };
export const dynamic = "force-dynamic";

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-sm font-medium ${on ? "border-primary bg-primary text-primary-fg" : "border-border bg-bg text-fg hover:bg-surface"}`;

export default async function DaftarDonasi({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; ok?: string }>;
}) {
  await requireAdmin("donasi", "/admin/donasi");
  const sp = await searchParams;
  const st0 = (Array.isArray(sp.status) ? sp.status[0] : sp.status)?.toUpperCase();
  const status: DonationStatus | undefined = isOneOf(DONATION_STATUSES, st0) ? st0 : undefined;
  const [programs, progres, rows, perStatus] = await Promise.all([
    db().donationProgram.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] }),
    progresSemua(),
    db().donation.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 300,
      include: { program: { select: { title: true } } },
    }),
    db().donation.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const jumlah = new Map(perStatus.map((g) => [g.status, g._count._all]));
  const total = [...jumlah.values()].reduce((a, b) => a + b, 0);
  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Donasi & Infaq</h1>
          <a href="/admin/donasi/program" className={tombolTabel}>
            Kelola program
          </a>
        </div>
        <div className="mt-4">
          <Flash ok={sp.ok} />
        </div>

        <h2 className="mt-2 mb-2 text-lg font-semibold text-fg">Ringkasan program</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-program">
            <caption className="sr-only">Ringkasan program donasi</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Program
                </th>
                <th scope="col" className="p-3">
                  Target
                </th>
                <th scope="col" className="p-3">
                  Terverifikasi
                </th>
                <th scope="col" className="p-3">
                  Progres
                </th>
                <th scope="col" className="p-3">
                  Menunggu
                </th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => {
                const g = progres.get(p.id) ?? progresKosong();
                return (
                  <tr key={p.id} data-testid="baris-program" className="border-t border-border">
                    <td className="p-3 font-medium text-fg">
                      {p.title} {!p.active && <Badge>Nonaktif</Badge>}
                    </td>
                    <td className="p-3 text-muted">{rupiah(p.target)}</td>
                    <td className="p-3 text-muted" data-testid="verif">
                      {rupiah(g.terkumpul)}
                    </td>
                    <td className="p-3 text-muted">{g.persen}%</td>
                    <td className="p-3 text-muted">{g.menunggu}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 mb-2 text-lg font-semibold text-fg">Konfirmasi transfer ({total})</h2>
        <nav aria-label="Filter status" className="mb-3 flex flex-wrap gap-2">
          <a
            href="/admin/donasi"
            aria-current={status ? undefined : "true"}
            className={chip(!status)}
          >
            Semua ({total})
          </a>
          {DONATION_STATUSES.map((s) => (
            <a
              key={s}
              href={`/admin/donasi?status=${s.toLowerCase()}`}
              aria-current={status === s ? "true" : undefined}
              className={chip(status === s)}
            >
              {DONATION_STATUS_LABEL[s]} ({jumlah.get(s) ?? 0})
            </a>
          ))}
        </nav>
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-donasi">
            <caption className="sr-only">Daftar konfirmasi donasi</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  Donatur
                </th>
                <th scope="col" className="p-3">
                  Program
                </th>
                <th scope="col" className="p-3">
                  Nominal
                </th>
                <th scope="col" className="p-3">
                  Tanggal
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-muted">
                    Tidak ada data.
                  </td>
                </tr>
              )}
              {rows.map((d) => (
                <tr key={d.id} data-testid="baris-donasi" className="border-t border-border">
                  <td className="p-3 font-medium text-fg">
                    {d.donorName}{" "}
                    {d.anonymous && <span className="text-xs text-muted">(anonim)</span>}
                  </td>
                  <td className="p-3 text-muted">{d.program.title}</td>
                  <td className="p-3 text-muted">{rupiah(d.amount)}</td>
                  <td className="p-3 text-muted">{formatTanggal(d.createdAt)}</td>
                  <td className="p-3">
                    <Badge tone={d.status === "TERVERIFIKASI" ? "primary" : "neutral"}>
                      {isOneOf(DONATION_STATUSES, d.status)
                        ? DONATION_STATUS_LABEL[d.status]
                        : d.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <a href={`/admin/donasi/${d.id}`} className={tombolTabel}>
                      Tinjau
                    </a>
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
