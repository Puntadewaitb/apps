/** Input <input type="datetime-local"> ("YYYY-MM-DDTHH:mm") selalu dibaca/ditulis sebagai WIB (UTC+7). */
const RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function parseWaktuWib(v: string): Date | null {
  const m = RE.exec(v.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const date = new Date(Date.UTC(y, mo - 1, d, h - 7, mi));
  // tolak tanggal yang "meluap" (mis. 31 Februari)
  const cek = new Date(date.getTime() + 7 * 3_600_000);
  if (cek.getUTCMonth() !== mo - 1 || cek.getUTCDate() !== d) return null;
  return date;
}

export function formatWaktuWib(d: Date | null | undefined): string {
  if (!d) return "";
  const w = new Date(d.getTime() + 7 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCFullYear()}-${p(w.getUTCMonth() + 1)}-${p(w.getUTCDate())}T${p(w.getUTCHours())}:${p(w.getUTCMinutes())}`;
}
