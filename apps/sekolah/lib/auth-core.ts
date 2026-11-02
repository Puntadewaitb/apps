import { z } from "zod";
import type { Role } from "./domain";

/** Area dashboard dan peran yang boleh mengaksesnya. ADMIN: semua. EDITOR: hanya konten. */
export type Area =
  "ringkasan" | "berita" | "agenda" | "galeri" | "guru" | "ppdb" | "donasi" | "pengguna";

const EDITOR_AREAS: ReadonlySet<Area> = new Set([
  "ringkasan",
  "berita",
  "agenda",
  "galeri",
  "guru",
]);

export function can(role: Role | string | undefined, area: Area): boolean {
  if (role === "ADMIN") return true;
  if (role === "EDITOR") return EDITOR_AREAS.has(area);
  return false; // peran tak dikenal → tolak
}

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).max(200),
});

/**
 * Tujuan setelah login: hanya path internal di bawah /admin (cegah open redirect).
 * Menolak `//host`, `/\host`, skema (`https:`, `javascript:`), karakter kontrol, dan path di luar /admin.
 */
export function amanCallback(url: string | null | undefined): string {
  const DEFAULT = "/admin";
  if (!url) return DEFAULT;
  if (/[\u0000-\u001f\u007f\\]/.test(url)) return DEFAULT;
  if (!(url === "/admin" || url.startsWith("/admin/") || url.startsWith("/admin?"))) return DEFAULT;
  if (url.startsWith("//")) return DEFAULT;
  return url;
}

export type LoginGalat = "KREDENSIAL" | "RATE_LIMIT" | "NONAKTIF";
