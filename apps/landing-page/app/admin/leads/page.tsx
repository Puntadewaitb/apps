import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button, ButtonLink, Container } from "@tpl/ui";
import { isAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";

export const metadata: Metadata = { title: "Leads", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function LeadsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [total, leads] = await Promise.all([
    db().lead.count(),
    db().lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  return (
    <main className="py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-fg">Leads ({total})</h1>
          <div className="flex gap-2">
            <ButtonLink href="/admin/leads/export" variant="secondary" size="sm">
              Ekspor CSV
            </ButtonLink>
            <form method="post" action="/api/admin/logout">
              <Button type="submit" variant="ghost" size="sm">
                Keluar
              </Button>
            </form>
          </div>
        </div>
        {total > leads.length && (
          <p className="mt-2 text-sm text-muted">
            Menampilkan {leads.length} terbaru. CSV memuat semua data.
          </p>
        )}
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-3 py-2">Waktu (WIB)</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">No. HP</th>
                <th className="px-3 py-2">Pesan</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted">
                    Belum ada lead.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-2">{fmt.format(l.createdAt)}</td>
                  <td className="px-3 py-2">{l.name}</td>
                  <td className="whitespace-nowrap px-3 py-2">{l.phone}</td>
                  <td className="max-w-md whitespace-pre-wrap break-words px-3 py-2">
                    {l.message}
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
