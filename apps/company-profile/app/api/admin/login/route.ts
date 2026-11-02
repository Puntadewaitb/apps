import { getClientIp } from "@tpl/core";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  createSessionToken,
  safeEqual,
} from "../../../../lib/admin-session";
import { adminConfig } from "../../../../lib/env";
import { limiters } from "../../../../lib/limiters";
import { isSameOrigin } from "../../../../lib/request";

function redirect(to: string, headers: Record<string, string> = {}) {
  return new Response(null, {
    status: 303,
    headers: { Location: to, "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new Response("Permintaan ditolak.", { status: 403 });

  const cfg = adminConfig();
  if (!cfg) return redirect("/admin/login?error=nonaktif");

  const ip = getClientIp(req.headers, Number(process.env.TRUSTED_PROXIES ?? 1));
  if (!limiters().login.check(ip).allowed) return redirect("/admin/login?error=terlalu-banyak");

  const form = await req.formData().catch(() => null);
  const password = form?.get("password");
  if (typeof password !== "string" || !safeEqual(password, cfg.password)) {
    return redirect("/admin/login?error=salah");
  }

  const https =
    new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  const cookie = [
    `${SESSION_COOKIE}=${createSessionToken(cfg.secret)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
    https ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  return redirect("/admin/pesan", { "Set-Cookie": cookie });
}
