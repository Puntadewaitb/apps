export type SanitizeOptions = {
  maxLength?: number;
  /** Pertahankan baris baru (maks 2 berurutan). Default false → jadi satu baris. */
  multiline?: boolean;
};

/**
 * Sanitasi input TEKS BIASA: normalisasi NFC, buang karakter kontrol & zero-width,
 * buang tag HTML, rapikan spasi, potong ke maxLength.
 *
 * Ini BUKAN pengganti escaping saat output: React meng-escape otomatis; jangan pakai
 * dangerouslySetInnerHTML dengan hasil fungsi ini. Untuk konteks HTML mentah, pakai escapeHtml.
 */
export function sanitizeText(input: string, opts: SanitizeOptions = {}): string {
  let s = String(input).normalize("NFC");
  // karakter kontrol (kecuali \t \n), zero-width, bidi override
  s = s.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤﻿]/g, "");
  s = s.replace(/\r\n?/g, "\n");
  // buang tag/komentar HTML (ulangi sampai stabil agar "<<b>script>" tak lolos)
  let prev: string;
  do {
    prev = s;
    s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<\/?[a-zA-Z!?][^>]*>?/g, "");
  } while (s !== prev);
  s = s.replace(/[<>]/g, "");
  if (opts.multiline) {
    s = s
      .split("\n")
      .map((l) => l.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    s = s.replace(/\s+/g, " ");
  }
  s = s.trim();
  if (opts.maxLength !== undefined && s.length > opts.maxLength) {
    s = s.slice(0, opts.maxLength).trimEnd();
  }
  return s;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape untuk konteks HTML (mis. isi email HTML). */
export function escapeHtml(input: string): string {
  return String(input).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] as string);
}
