// Sample statis sekolah. Halaman dirender dari data SEED (DB sementara saat build). Bagian yang butuh server:
//  - ?bulan= / ?jenis= → halaman statis per bulan / jenis (jendela bulan relatif waktu build). Paginasi ?halaman= tidak
//    dibuat: seed (6 berita) muat 1 halaman; tes demo/e2e/sekolah.spec.ts GAGAL bila seed bertambah melewati 1 halaman.
//  - server action PPDB & donasi → simulasi di peramban (skema validasi & pemeriksa berkas sama; localStorage)
//  - admin, API, unggahan → tidak disertakan
// Data seed bertanggal RELATIF waktu seed → rebuild berkala (workflow Pages terjadwal) menjaga agenda tetap "segar".
const config = {
  db: true,
  seed: "prisma/seed.ts",
  seedFlags: ["--env-file-if-exists=.env"],
  // Kredensial di bawah hanya untuk DB sekali pakai saat build (tidak dipublikasikan, bukan rahasia).
  seedEnv: {
    ADMIN_EMAIL: "admin@demo.invalid",
    ADMIN_PASSWORD: "demo-build-only-not-a-secret-1",
    EDITOR_PASSWORD: "demo-build-only-not-a-secret-2",
  },
  keep: ["prisma", "prisma.config.ts"],
  remove: [
    "lib/auth.ts",
    "lib/auth-core.ts",
    "lib/session.ts",
    "lib/login.ts",
    "lib/limiters.ts",
    "lib/csv.ts",
    "lib/ringkasan.ts",
  ],
  patches: [
    // ---- Agenda: ?bulan= → /agenda/bulan/YYYY-MM/ ----
    {
      file: "app/(publik)/agenda/page.tsx",
      find: "type Props = { searchParams: Promise<{ bulan?: string | string[] }> };",
      replace: "type Props = { bulan?: string };",
    },
    {
      file: "app/(publik)/agenda/page.tsx",
      find: "export default async function AgendaPage({ searchParams }: Props) {",
      replace: "export async function AgendaIsi({ bulan }: Props) {",
    },
    {
      file: "app/(publik)/agenda/page.tsx",
      find: "parseBulan((await searchParams).bulan) ??",
      replace: "parseBulan(bulan) ??",
    },
    {
      file: "app/(publik)/agenda/page.tsx",
      find: "    </main>\n  );\n}",
      replace:
        "    </main>\n  );\n}\n\nexport default function AgendaPage() {\n  return AgendaIsi({});\n}",
    },
    // Navigasi bulan: path statis; di luar rentang yang dibuat (lib/demo-rentang.ts) → nonaktif, bukan tautan putus.
    {
      file: "components/Kalender.tsx",
      find: 'import { formatBulanTahun, hariWib } from "../lib/format";',
      replace:
        'import { formatBulanTahun, hariWib } from "../lib/format";\nimport { bulanTersedia } from "../lib/demo-rentang";',
    },
    {
      file: "components/Kalender.tsx",
      find: '        <a\n          href={`/agenda?bulan=${kunciBulan(prev.tahun, prev.bulan)}`}\n          rel="prev"\n          className={linkCls}\n        >\n          <span aria-hidden="true">← </span>Bulan sebelumnya\n        </a>',
      replace:
        '        {bulanTersedia(prev.tahun, prev.bulan) ? (\n          <a\n            href={`/agenda/bulan/${kunciBulan(prev.tahun, prev.bulan)}`}\n            rel="prev"\n            className={linkCls}\n          >\n            <span aria-hidden="true">← </span>Bulan sebelumnya\n          </a>\n        ) : (\n          <span aria-disabled="true" className={`${linkCls} opacity-50`}>\n            <span aria-hidden="true">← </span>Bulan sebelumnya\n          </span>\n        )}',
    },
    {
      file: "components/Kalender.tsx",
      find: '        <a\n          href={`/agenda?bulan=${kunciBulan(next.tahun, next.bulan)}`}\n          rel="next"\n          className={linkCls}\n        >\n          Bulan berikutnya<span aria-hidden="true"> →</span>\n        </a>',
      replace:
        '        {bulanTersedia(next.tahun, next.bulan) ? (\n          <a\n            href={`/agenda/bulan/${kunciBulan(next.tahun, next.bulan)}`}\n            rel="next"\n            className={linkCls}\n          >\n            Bulan berikutnya<span aria-hidden="true"> →</span>\n          </a>\n        ) : (\n          <span aria-disabled="true" className={`${linkCls} opacity-50`}>\n            Bulan berikutnya<span aria-hidden="true"> →</span>\n          </span>\n        )}',
    },
    // ---- Berita: ?jenis= & ?halaman= → /berita/jenis/<j>/ , /berita/halaman/<n>/ ----
    {
      file: "app/(publik)/berita/page.tsx",
      find: "type Props = { searchParams: Promise<{ jenis?: string | string[]; halaman?: string | string[] }> };",
      replace: "type Props = { jenis?: string; halaman?: string };",
    },
    {
      file: "app/(publik)/berita/page.tsx",
      find: 'function href(jenis: string | undefined, halaman: number) {\n  const q = new URLSearchParams();\n  if (jenis) q.set("jenis", jenis);\n  if (halaman > 1) q.set("halaman", String(halaman));\n  const s = q.toString();\n  return s ? `/berita?${s}` : "/berita";\n}',
      replace:
        'function href(jenis: string | undefined, halaman: number) {\n  return `/berita${jenis ? `/jenis/${jenis}` : ""}${halaman > 1 ? `/halaman/${halaman}` : ""}`;\n}',
    },
    {
      file: "app/(publik)/berita/page.tsx",
      find: "export default async function BeritaPage({ searchParams }: Props) {\n  const sp = await searchParams;\n  const kind = parseJenis(sp.jenis);",
      replace:
        "export async function BeritaIsi({ jenis: jenisParam, halaman: halamanParam }: Props) {\n  const kind = parseJenis(jenisParam);",
    },
    {
      file: "app/(publik)/berita/page.tsx",
      find: "halaman: parseHalaman(sp.halaman),",
      replace: "halaman: parseHalaman(halamanParam),",
    },
    {
      file: "app/(publik)/berita/page.tsx",
      find: 'href="/berita?jenis=berita"',
      replace: 'href="/berita/jenis/berita"',
    },
    {
      file: "app/(publik)/berita/page.tsx",
      find: 'href="/berita?jenis=pengumuman"',
      replace: 'href="/berita/jenis/pengumuman"',
    },
    {
      file: "app/(publik)/berita/page.tsx",
      find: "      </Section>\n    </main>\n  );\n}",
      replace:
        "      </Section>\n    </main>\n  );\n}\n\nexport default function BeritaPage() {\n  return BeritaIsi({});\n}",
    },
    // ---- Halaman detail: daftar parameter statis dari DB seed ----
    {
      file: "app/(publik)/berita/[slug]/page.tsx",
      find: 'import { beritaBySlug, beritaTerkait } from "../../../../lib/berita";',
      replace:
        'import { beritaBySlug, beritaTerkait, daftarBerita } from "../../../../lib/berita";',
    },
    {
      file: "app/(publik)/berita/[slug]/page.tsx",
      find: "type Props = { params: Promise<{ slug: string }> };",
      replace:
        "export const dynamicParams = false;\n\nexport async function generateStaticParams() {\n  const out: Array<{ slug: string }> = [];\n  for (let h = 1; ; h++) {\n    const r = await daftarBerita({ halaman: h });\n    out.push(...r.items.map((p) => ({ slug: p.slug })));\n    if (h >= r.jumlahHalaman) break;\n  }\n  return out;\n}\n\ntype Props = { params: Promise<{ slug: string }> };",
    },
    {
      file: "app/(publik)/galeri/[slug]/page.tsx",
      find: 'import { albumBySlug } from "../../../../lib/galeri";',
      replace: 'import { albumBySlug, daftarAlbum } from "../../../../lib/galeri";',
    },
    {
      file: "app/(publik)/galeri/[slug]/page.tsx",
      find: "type Props = { params: Promise<{ slug: string }> };",
      replace:
        "export const dynamicParams = false;\n\nexport async function generateStaticParams() {\n  return (await daftarAlbum()).map((a) => ({ slug: a.slug }));\n}\n\ntype Props = { params: Promise<{ slug: string }> };",
    },
    {
      file: "app/(publik)/donasi/[slug]/page.tsx",
      find: "  progresSemua,\n  programBySlug,",
      replace: "  progresSemua,\n  programAktif,\n  programBySlug,",
    },
    {
      file: "app/(publik)/donasi/[slug]/page.tsx",
      find: "type Props = { params: Promise<{ slug: string }> };",
      replace:
        "export const dynamicParams = false;\n\nexport async function generateStaticParams() {\n  return (await programAktif()).map((p) => ({ slug: p.slug }));\n}\n\ntype Props = { params: Promise<{ slug: string }> };",
    },
    // ---- Form dengan server action → simulasi ----
    {
      file: "app/(publik)/donasi/[slug]/page.tsx",
      find: 'import { kirimKonfirmasi } from "../actions";',
      replace:
        'import { FormKonfirmasiDemo } from "../../../../components/donasi/FormKonfirmasiDemo";',
    },
    {
      file: "app/(publik)/donasi/[slug]/page.tsx",
      find: "<FormKonfirmasi action={kirimKonfirmasi} slug={p.slug} minimal={donasi.minimal} />",
      replace: "<FormKonfirmasiDemo slug={p.slug} minimal={donasi.minimal} />",
    },
    {
      file: "app/(publik)/ppdb/daftar/page.tsx",
      find: 'import { daftarPpdb } from "../actions";',
      replace: 'import { FormPpdbDemo } from "../../../../components/ppdb/FormPpdbDemo";',
    },
    {
      file: "app/(publik)/ppdb/daftar/page.tsx",
      find: "<FormPpdb action={daftarPpdb} />",
      replace: "<FormPpdbDemo />",
    },
    {
      file: "app/(publik)/ppdb/status/page.tsx",
      find: 'import { cekStatusPpdb } from "../actions";',
      replace: 'import { FormStatusDemo } from "../../../../components/ppdb/FormStatusDemo";',
    },
    {
      file: "app/(publik)/ppdb/status/page.tsx",
      find: "<FormStatus action={cekStatusPpdb} />",
      replace: "<FormStatusDemo />",
    },
  ],
};

export default config;
