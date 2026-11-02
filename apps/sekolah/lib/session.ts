import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { buildAuthOptions } from "./auth";
import { can, type Area } from "./auth-core";
import { db } from "./db";

export type AdminUser = { id: number; name: string; email: string; role: string };

/**
 * Pengguna login yang SAH saat ini, atau null. Selain memeriksa JWT, akun dicek ulang ke DB:
 * akun yang sudah dihapus/diturunkan perannya langsung kehilangan akses (tidak menunggu JWT kedaluwarsa).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getServerSession(buildAuthOptions());
  const id = session?.user?.id;
  if (!id || !Number.isInteger(id)) return null;
  const u = await db().user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  return u && can(u.role, "ringkasan") ? u : null;
}

/** Untuk halaman/server action: redirect ke login bila belum login; 403-redirect bila peran tak berhak. */
export async function requireAdmin(area: Area = "ringkasan", from = "/admin"): Promise<AdminUser> {
  const u = await getAdminUser();
  if (!u) redirect(`/admin/login?callbackUrl=${encodeURIComponent(from)}`);
  if (!can(u.role, area)) redirect("/admin?akses=ditolak");
  return u;
}

/** Untuk route handler: kembalikan { user } atau { respons } (401/403) yang langsung dikirim. */
export async function apiAdmin(
  area: Area = "ringkasan",
): Promise<{ user: AdminUser; respons?: undefined } | { user?: undefined; respons: Response }> {
  const u = await getAdminUser();
  const h = { "Cache-Control": "no-store" };
  if (!u) return { respons: Response.json({ error: "Belum login." }, { status: 401, headers: h }) };
  if (!can(u.role, area))
    return { respons: Response.json({ error: "Tidak diizinkan." }, { status: 403, headers: h }) };
  return { user: u };
}
