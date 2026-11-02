import { describe, expect, it } from "vitest";
import {
  SESSION_MAX_AGE_SEC,
  createSessionToken,
  safeEqual,
  verifySessionToken,
} from "./admin-session";

const secret = "x".repeat(40);

describe("sesi admin", () => {
  it("token valid diterima", () => {
    const t = createSessionToken(secret, 1_000_000);
    expect(verifySessionToken(t, secret, 1_000_000 + 1000)).toBe(true);
  });
  it("kadaluarsa ditolak", () => {
    const t = createSessionToken(secret, 1_000_000);
    expect(verifySessionToken(t, secret, 1_000_000 + (SESSION_MAX_AGE_SEC + 1) * 1000)).toBe(false);
  });
  it("secret berbeda / dimodifikasi / format salah ditolak", () => {
    const t = createSessionToken(secret, 1_000_000);
    expect(verifySessionToken(t, "y".repeat(40), 1_000_001)).toBe(false);
    const [exp, nonce, mac] = t.split(".");
    const forged = `${Number(exp) + 99999}.${nonce}.${mac}`;
    expect(verifySessionToken(forged, secret, 1_000_001)).toBe(false);
    expect(verifySessionToken("abc", secret)).toBe(false);
    expect(verifySessionToken(undefined, secret)).toBe(false);
    expect(verifySessionToken("a.b.c.d", secret)).toBe(false);
  });
  it("safeEqual", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
