import { createHmac, randomBytes, timingSafeEqual, createHash } from "node:crypto";

// Nama berbeda dari app lain: cookie dibagi lintas port di localhost.
export const SESSION_COOKIE = "company_admin";
export const SESSION_MAX_AGE_SEC = 8 * 60 * 60;

const b64u = (b: Buffer) => b.toString("base64url");

function sign(payload: string, secret: string): string {
  return b64u(createHmac("sha256", secret).update(payload).digest());
}

/** Bandingkan string secara constant-time (hash dulu agar panjang sama). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Token sesi: `<exp>.<nonce>.<hmac>`; exp dalam epoch detik. */
export function createSessionToken(secret: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE_SEC;
  const payload = `${exp}.${b64u(randomBytes(12))}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, mac] = parts as [string, string, string];
  if (!safeEqual(mac, sign(`${exp}.${nonce}`, secret))) return false;
  const expSec = Number(exp);
  return Number.isInteger(expSec) && expSec * 1000 > now;
}
