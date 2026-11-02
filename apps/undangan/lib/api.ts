import { HONEYPOT_FIELD, getClientIp, isHoneypotTripped } from "@tpl/core";
import type { createRateLimiter } from "@tpl/core";
import { isSameOrigin } from "./request";

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export const MAX_BODY_BYTES = 5_000;

type Guard =
  | { ok: true; data: Record<string, unknown>; ip: string; bot: boolean }
  | { ok: false; res: Response };

/**
 * Pemeriksaan umum untuk endpoint POST publik: Origin, rate limit per IP, content-type JSON,
 * ukuran body, JSON valid berbentuk objek, dan honeypot (bot → `bot: true`, jangan diproses).
 */
export async function guardPost(
  req: Request,
  limiter: ReturnType<typeof createRateLimiter>,
): Promise<Guard> {
  if (!isSameOrigin(req))
    return { ok: false, res: json({ ok: false, error: "Permintaan ditolak." }, 403) };

  const ip = getClientIp(req.headers, Number(process.env.TRUSTED_PROXIES ?? 1));
  const rl = limiter.check(ip);
  if (!rl.allowed) {
    return {
      ok: false,
      res: json(
        { ok: false, error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
        429,
        {
          "Retry-After": String(rl.retryAfterSec),
        },
      ),
    };
  }

  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, res: json({ ok: false, error: "Format permintaan tidak didukung." }, 415) };
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES)
    return { ok: false, res: json({ ok: false, error: "Data terlalu besar." }, 413) };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, res: json({ ok: false, error: "Data tidak valid." }, 400) };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, res: json({ ok: false, error: "Data tidak valid." }, 400) };
  }
  const obj = data as Record<string, unknown>;
  return { ok: true, data: obj, ip, bot: isHoneypotTripped(obj, HONEYPOT_FIELD) };
}

/** { field: pesanPertama } dari ZodError. */
export function fieldErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}
