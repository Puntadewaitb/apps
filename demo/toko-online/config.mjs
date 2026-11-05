// Sample statis toko-online. Katalog/produk/pengaturan dirender dari data SEED saat build (DB sementara). Yang butuh
// server diganti "backend" simulasi di peramban (lib/demo-toko.ts) yang memakai modul bisnis ASLI bebas-DB:
//   /api/keranjang, /api/checkout/ringkasan, /api/pesanan, /api/lacak, /api/lacak/bukti
//  - /produk (q, kategori, urut, halaman) → dihitung di peramban dari data seed (components/KatalogKlien.tsx)
//  - /lacak?kode= → dibaca di peramban
//  - admin, auth, unggahan → tidak disertakan
// Catatan: stok & kuota voucher TIDAK berkurang pada demo (halaman produk statis); pesanan hanya di localStorage.
const config = {
  db: true,
  seed: "prisma/seed.ts",
  seedFlags: ["--env-file-if-exists=.env"],
  // Kredensial di bawah hanya untuk DB sekali pakai saat build (tidak dipublikasikan, bukan rahasia).
  seedEnv: {
    ADMIN_EMAIL: "admin@demo.invalid",
    ADMIN_PASSWORD: "demo-build-only-not-a-secret-1",
    STAFF_PASSWORD: "demo-build-only-not-a-secret-2",
  },
  keep: ["prisma", "prisma.config.ts"],
  remove: [
    "lib/api-guard.ts",
    "lib/auth.ts",
    "lib/auth-core.ts",
    "lib/session.ts",
    "lib/login.ts",
    "lib/limiters.ts",
    "lib/idempotensi.ts",
    "lib/csv.ts",
    "lib/ringkasan.ts",
    "lib/upload.ts",
    "lib/bukti.ts",
    "lib/keranjang-server.ts",
    "lib/lacak-server.ts",
  ],
  // Bagian MURNI (tanpa DB) dari modul yang bercampur dengan Prisma — diekstrak otomatis dari kode asli.
  derive: [
    {
      from: "lib/katalog.ts",
      to: "lib/katalog-murni.ts",
      dropImports: ["react", "./db"],
      names: [
        "PER_HALAMAN",
        "URUTAN",
        "Urutan",
        "LABEL_URUTAN",
        "parseUrut",
        "parseHalaman",
        "parseSlug",
        "parseQ",
        "VarianLite",
        "aktif",
        "ProdukLite",
        "hargaMulai",
        "hargaBervariasi",
        "stokTotal",
        "habis",
        "ItemUrut",
        "urutkan",
        "paginasi",
        "cocokKata",
        "galeriProduk",
        "urlKatalog",
        "daftarHalaman",
      ],
    },
    {
      from: "lib/setting.ts",
      to: "lib/setting-murni.ts",
      dropImports: ["react", "./db"],
      names: [
        "Rekening",
        "Ongkir",
        "PengaturanToko",
        "BAWAAN",
        "pathGambar",
        "str",
        "parseRekening",
        "parseOngkir",
        "dariBaris",
      ],
    },
  ],
  patches: [
    // Komponen yang dipakai di dalam komponen KLIEN tidak boleh membawa Prisma → impor versi murni.
    {
      file: "components/KartuProduk.tsx",
      find: 'from "../lib/katalog";',
      replace: 'from "../lib/katalog-murni";',
    },
    {
      file: "components/Paginasi.tsx",
      find: 'from "../lib/katalog";',
      replace: 'from "../lib/katalog-murni";',
    },
    {
      file: "components/FilterProduk.tsx",
      find: 'from "../lib/katalog";',
      replace: 'from "../lib/katalog-murni";',
    },
    // Form pencarian GET: langsung ke URL berakhiran slash (hosting statis).
    {
      file: "components/FilterProduk.tsx",
      find: 'action="/produk"',
      replace: 'action="/produk/"',
    },
    // fetch ke API → "backend" simulasi di peramban.
    {
      file: "lib/keranjang-store.ts",
      find: 'import { useEffect, useState, useSyncExternalStore } from "react";',
      replace:
        'import { useEffect, useState, useSyncExternalStore } from "react";\nimport { demoFetch } from "./demo-toko";',
    },
    {
      file: "components/CheckoutForm.tsx",
      find: 'import { Button, ButtonLink, FormField } from "@tpl/ui";',
      replace:
        'import { Button, ButtonLink, FormField } from "@tpl/ui";\nimport { demoFetch } from "../lib/demo-toko";',
    },
    {
      file: "components/FormLacak.tsx",
      find: 'import { Button, FormField } from "@tpl/ui";',
      replace:
        'import { Button, FormField } from "@tpl/ui";\nimport { demoFetch } from "../lib/demo-toko";',
    },
    {
      file: "lib/keranjang-store.ts",
      find: 'fetch("/api/keranjang"',
      replace: 'demoFetch("/api/keranjang"',
    },
    {
      file: "components/CheckoutForm.tsx",
      find: 'fetch("/api/checkout/ringkasan"',
      replace: 'demoFetch("/api/checkout/ringkasan"',
    },
    {
      file: "components/CheckoutForm.tsx",
      find: 'await fetch("/api/pesanan"',
      replace: 'await demoFetch("/api/pesanan"',
    },
    {
      file: "components/FormLacak.tsx",
      find: 'await fetch("/api/lacak", {',
      replace: 'await demoFetch("/api/lacak", {',
    },
    {
      file: "components/FormLacak.tsx",
      find: 'await fetch("/api/lacak/bukti", {',
      replace: 'await demoFetch("/api/lacak/bukti", {',
    },
    // Detail produk: daftar slug statis dari DB seed.
    {
      file: "app/(toko)/produk/[slug]/page.tsx",
      find: "import {\n  galeriProduk,",
      replace: "import {\n  cariProduk,\n  galeriProduk,",
    },
    {
      file: "app/(toko)/produk/[slug]/page.tsx",
      find: "type Props = { params: Promise<{ slug: string }> };",
      replace:
        'export const dynamicParams = false;\n\nexport async function generateStaticParams() {\n  const out: Array<{ slug: string }> = [];\n  for (let h = 1; ; h++) {\n    const r = await cariProduk({ urut: "terbaru", halaman: h });\n    out.push(...r.items.map((p) => ({ slug: p.slug })));\n    if (h >= r.jumlahHalaman) break;\n  }\n  return out;\n}\n\ntype Props = { params: Promise<{ slug: string }> };',
    },
  ],
  // Setelah seed: ekspor data ke lib/demo-data.json (dipakai lib/demo-toko.ts & KatalogKlien).
  async prepare({ dst, env, run }) {
    run("node", ["prisma/export-demo.ts"], { cwd: dst, env });
  },
};

export default config;
