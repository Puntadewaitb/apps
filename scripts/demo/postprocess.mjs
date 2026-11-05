// Pasca-proses HTML hasil export: sample tidak boleh terindeks mesin pencari (konten duplikat) → meta noindex
// di <head>. Banner demo TIDAK ditambahkan di sini: HTML tempelan di <body> membuat hydration mismatch
// (React error #418); banner dirender React lewat DemoBanner (lihat build.mjs).

export function postProcessHtml(html) {
  // Hapus meta robots lama lalu tambahkan noindex di <head> (aman: <head> dikelola React 19 dengan toleransi).
  let out = html.replace(/<meta\s+name="robots"[^>]*>/gi, "");
  out = out.replace(/<\/head>/i, '<meta name="robots" content="noindex,nofollow"/></head>');
  return out;
}
