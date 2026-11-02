const ZONA = "Asia/Jakarta";

const tanggal = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: ZONA,
});

const jam = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ZONA,
});

/** "Sabtu, 20 Februari 2027" (zona WIB). */
export function formatTanggal(d: Date): string {
  return tanggal.format(d);
}

/** "08.00 WIB". */
export function formatJam(d: Date): string {
  return `${jam.format(d).replace(":", ".")} WIB`;
}
