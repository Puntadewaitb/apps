/** Format tanggal/jam Bahasa Indonesia, selalu zona WIB (Asia/Jakarta) agar sama di server mana pun. */
const TZ = "Asia/Jakarta";

const tgl = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});
const tglPendek = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: TZ,
});
const hariTgl = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});
const jam = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TZ,
});
const bulanTahun = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: TZ,
});
const isoHari = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TZ,
});

export const formatTanggal = (d: Date) => tgl.format(d);
export const formatTanggalPendek = (d: Date) => tglPendek.format(d);
export const formatHariTanggal = (d: Date) => hariTgl.format(d);
/** "08.00" (titik, bukan titik dua — gaya Indonesia). */
export const formatJam = (d: Date) => jam.format(d).replace(":", ".");
export const formatBulanTahun = (d: Date) => bulanTahun.format(d);
/** Tanggal kalender WIB sebagai "YYYY-MM-DD". */
export const hariWib = (d: Date) => isoHari.format(d);

export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
