export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** epoch ms kapan jendela direset */
  resetAt: number;
  /** detik sampai boleh coba lagi (0 bila allowed) */
  retryAfterSec: number;
};

/** Antarmuka store — ganti dengan implementasi Redis (INCR + PEXPIRE) di produksi multi-instance. */
export interface RateLimitStore {
  /** Tambah hitungan untuk key di jendela; kembalikan hitungan & resetAt. */
  hit(key: string, windowMs: number, now: number): { count: number; resetAt: number };
}

/** Store in-memory fixed-window. Per-proses saja (tidak dibagi antar instance). */
export class MemoryRateLimitStore implements RateLimitStore {
  private entries = new Map<string, { count: number; resetAt: number }>();
  constructor(private maxKeys = 10_000) {}

  hit(key: string, windowMs: number, now: number) {
    const existing = this.entries.get(key);
    if (existing && existing.resetAt > now) {
      existing.count += 1;
      return { ...existing };
    }
    if (this.entries.size >= this.maxKeys) this.sweep(now);
    const entry = { count: 1, resetAt: now + windowMs };
    this.entries.set(key, entry);
    return { ...entry };
  }

  /** Buang entri kadaluarsa; bila masih penuh, buang yang tertua agar memori terbatas. */
  private sweep(now: number) {
    for (const [k, v] of this.entries) if (v.resetAt <= now) this.entries.delete(k);
    while (this.entries.size >= this.maxKeys) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }

  get size() {
    return this.entries.size;
  }
}

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  store?: RateLimitStore;
  now?: () => number;
};

export function createRateLimiter(opts: RateLimiterOptions) {
  const { limit, windowMs } = opts;
  const store = opts.store ?? new MemoryRateLimitStore();
  const clock = opts.now ?? Date.now;
  return {
    check(key: string): RateLimitResult {
      const now = clock();
      const { count, resetAt } = store.hit(key, windowMs, now);
      const allowed = count <= limit;
      return {
        allowed,
        limit,
        remaining: Math.max(0, limit - count),
        resetAt,
        retryAfterSec: allowed ? 0 : Math.max(1, Math.ceil((resetAt - now) / 1000)),
      };
    },
  };
}

/**
 * IP klien dari header proxy. `trustedProxies` = jumlah proxy tepercaya di depan app
 * (mis. 1 untuk satu reverse proxy). Entri X-Forwarded-For diambil dari KANAN, karena
 * entri paling kiri bisa dipalsukan klien. Bila tidak ada, kembalikan "unknown".
 */
export function getClientIp(
  headers: Headers | Record<string, string | undefined>,
  trustedProxies = 1,
): string {
  const get = (name: string) =>
    headers instanceof Headers ? (headers.get(name) ?? undefined) : headers[name];
  const xff = get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const ip = parts[Math.max(0, parts.length - trustedProxies)];
    if (ip) return ip;
  }
  return get("x-real-ip")?.trim() || "unknown";
}
