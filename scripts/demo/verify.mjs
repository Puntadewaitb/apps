// Verifikasi statis hasil build sample (dist-demo/). Menemukan masalah yang baru terlihat setelah deploy:
//   - URL root-relatif TANPA base path (link/gambar rusak di sub-path GitHub Pages)
//   - tautan internal putus (file tujuan tidak ada)
//   - sisa referensi ke /admin atau /api (tidak ada server di GitHub Pages)
//   - halaman tanpa noindex / tanpa banner demo
//
//   node scripts/demo/verify.mjs [folder=dist-demo] [slug ...]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DEMO_APPS } from "../../demo/apps.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const BASE_ROOT = ("/" + (process.env.DEMO_BASE_ROOT ?? "/apps").replace(/^\/+|\/+$/g, "")).replace(
  /^\/$/,
  "",
);

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Apakah path (tanpa base root) ada di disk, dengan aturan penyajian GitHub Pages. */
function resolves(distRoot, urlPath) {
  const clean = decodeURIComponent(urlPath.split("#")[0].split("?")[0]);
  const rel = clean.replace(/^\/+/, "");
  const abs = join(distRoot, rel);
  if (clean.endsWith("/")) return existsSync(join(abs, "index.html"));
  if (existsSync(abs) && statSync(abs).isFile()) return true;
  return existsSync(join(abs, "index.html")) || existsSync(`${abs}.html`);
}

export function verify(distRoot, slugs) {
  const errors = [];
  const warn = [];
  const stats = {};
  for (const slug of slugs) {
    const dir = join(distRoot, slug);
    if (!existsSync(dir)) {
      errors.push(`${slug}: folder tidak ada`);
      continue;
    }
    const base = `${BASE_ROOT}/${slug}`;
    const files = walk(dir);
    const htmls = files.filter((f) => f.endsWith(".html"));
    let links = 0;
    for (const f of htmls) {
      const html = readFileSync(f, "utf8");
      const where = `${slug}/${relative(dir, f)}`;
      if (!/<meta name="robots" content="noindex,nofollow"/.test(html))
        errors.push(`${where}: tidak ada meta noindex`);
      if (!html.includes('id="demo-banner"')) errors.push(`${where}: tidak ada banner demo`);
      for (const m of html.matchAll(/\b(href|src|poster|action)="([^"]*)"/g)) {
        const [, attr, raw] = m;
        const v = raw.replaceAll("&amp;", "&");
        if (!v.startsWith("/") || v.startsWith("//")) continue; // absolut/anchor/relatif: bukan masalah base
        links++;
        if (v !== base && !v.startsWith(`${base}/`) && !v.startsWith(`${base}?`)) {
          errors.push(`${where}: ${attr}="${v}" tanpa base path ${base}`);
          continue;
        }
        if (/\/(admin|api)(\/|$|\?)/.test(v.slice(base.length)))
          errors.push(`${where}: ${attr}="${v}" menuju admin/API (tidak ada server)`);
        else if (!resolves(distRoot, v.slice(0, 0) + v.replace(BASE_ROOT, "")))
          errors.push(`${where}: ${attr}="${v}" tujuan tidak ada`);
      }
    }
    // Sisa pemanggilan API di JS klien
    for (const f of files.filter((p) => p.endsWith(".js"))) {
      const js = readFileSync(f, "utf8");
      const hit = js.match(/["'`]\/api\/[a-z][^"'`]{0,40}/);
      if (hit)
        errors.push(
          `${slug}/${relative(dir, f)}: JS memanggil ${hit[0].slice(1)} (tidak ada server)`,
        );
    }
    stats[slug] = { halaman: htmls.length, tautan: links };
  }
  return { errors, warn, stats };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = join(root, process.argv[2] ?? "dist-demo");
  const only = process.argv.slice(3);
  const slugs = only.length
    ? only
    : DEMO_APPS.map((a) => a.slug).filter((s) => existsSync(join(dist, s)));
  const { errors, stats } = verify(dist, slugs);
  for (const [s, v] of Object.entries(stats))
    console.log(`[verify] ${s}: ${v.halaman} halaman, ${v.tautan} URL root-relatif OK`);
  if (errors.length) {
    console.error(`\n[verify] ${errors.length} masalah:`);
    for (const e of errors.slice(0, 60)) console.error(" -", e);
    process.exit(1);
  }
  console.log("[verify] semua lolos");
}
