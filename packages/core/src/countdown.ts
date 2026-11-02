export type Remaining = { days: number; hours: number; minutes: number; seconds: number };

/** Sisa waktu dari `now` ke `endsAt` (epoch ms). Mengembalikan null bila sudah lewat / tidak valid. */
export function remaining(endsAt: number, now: number): Remaining | null {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return null;
  const diff = endsAt - now;
  if (diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export const pad = (n: number) => String(n).padStart(2, "0");
