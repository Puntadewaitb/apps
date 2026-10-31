import { describe, expect, it } from "vitest";
import {
  HONEYPOT_FIELD,
  MemoryRateLimitStore,
  buildCsp,
  createRateLimiter,
  detectType,
  emailSchema,
  escapeHtml,
  getClientIp,
  isHoneypotTripped,
  isSubmittedTooFast,
  messageSchema,
  nameSchema,
  nextSecurityHeaders,
  phoneIdSchema,
  randomCode,
  randomToken,
  sanitizeText,
  securityHeaders,
  validateUpload,
} from "./index";

const header = (list: { key: string; value: string }[], key: string) =>
  list.find((h) => h.key === key)?.value;

describe("security headers", () => {
  it("produksi: CSP ketat, HSTS, dan header dasar", () => {
    const h = securityHeaders({ dev: false });
    const csp = header(h, "Content-Security-Policy")!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(header(h, "Strict-Transport-Security")).toBe("max-age=63072000; includeSubDomains");
    expect(header(h, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(h, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header(h, "Permissions-Policy")).toContain("camera=()");
    expect(header(h, "X-Frame-Options")).toBe("DENY");
  });

  it("dev: tanpa HSTS, izinkan eval", () => {
    const h = securityHeaders({ dev: true });
    expect(header(h, "Strict-Transport-Security")).toBeUndefined();
    expect(header(h, "Content-Security-Policy")).toContain("'unsafe-eval'");
    expect(header(h, "Content-Security-Policy")).not.toContain("upgrade-insecure-requests");
  });

  it("nonce menggantikan 'unsafe-inline' pada script-src", () => {
    const csp = buildCsp({ dev: false, nonce: "abc123" });
    const script = csp.split("; ").find((d) => d.startsWith("script-src"))!;
    expect(script).toContain("'nonce-abc123'");
    expect(script).not.toContain("'unsafe-inline'");
  });

  it("frameSrc dan preload opsional", () => {
    const csp = buildCsp({ dev: false, frameSrc: ["https://www.google.com"] });
    expect(csp).toContain("frame-src https://www.google.com");
    expect(csp).not.toContain("frame-src 'none'");
    const hsts = header(
      securityHeaders({ dev: false, hstsPreload: true }),
      "Strict-Transport-Security",
    );
    expect(hsts).toContain("preload");
  });

  it("nextSecurityHeaders cocok dengan bentuk headers() Next", () => {
    const r = nextSecurityHeaders({ dev: false });
    expect(r).toHaveLength(1);
    expect(r[0]!.source).toBe("/:path*");
    expect(r[0]!.headers.length).toBeGreaterThan(5);
  });
});

describe("skema Zod", () => {
  it("nameSchema", () => {
    expect(nameSchema.parse("  Budi   Santoso ")).toBe("Budi Santoso");
    expect(nameSchema.parse("Siti Nur-Aini")).toBe("Siti Nur-Aini");
    expect(nameSchema.parse("D'Angelo O’Neil")).toBe("D'Angelo O’Neil");
    expect(nameSchema.safeParse("A").success).toBe(false);
    expect(nameSchema.safeParse("Budi123").success).toBe(false);
    expect(nameSchema.safeParse("x".repeat(101)).success).toBe(false);
    expect(nameSchema.safeParse("<script>alert(1)</script>").success).toBe(false);
  });

  it("phoneIdSchema menormalkan ke 62…", () => {
    for (const v of [
      "081234567890",
      "+6281234567890",
      "6281234567890",
      "0812-3456-7890",
      "(0812) 3456 7890",
    ]) {
      expect(phoneIdSchema.parse(v)).toBe("6281234567890");
    }
    expect(phoneIdSchema.safeParse("0212345678").success).toBe(false); // telepon rumah
    expect(phoneIdSchema.safeParse("08123").success).toBe(false); // terlalu pendek
    expect(phoneIdSchema.safeParse("0812345678901234").success).toBe(false); // terlalu panjang
    expect(phoneIdSchema.safeParse("abc").success).toBe(false);
  });

  it("emailSchema", () => {
    expect(emailSchema.parse("  Budi@Contoh.CO.ID ")).toBe("budi@contoh.co.id");
    expect(emailSchema.safeParse("budi@").success).toBe(false);
    expect(emailSchema.safeParse("bukan email").success).toBe(false);
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.id`).success).toBe(false);
  });

  it("messageSchema menyanitasi & membatasi panjang", () => {
    const s = messageSchema({ min: 5, max: 20 });
    expect(s.parse("Halo <b>dunia</b>!")).toBe("Halo dunia!");
    expect(s.safeParse("hi").success).toBe(false);
    expect(s.safeParse("x".repeat(21)).success).toBe(false);
  });
});

describe("sanitasi", () => {
  it("membuang tag HTML, termasuk yang bersarang", () => {
    expect(sanitizeText("<script>alert(1)</script>Halo")).toBe("alert(1)Halo");
    expect(sanitizeText("<<b>script>x")).not.toContain("<");
    expect(sanitizeText('<img src=x onerror="a()">teks')).toBe("teks");
    expect(sanitizeText("a <!-- komentar --> b")).toBe("a b");
  });

  it("membuang karakter kontrol & zero-width, merapikan spasi", () => {
    expect(sanitizeText("a\u0000b​c‮d")).toBe("abcd");
    expect(sanitizeText("  a \t\n  b  ")).toBe("a b");
  });

  it("multiline mempertahankan baris baru (maks 2)", () => {
    expect(sanitizeText("a\n\n\n\nb\r\nc", { multiline: true })).toBe("a\n\nb\nc");
  });

  it("maxLength memotong", () => {
    expect(sanitizeText("abcdefghij", { maxLength: 4 })).toBe("abcd");
  });

  it("escapeHtml", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
    );
  });
});

describe("honeypot", () => {
  it("terdeteksi bila field terisi", () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "http://spam" })).toBe(true);
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "   " })).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped({ nama: "Budi" })).toBe(false);
  });
  it("mendukung FormData", () => {
    const fd = new FormData();
    expect(isHoneypotTripped(fd)).toBe(false);
    fd.set(HONEYPOT_FIELD, "bot");
    expect(isHoneypotTripped(fd)).toBe(true);
  });
  it("time-trap", () => {
    expect(isSubmittedTooFast(1000, 2000, 2500)).toBe(true);
    expect(isSubmittedTooFast(1000, 2000, 3500)).toBe(false);
    expect(isSubmittedTooFast(Number.NaN)).toBe(true);
  });
});

describe("rate limiter", () => {
  it("memblokir setelah limit & reset setelah jendela", () => {
    let t = 1_000_000;
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => t });
    expect(rl.check("ip1").allowed).toBe(true);
    expect(rl.check("ip1").remaining).toBe(1);
    expect(rl.check("ip1").remaining).toBe(0);
    const blocked = rl.check("ip1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(60);
    expect(rl.check("ip2").allowed).toBe(true); // key lain tidak terpengaruh
    t += 60_001;
    expect(rl.check("ip1").allowed).toBe(true);
  });

  it("memori terbatas oleh maxKeys", () => {
    const store = new MemoryRateLimitStore(100);
    const rl = createRateLimiter({ limit: 5, windowMs: 60_000, store });
    for (let i = 0; i < 1000; i++) rl.check(`k${i}`);
    expect(store.size).toBeLessThanOrEqual(100);
  });

  it("getClientIp mengambil dari kanan XFF (anti-spoof)", () => {
    expect(getClientIp({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" })).toBe("203.0.113.9");
    expect(getClientIp({ "x-forwarded-for": "203.0.113.9" })).toBe("203.0.113.9");
    expect(getClientIp({ "x-forwarded-for": "a, b, c" }, 2)).toBe("b");
    expect(getClientIp(new Headers({ "x-real-ip": "10.0.0.1" }))).toBe("10.0.0.1");
    expect(getClientIp({})).toBe("unknown");
  });
});

describe("validator upload", () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
  const gif = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0]);
  const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
  const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  const svg = new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>',
  );
  const exe = Uint8Array.from([0x4d, 0x5a, 0x90, 0x00]);

  it("mendeteksi tipe dari magic bytes", () => {
    expect(detectType(png)).toBe("image/png");
    expect(detectType(jpg)).toBe("image/jpeg");
    expect(detectType(gif)).toBe("image/gif");
    expect(detectType(webp)).toBe("image/webp");
    expect(detectType(pdf)).toBe("application/pdf");
    expect(detectType(svg)).toBeNull();
    expect(detectType(exe)).toBeNull();
  });

  it("menerima gambar valid dan membuat nama acak", () => {
    const r = validateUpload(png, { declaredType: "image/png" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ext).toBe("png");
      expect(r.safeName).toMatch(/^[A-Za-z0-9_-]{22}\.png$/);
    }
  });

  it("menolak: kosong, terlalu besar, tipe tak diizinkan, MIME palsu", () => {
    expect(validateUpload(new Uint8Array(0))).toEqual({ ok: false, reason: "empty" });
    expect(validateUpload(png, { maxBytes: 4 })).toEqual({ ok: false, reason: "too_large" });
    expect(validateUpload(svg, { declaredType: "image/png" })).toEqual({
      ok: false,
      reason: "type_not_allowed",
    });
    expect(validateUpload(exe, { declaredType: "image/png" })).toEqual({
      ok: false,
      reason: "type_not_allowed",
    });
    expect(validateUpload(gif)).toEqual({ ok: false, reason: "type_not_allowed" }); // gif tak di allowed default
    expect(validateUpload(png, { declaredType: "image/jpeg" })).toEqual({
      ok: false,
      reason: "type_mismatch",
    });
  });

  it("allowed bisa diperluas (PDF)", () => {
    expect(
      validateUpload(pdf, { allowed: ["application/pdf"], declaredType: "application/pdf" }).ok,
    ).toBe(true);
  });
});

describe("token acak", () => {
  it("randomToken: format base64url, panjang sesuai, tidak berulang", () => {
    const a = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken(16)).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const set = new Set(Array.from({ length: 500 }, () => randomToken(16)));
    expect(set.size).toBe(500);
  });

  it("randomCode: panjang & alfabet mudah dibaca", () => {
    for (let i = 0; i < 200; i++) expect(randomCode(8)).toMatch(/^[2-9A-HJKMNP-Z]{8}$/);
    expect(randomCode(12, "01")).toMatch(/^[01]{12}$/);
    expect(() => randomCode(4, "a")).toThrow(RangeError);
  });

  it("randomCode: distribusi kasar merata (tanpa bias besar)", () => {
    const counts = new Map<string, number>();
    for (const ch of randomCode(31 * 400)) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    expect(counts.size).toBe(31);
    for (const n of counts.values()) expect(n).toBeGreaterThan(250);
  });
});
