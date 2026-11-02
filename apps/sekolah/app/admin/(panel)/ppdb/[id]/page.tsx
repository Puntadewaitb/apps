import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { FormStatusPpdb } from "../../../../../components/admin/FormStatusPpdb";
import { labelDokumen } from "../../../../../content/ppdb";
import { db } from "../../../../../lib/db";
import { parseDokumen } from "../../../../../lib/dokumen";
import { formatTanggal } from "../../../../../lib/format";
import { requireAdmin } from "../../../../../lib/session";
import { ubahStatusPpdb } from "../actions";

export const metadata: Metadata = { title: "Tinjau Pendaftar" };
export const dynamic = "force-dynamic";

export default async function PpdbDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin("ppdb", `/admin/ppdb/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const r = await db().registration.findUnique({ where: { id: Number(id) } });
  if (!r) notFound();
  const dok = parseDokumen(r.documents);
  const baris: Array<[string, string]> = [
    ["Nama calon siswa", r.studentName],
    ["Tempat, tanggal lahir", `${r.birthPlace}, ${formatTanggal(r.birthDate)}`],
    ["Jenis kelamin", r.gender === "L" ? "Laki-laki" : "Perempuan"],
    ["Asal sekolah", r.previousSchool || "—"],
    ["Jenjang tujuan", r.targetGrade],
    ["Alamat", r.address],
    ["Nama orang tua/wali", r.parentName],
    ["No. HP / WhatsApp", r.parentPhone],
    ["Email", r.parentEmail || "—"],
    ["Pekerjaan", r.parentJob || "—"],
    ["Tanggal daftar", formatTanggal(r.createdAt)],
  ];
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
          <a href="/admin/ppdb" className="underline underline-offset-2">
            Pendaftar PPDB
          </a>
          <span aria-hidden="true"> / </span>
          <span className="font-mono">{r.regNo}</span>
        </nav>
        <h1 className="text-2xl font-bold text-fg" data-testid="nama-pendaftar">
          {r.studentName}
        </h1>
        <dl
          className="mt-4 grid gap-x-8 gap-y-3 rounded-lg border border-border bg-bg p-5 sm:grid-cols-2"
          data-testid="data-pendaftar"
        >
          {baris.map(([k, v]) => (
            <div key={k}>
              <dt className="text-sm font-medium text-fg">{k}</dt>
              <dd className="break-words text-muted">{v}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="h-dok" className="mt-8">
          <h2 id="h-dok" className="mb-2 text-lg font-semibold text-fg">
            Dokumen
          </h2>
          {dok.length === 0 ? (
            <p className="text-muted">Tidak ada dokumen.</p>
          ) : (
            <ul className="space-y-1" data-testid="dokumen-pendaftar">
              {dok.map((d) => (
                <li key={d.kind}>
                  <a
                    href={`/admin/ppdb/dokumen/${r.id}/${d.kind}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    {labelDokumen(d.kind)}
                  </a>{" "}
                  <span className="text-sm text-muted">
                    ({d.mime.split("/")[1]}, {Math.max(1, Math.round(d.size / 1024))} KB)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="h-status" className="mt-8 max-w-xl">
          <h2 id="h-status" className="mb-3 text-lg font-semibold text-fg">
            Tinjauan
          </h2>
          <FormStatusPpdb
            action={ubahStatusPpdb}
            nilai={{ id: r.id, status: r.status, adminNote: r.adminNote }}
          />
        </section>
      </Container>
    </main>
  );
}
