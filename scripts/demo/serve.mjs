// Server statis kecil yang MENIRU perilaku GitHub Pages untuk dist-demo/:
//   - disajikan di bawah sub-path (default /apps)
//   - /dir  → 301 ke /dir/ bila dir/index.html ada; /halaman → halaman.html bila ada
//   - tidak ditemukan → 404.html dengan status 404
//   - TIDAK ada eksekusi server-side, TIDAK ada header keamanan khusus (sama seperti Pages)
//
//   node scripts/demo/serve.mjs [port=4100]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const dist = join(root, "dist-demo");
const BASE_ROOT = ("/" + (process.env.DEMO_BASE_ROOT ?? "/apps").replace(/^\/+|\/+$/g, "")).replace(
  /^\/$/,
  "",
);
const port = Number(process.argv[2] ?? process.env.PORT ?? 4100);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};
const isFile = (p) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  const u = new URL(req.url ?? "/", "http://x");
  let path = decodeURIComponent(u.pathname);
  const send = (file, status = 200) => {
    res.writeHead(status, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(readFileSync(file));
  };
  const notFound = () => {
    const f = join(dist, "404.html");
    if (isFile(f)) return send(f, 404);
    res.writeHead(404).end("404");
  };

  if (BASE_ROOT && path === "/") {
    res.writeHead(302, { Location: `${BASE_ROOT}/` }).end();
    return;
  }
  if (BASE_ROOT) {
    if (path === BASE_ROOT) path += "/";
    if (!path.startsWith(`${BASE_ROOT}/`)) return notFound();
    path = path.slice(BASE_ROOT.length);
  }
  const abs = normalize(join(dist, path));
  if (!abs.startsWith(dist)) return notFound();

  if (path.endsWith("/")) {
    const idx = join(abs, "index.html");
    return isFile(idx) ? send(idx) : notFound();
  }
  if (isFile(abs)) return send(abs);
  if (isFile(join(abs, "index.html"))) {
    res.writeHead(301, { Location: `${BASE_ROOT}${path}/${u.search}` }).end();
    return;
  }
  if (isFile(`${abs}.html`)) return send(`${abs}.html`);
  return notFound();
}).listen(port, () => console.log(`[demo-serve] http://localhost:${port}${BASE_ROOT}/`));
