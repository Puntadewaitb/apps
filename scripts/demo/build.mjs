// Build "sample statis" tiap template untuk GitHub Pages (tanpa server/DB/admin).
//
//   node scripts/demo/build.mjs <landing-page|company-profile|undangan|sekolah|toko-online|all>
//
// Prinsip: kode app asli TIDAK diubah. Skrip menyalin app ke .demo/<app>, membuang bagian server
// (admin, API, proxy, upload), menimpa bagian dinamis dengan overlay dari demo/<app>/overlay,
// membungkus tautan/gambar dengan withBase (codemod), lalu `next build` dengan output "export".
// Hasil akhir: dist-demo/<app>/ (+ dist-demo/index.html sebagai galeri).
//
// Env: DEMO_ORIGIN (default https://puntadewaitb.github.io), DEMO_BASE_ROOT (default /apps),
//      DEMO_CONTACT_URL (opsional; tautan "Pesan versi lengkap" di banner).
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DEMO_APPS } from "../../demo/apps.mjs";
import { wrapUrlAttributes } from "./codemod.mjs";
import { postProcessHtml } from "./postprocess.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const ORIGIN = (process.env.DEMO_ORIGIN || "https://puntadewaitb.github.io").replace(/\/+$/, "");
const BASE_ROOT = ("/" + (process.env.DEMO_BASE_ROOT ?? "/apps").replace(/^\/+|\/+$/g, "")).replace(
  /^\/$/,
  "",
);
const CONTACT = process.env.DEMO_CONTACT_URL || "";
// Satu waktu acuan untuk semua template (data seed & jendela bulan relatif terhadap ini).
const BUILD_TIME = process.env.DEMO_BUILD_TIME || new Date().toISOString();

/** Dibuang dari salinan untuk SEMUA app (bagian server/test/dokumentasi). */
const GENERIC_REMOVE = [
  "app/admin",
  "app/api",
  "app/(admin)",
  "components/admin",
  "app/uploads",
  "app/robots.ts", // sample tidak boleh terindeks (noindex ditambahkan di pasca-proses)
  "app/sitemap.ts",
  "app/opengraph-image.tsx", // diekspor tanpa ekstensi → Content-Type salah di GitHub Pages
  "app/twitter-image.tsx",
  "proxy.ts",
  "middleware.ts",
  "prisma",
  "prisma.config.ts",
  "e2e",
  "docs",
  "README.md",
  "playwright.config.mjs",
  "vitest.config.mjs",
  "next-env.d.ts",
  ".env",
  ".env.example",
  "eslint.config.mjs",
  "generated",
  "uploads",
  "e2e-uploads",
  "test-results",
  "playwright-report",
];
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "coverage"]);
const isTest = (p) => /\.(test|spec)\.(ts|tsx|mjs)$/.test(p);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, out);
    } else out.push(p);
  }
  return out;
}

function run(cmd, args, opts) {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) throw new Error(`Perintah gagal (${r.status}): ${cmd} ${args.join(" ")}`);
}

export async function buildDemo(slug) {
  const meta = DEMO_APPS.find((a) => a.slug === slug);
  if (!meta) throw new Error(`Template tidak dikenal: ${slug}`);
  const src = join(root, "apps", slug);
  const dst = join(root, ".demo", slug);
  const cfgFile = join(root, "demo", slug, "config.mjs");
  const cfg = existsSync(cfgFile) ? (await import(pathToFileURL(cfgFile).href)).default : {};
  const base = `${BASE_ROOT}/${slug}`;

  console.log(`\n=== [demo] ${slug} → ${ORIGIN}${base}/`);

  // 1) Salin (tanpa node_modules/.next/test) ke .demo/<slug>
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, {
    recursive: true,
    filter: (p) => {
      const rel = relative(src, p);
      if (!rel) return true;
      if (rel.split("/").some((s) => SKIP_DIRS.has(s))) return false;
      if (/\.db(-journal)?$/.test(rel)) return false;
      return !isTest(rel);
    },
  });

  // 2) Buang bagian server (umum + khusus app)
  const keep = new Set(cfg.keep ?? []);
  for (const rel of [...GENERIC_REMOVE.filter((r) => !keep.has(r)), ...(cfg.remove ?? [])])
    rmSync(join(dst, rel), { recursive: true, force: true });
  // `generated/` (klien Prisma) selalu dibuat ulang oleh `prisma generate`, bukan disalin dari disk.
  rmSync(join(dst, "generated"), { recursive: true, force: true });

  // 3) Overlay (menimpa/menambah file)
  const overlay = join(root, "demo", slug, "overlay");
  if (existsSync(overlay)) cpSync(overlay, dst, { recursive: true });

  // 3a) Patch string persis pada file hasil salinan. GAGAL KERAS bila kode asli berubah (find tidak ditemukan /
  //     ambigu) — supaya divergensi antara app asli dan sample terdeteksi, bukan diam-diam rusak.
  for (const pt of cfg.patches ?? []) {
    const f = join(dst, pt.file);
    if (!existsSync(f)) throw new Error(`${slug}: patch gagal — file tidak ada: ${pt.file}`);
    const code = readFileSync(f, "utf8");
    const n = code.split(pt.find).length - 1;
    if (n === 0)
      throw new Error(`${slug}: patch gagal — teks tidak ditemukan di ${pt.file}:\n${pt.find}`);
    if (n > 1 && !pt.all)
      throw new Error(`${slug}: patch ambigu — ${n} kecocokan di ${pt.file}:\n${pt.find}`);
    writeFileSync(f, code.split(pt.find).join(pt.replace));
  }

  // 3b) Banner demo dirender React (BUKAN HTML tempelan → akan memicu hydration mismatch #418).
  mkdirSync(join(dst, "components"), { recursive: true });
  cpSync(join(root, "demo/shared/DemoBanner.tsx"), join(dst, "components/DemoBanner.tsx"));
  const layouts = walk(join(dst, "app")).filter(
    (p) => /layout\.tsx$/.test(p) && /<body\b/.test(readFileSync(p, "utf8")),
  );
  if (layouts.length === 0)
    throw new Error(`${slug}: tidak ada layout dengan <body> untuk banner demo`);
  for (const f of layouts) {
    let code = readFileSync(f, "utf8");
    code = code.replace(/<body\b[^>]*>/, (m) => `${m}<DemoBanner />`);
    const rel = relative(dirname(f), join(dst, "components/DemoBanner")).replace(/\\/g, "/");
    const spec = rel.startsWith(".") ? rel : `./${rel}`;
    code = code.replace(
      /^((?:(?:"use [a-z]+";|'use [a-z]+';)\s*)?)/,
      `$1import { DemoBanner } from "${spec}";\n`,
    );
    writeFileSync(f, code);
  }

  // 3c) Metadata robots eksplisit "index: true" → noindex (Next merender ulang meta ini saat hydration,
  //     sehingga tambalan HTML saja tidak cukup).
  for (const f of walk(join(dst, "app")).filter((p) => /\.tsx?$/.test(p))) {
    const code = readFileSync(f, "utf8");
    // force-dynamic tidak didukung `output: "export"`; halaman dirender statis dari data seed saat build.
    const baru = code
      .replace(/(robots:\s*\{[^}]*?\bindex:\s*)true/g, "$1false")
      .replace(/^export const dynamic = ["']force-dynamic["'];?\s*$/gm, "");
    if (baru !== code) writeFileSync(f, baru);
  }

  // 4) Codemod: withBase pada <a href>/<img src>/...
  let wrapped = 0;
  for (const dir of ["app", "components"]) {
    const d = join(dst, dir);
    if (!existsSync(d)) continue;
    for (const f of walk(d).filter((p) => p.endsWith(".tsx"))) {
      const r = wrapUrlAttributes(readFileSync(f, "utf8"), f);
      if (r.wrapped) {
        writeFileSync(f, r.code);
        wrapped += r.wrapped;
      }
    }
  }
  console.log(`[demo] codemod: ${wrapped} atribut URL dibungkus withBase`);

  // 5) Config & package minimal untuk build statis
  writeFileSync(
    join(dst, "package.json"),
    JSON.stringify({ name: `@tpl-demo/${slug}`, private: true }, null, 2) + "\n",
  );
  writeFileSync(
    join(dst, "next.config.ts"),
    `import type { NextConfig } from "next";

// DIHASILKAN oleh scripts/demo/build.mjs — jangan diedit.
const nextConfig: NextConfig = {
  output: "export",
  basePath: ${JSON.stringify(base)},
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@tpl/ui", "@tpl/core"],
  poweredByHeader: false,
};

export default nextConfig;
`,
  );

  // 6) next build (export statis)
  const env = {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_BASE_PATH: base,
    NEXT_PUBLIC_SITE_URL: `${ORIGIN}${base}`,
    NEXT_PUBLIC_DEMO: "1",
    DEMO_BUILD_TIME: BUILD_TIME,
    ...(CONTACT ? { NEXT_PUBLIC_DEMO_CONTACT_URL: CONTACT } : {}),
    ...(cfg.env ?? {}),
  };
  if (cfg.db) {
    // Halaman dirender dari data SEED saat build: DB sementara (tidak ikut ke hasil akhir) → prisma generate,
    // migrate deploy, seed. Kredensial seed di bawah hanya untuk DB sekali pakai ini (bukan rahasia).
    const prismaBin = join(root, "node_modules/prisma/build/index.js");
    env.DATABASE_URL = `file:${join(dst, "demo.db")}`;
    const dbEnv = { ...env, ...(cfg.seedEnv ?? {}) };
    run("node", [prismaBin, "generate"], { cwd: dst, env: dbEnv });
    run("node", [prismaBin, "migrate", "deploy"], { cwd: dst, env: dbEnv });
    if (cfg.seed) run("node", [...(cfg.seedFlags ?? []), cfg.seed], { cwd: dst, env: dbEnv });
  }
  if (cfg.prepare) await cfg.prepare({ dst, env, run, root });
  run("node", [join(root, "node_modules/next/dist/bin/next"), "build"], { cwd: dst, env });

  // 7) Pasca-proses HTML (noindex + banner) lalu pindahkan ke dist-demo/<slug>
  const out = join(dst, "out");
  if (!existsSync(out)) throw new Error(`${slug}: folder out/ tidak terbentuk (export gagal?)`);
  // 404/_not-found per-template tidak pernah disajikan (GitHub Pages memakai SATU 404.html di akar situs).
  for (const junk of ["robots.txt", "sitemap.xml", "404.html", "404", "_not-found"])
    rmSync(join(out, junk), { recursive: true, force: true });
  let pages = 0;
  for (const f of walk(out).filter((p) => p.endsWith(".html"))) {
    writeFileSync(f, postProcessHtml(readFileSync(f, "utf8")));
    pages++;
  }
  const dist = join(root, "dist-demo", slug);
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dirname(dist), { recursive: true });
  cpSync(out, dist, { recursive: true });
  console.log(`[demo] ${slug}: ${pages} halaman HTML → dist-demo/${slug}/`);
  return { slug, pages };
}

function galeri() {
  const esc = (s) =>
    s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const kartu = DEMO_APPS.filter((a) => existsSync(join(root, "dist-demo", a.slug)))
    .map(
      (a) =>
        `<li><a class="card" href="./${a.slug}/"><h2>${esc(a.nama)}</h2><p>${esc(a.deskripsi)}</p><p class="note">${esc(a.demo)}</p><span class="go">Buka contoh →</span></a></li>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contoh Template Website</title>
<meta name="description" content="Contoh tampilan 5 template website. Versi demo statis; versi lengkap dikembangkan setelah pemesanan.">
<meta name="robots" content="noindex,nofollow">
<style>
:root{--bg:#fff;--fg:#111827;--muted:#4b5563;--card:#f3f4f6;--line:#d1d5db;--pri:#1d4ed8}
@media (prefers-color-scheme:dark){:root{--bg:#0b1220;--fg:#f3f4f6;--muted:#cbd5e1;--card:#111a2e;--line:#334155;--pri:#93c5fd}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,sans-serif}
main{max-width:960px;margin:0 auto;padding:32px 16px 64px}h1{font-size:1.75rem;margin:0 0 8px}
.lead{color:var(--muted);margin:0 0 24px}ul{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.card{display:flex;flex-direction:column;gap:8px;height:100%;padding:20px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:inherit;text-decoration:none}
.card:hover,.card:focus-visible{border-color:var(--pri);outline:2px solid var(--pri);outline-offset:2px}
.card h2{margin:0;font-size:1.15rem}.card p{margin:0}.note{color:var(--muted);font-size:.875rem}.go{margin-top:auto;color:var(--pri);font-weight:600}
footer{margin-top:32px;color:var(--muted);font-size:.875rem}
</style></head><body><main>
<h1>Contoh Template Website</h1>
<p class="lead">Lima template siap pakai. Halaman di bawah adalah <strong>versi demo statis</strong> untuk dilihat-lihat: tampilan dan alur sama dengan versi lengkap, tetapi data tidak disimpan di server dan panel admin tidak disertakan.</p>
<ul>
${kartu}
</ul>
<footer>Tertarik? Versi lengkap (database, panel admin, dan integrasi) dikembangkan setelah pemesanan.${CONTACT ? ` <a href="${esc(CONTACT)}">Hubungi kami</a>.` : ""}</footer>
</main></body></html>
`;
  writeFileSync(join(root, "dist-demo", "index.html"), html);
  writeFileSync(join(root, "dist-demo", ".nojekyll"), "");
  writeFileSync(
    join(root, "dist-demo", "404.html"),
    html.replace(
      "<title>Contoh Template Website</title>",
      "<title>Halaman tidak ditemukan</title>",
    ),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Pemakaian: node scripts/demo/build.mjs <template|all>");
    process.exit(2);
  }
  const targets = arg === "all" ? DEMO_APPS.map((a) => a.slug) : [arg];
  mkdirSync(join(root, "dist-demo"), { recursive: true });
  const t0 = Date.now();
  for (const s of targets) await buildDemo(s);
  galeri();
  console.log(`\n[demo] selesai dalam ${Math.round((Date.now() - t0) / 1000)} dtk → dist-demo/`);
}
