import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./admin-session";
import { adminConfig } from "./env";

/** true bila request membawa cookie sesi admin yang valid. */
export async function isAdmin(): Promise<boolean> {
  const cfg = adminConfig();
  if (!cfg) return false;
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, cfg.secret);
}

/** Untuk halaman & server action admin: arahkan ke login bila belum masuk. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
