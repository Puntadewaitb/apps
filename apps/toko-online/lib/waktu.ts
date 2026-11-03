const WIB_MS = 7 * 3_600_000;
const HARI_MS = 86_400_000;

/** Awal hari ini menurut WIB (UTC+7, tanpa DST) sebagai instan UTC. */
export function awalHariWib(now: Date = new Date()): Date {
  return new Date(Math.floor((now.getTime() + WIB_MS) / HARI_MS) * HARI_MS - WIB_MS);
}

/** Awal bulan ini menurut WIB sebagai instan UTC. */
export function awalBulanWib(now: Date = new Date()): Date {
  const w = new Date(now.getTime() + WIB_MS);
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), 1) - WIB_MS);
}
