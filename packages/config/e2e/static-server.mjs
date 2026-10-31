// Server statis minimal untuk smoke test config Playwright (tanpa jaringan luar).
import { createServer } from "node:http";

const port = Number(process.env.PORT || 3999);
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Smoke</title></head>
<body><h1>Uji asap Playwright</h1><a id="wa" href="https://wa.me/6281234567890">WA</a></body></html>`;

createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(port, "127.0.0.1", () => console.log(`smoke server :${port}`));
