/**
 * Markdown aman (subset) → AST. TIDAK mendukung HTML mentah maupun MDX (kode yang dieksekusi),
 * sehingga isi artikel tidak pernah bisa menyuntikkan skrip. Dirender oleh `components/Markdown.tsx`
 * sebagai elemen React (otomatis ter-escape).
 *
 * Didukung: ## / ### judul (satu # dianggap ##, karena halaman sudah punya h1), paragraf, daftar bullet/bernomor,
 * kutipan (>), blok kode (```), garis (---), gambar lokal (/img/...), serta inline: **tebal**, *miring*, `kode`,
 * [tautan](url) — hanya https://, /path, #anchor, atau mailto:.
 */

export type Inline =
  | { t: "text"; text: string }
  | { t: "code"; text: string }
  | { t: "strong"; children: Inline[] }
  | { t: "em"; children: Inline[] }
  | { t: "link"; href: string; children: Inline[] };

export type Block =
  | { t: "heading"; level: 2 | 3; children: Inline[] }
  | { t: "p"; children: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "quote"; children: Inline[] }
  | { t: "code"; lang: string; text: string }
  | { t: "hr" }
  | { t: "img"; src: string; alt: string };

const MAX_INLINE_DEPTH = 6;

/** Href yang diizinkan; selain itu tautan dirender sebagai teks biasa. */
export function hrefAman(href: string): boolean {
  return /^(https:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*|#[\w-]+|mailto:[^\s"'<>]+)$/.test(href);
}

export function parseInline(src: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ t: "text", text: buf });
    buf = "";
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (ch === "\\" && i + 1 < src.length) {
      buf += src[i + 1];
      i += 2;
      continue;
    }
    if (ch === "`") {
      const j = src.indexOf("`", i + 1);
      if (j > i + 1) {
        flush();
        out.push({ t: "code", text: src.slice(i + 1, j) });
        i = j + 1;
        continue;
      }
    }
    if (depth < MAX_INLINE_DEPTH && src.startsWith("**", i)) {
      const j = src.indexOf("**", i + 2);
      if (j > i + 2) {
        flush();
        out.push({ t: "strong", children: parseInline(src.slice(i + 2, j), depth + 1) });
        i = j + 2;
        continue;
      }
    }
    if (depth < MAX_INLINE_DEPTH && ch === "*") {
      const j = src.indexOf("*", i + 1);
      if (j > i + 1 && src[j + 1] !== "*") {
        flush();
        out.push({ t: "em", children: parseInline(src.slice(i + 1, j), depth + 1) });
        i = j + 1;
        continue;
      }
    }
    if (ch === "[") {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(src.slice(i));
      if (m) {
        flush();
        const children = parseInline(m[1]!, depth + 1);
        if (hrefAman(m[2]!)) out.push({ t: "link", href: m[2]!, children });
        else out.push(...children); // href berbahaya → hanya teksnya
        i += m[0].length;
        continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

const IMG_RE = /^!\[([^\]]*)\]\((\/img\/[\w./-]+)\)$/;

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const kosong = (l: string | undefined) => l === undefined || l.trim() === "";

  while (i < lines.length) {
    const line = lines[i]!;
    if (kosong(line)) {
      i++;
      continue;
    }

    // blok kode berpagar
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const isi: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i]!)) isi.push(lines[i++]!);
      i++; // penutup
      blocks.push({ t: "code", lang: fence[1] ?? "", text: isi.join("\n") });
      continue;
    }

    const h = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) {
      blocks.push({ t: "heading", level: h[1]!.length >= 3 ? 3 : 2, children: parseInline(h[2]!) });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }

    const img = IMG_RE.exec(line.trim());
    if (img && !img[2]!.includes("..")) {
      blocks.push({ t: "img", alt: img[1]!, src: img[2]! });
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const isi: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]!))
        isi.push(lines[i++]!.replace(/^>\s?/, ""));
      blocks.push({ t: "quote", children: parseInline(isi.join(" ").trim()) });
      continue;
    }

    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      const tipe = ul ? "ul" : "ol";
      const re = ul ? /^\s*[-*]\s+(.*)$/ : /^\s*\d+[.)]\s+(.*)$/;
      const items: Inline[][] = [];
      while (i < lines.length && re.test(lines[i]!)) {
        items.push(parseInline(re.exec(lines[i]!)![1]!));
        i++;
      }
      blocks.push({ t: tipe, items });
      continue;
    }

    // paragraf: gabungkan baris berurutan sampai baris kosong / awal blok lain
    const para: string[] = [];
    while (
      i < lines.length &&
      !kosong(lines[i]) &&
      !/^(```|#{1,3}\s|>|\s*[-*]\s|\s*\d+[.)]\s|-{3,}\s*$)/.test(lines[i]!) &&
      !(IMG_RE.test(lines[i]!.trim()) && !lines[i]!.includes(".."))
    ) {
      para.push(lines[i++]!.trim());
    }
    if (para.length === 0) {
      // jaga agar tidak loop tak hingga pada baris aneh
      para.push(lines[i++]!.trim());
    }
    blocks.push({ t: "p", children: parseInline(para.join(" ")) });
  }
  return blocks;
}

/** Teks polos dari markdown (untuk menghitung kata / ringkasan). */
export function teksPolos(src: string): string {
  const keInline = (n: Inline[]): string =>
    n.map((x) => (x.t === "text" || x.t === "code" ? x.text : keInline(x.children))).join("");
  return parseMarkdown(src)
    .map((b) => {
      switch (b.t) {
        case "heading":
        case "p":
        case "quote":
          return keInline(b.children);
        case "ul":
        case "ol":
          return b.items.map(keInline).join(" ");
        case "code":
          return b.text;
        case "img":
          return b.alt;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(" ");
}
