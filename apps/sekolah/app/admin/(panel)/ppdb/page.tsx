import type { Metadata } from "next";
import { Badge, Container } from "@tpl/ui";
import { tombolTabel } from "../../../../components/admin/ui";
import { db } from "../../../../lib/db";
import { REG_STATUSES, REG_STATUS_LABEL, isOneOf, type RegStatus } from "../../../../lib/domain";
import { formatTanggal } from "../../../../lib/format";
import { requireAdmin } from "../../../../lib/session";

export const metadata: Metadata = { title: "Kelola PPDB" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string | string[]; q?: string | string[] }> };

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-sm font-medium ${on ? "border-primary bg-primary text-primary-fg" : "border-border bg-bg text-fg hover:bg-surface"}`;

export default async function DaftarPpdb({ searchParams }: Props) {
  await requireAdmin("ppdb", "/admin/ppdb");
  const sp = await searchParams;
  const st0 = (Array.isArray(sp.status) ? sp.status[0] : sp.status)?.toUpperCase();
  const status: RegStatus | undefined = isOneOf(REG_STATUSES, st0) ? st0 : undefined;
  const q = ((Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "").trim().slice(0, 60);

  const [rows, perStatus] = await Promise.all([
    db().registration.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { studentName: { contains: q } },
                { regNo: { contains: q.toUpperCase() } },
                { parentName: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 300,
      select: {
        id: true,
        regNo: true,
        studentName: true,
        targetGrade: true,
        status: true,
        createdAt: true,
      },
    }),
    db().registration.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const jumlah = new Map(perStatus.map((g) => [g.status, g._count._all]));
  const total = [...jumlah.values()].reduce((a, b) => a + b, 0);
  const eksporHref = status
    ? `/admin/ppdb/ekspor?status=${status.toLowerCase()}`
    : "/admin/ppdb/ekspor";

  return (
    <main id="isi" className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Pendaftar PPDB ({total})</h1>
          <a href={eksporHref} className={tombolTabel} data-testid="ekspor-csv">
            Ekspor CSV{status ? ` (${REG_STATUS_LABEL[status]})` : ""}
          </a>
        </div>

        <nav aria-label="Filter status" className="mt-4 flex flex-wrap gap-2">
          <a
            href="/admin/ppdb"
            aria-current={status ? undefined : "true"}
            className={chip(!status)}
          >
            Semua ({total})
          </a>
          {REG_STATUSES.map((s) => (
            <a
              key={s}
              href={`/admin/ppdb?status=${s.toLowerCase()}`}
              aria-current={status === s ? "true" : undefined}
              className={chip(status === s)}
            >
              {REG_STATUS_LABEL[s]} ({jumlah.get(s) ?? 0})
            </a>
          ))}
        </nav>

        <form method="get" action="/admin/ppdb" role="search" className="mt-4 flex gap-2">
          {status && <input type="hidden" name="status" value={status.toLowerCase()} />}
          <label htmlFor="q" className="sr-only">
            Cari nama atau nomor
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            maxLength={60}
            placeholder="Cari nama / nomor pendaftaran"
            className="w-full max-w-sm rounded-md border border-border bg-bg px-3 py-2 text-fg"
          />
          <button type="submit" className={tombolTabel}>
            Cari
          </button>
        </form>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full text-left text-sm" data-testid="tabel-ppdb">
            <caption className="sr-only">Daftar pendaftar PPDB</caption>
            <thead className="bg-surface text-fg">
              <tr>
                <th scope="col" className="p-3">
                  No. pendaftaran
                </th>
                <th scope="col" className="p-3">
                  Nama
                </th>
                <th scope="col" className="p-3">
                  Jenjang
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
                    Tidak ada pendaftar yang cocok.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} data-testid="baris-ppdb" className="border-t border-border">
                  <td className="p-3 font-mono text-xs text-fg">{r.regNo}</td>
                  <td className="p-3 font-medium text-fg">{r.studentName}</td>
                  <td className="p-3 text-muted">{r.targetGrade}</td>
                  <td className="p-3 text-muted">{formatTanggal(r.createdAt)}</td>
                  <td className="p-3">
                    <Badge tone={r.status === "DITERIMA" ? "primary" : "neutral"}>
                      {isOneOf(REG_STATUSES, r.status) ? REG_STATUS_LABEL[r.status] : r.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <a href={`/admin/ppdb/${r.id}`} className={tombolTabel}>
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
