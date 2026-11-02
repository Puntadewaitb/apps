import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, ButtonLink, Container } from "@tpl/ui";
import { isAdmin } from "../../../../lib/admin-auth";
import { db } from "../../../../lib/db";
import { getKonten } from "../../../../lib/konten";

export const metadata: Metadata = { title: "Pesan Masuk", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function PesanPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [total, rows] = await Promise.all([
    db().pesan.count(),
    db().pesan.findMany({ orderBy: { id: "desc" }, take: 200 }),
  ]);
  const layanan = new Map(getKonten().layanan.map((l) => [l.slug, l.nama]));

  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Pesan Masuk ({total})</h1>
          <div className="flex gap-2">
            <ButtonLink href="/admin/pesan/ekspor" variant="secondary" size="sm">
              Ekspor CSV
            </ButtonLink>
            <form method="post" action="/api/admin/logout">
              <Button type="submit" variant="ghost" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </div>
        {total > rows.length && (
          <p className="mt-2 text-sm text-muted">
            Menampilkan {rows.length} terbaru. CSV memuat semua data.
          </p>
        )}
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-3 py-2">Waktu (WIB)</th>
                <th className="px-3 py-2">Pengirim</th>
                <th className="px-3 py-2">Layanan</th>
                <th className="px-3 py-2">Pesan</th>
                <th className="px-3 py-2">Email notifikasi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted">
                    Belum ada pesan.
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-border align-top"
                  data-testid="baris-pesan"
                >
                  <td className="whitespace-nowrap px-3 py-2">{fmt.format(p.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-fg">{p.nama}</div>
                    <div className="text-muted">{p.email}</div>
                    {p.telepon && <div className="text-muted">{p.telepon}</div>}
                  </td>
                  <td className="px-3 py-2">
                    {p.layanan ? (layanan.get(p.layanan) ?? p.layanan) : "—"}
                  </td>
                  <td className="max-w-md whitespace-pre-wrap break-words px-3 py-2">{p.isi}</td>
                  <td className="px-3 py-2">{p.emailTerkirim ? "Terkirim" : "Tidak terkirim"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </main>
  );
}
