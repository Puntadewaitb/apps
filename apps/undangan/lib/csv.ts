/**
 * Escape satu sel CSV (RFC 4180) + netralkan CSV/formula injection:
 * sel yang diawali = + - @ TAB CR diberi awalan apostrof agar Excel/Sheets tidak mengeksekusinya.
 */
export function csvCell(value: unknown): string {
  let s = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(","));
  // BOM agar Excel membaca UTF-8 dengan benar
  return "﻿" + lines.join("\r\n") + "\r\n";
}
