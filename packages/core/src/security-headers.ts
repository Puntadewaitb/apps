export type HeaderEntry = { key: string; value: string };

export type SecurityHeadersOptions = {
  /** true di development: izinkan eval (HMR) & matikan HSTS/upgrade-insecure-requests. Default: NODE_ENV !== "production". */
  dev?: boolean;
  /** Nonce per-request (dari proxy.ts). Bila diisi, 'unsafe-inline' pada script-src dibuang. */
  nonce?: string;
  /** Tambahan origin, mis. frameSrc: ["https://www.google.com"] untuk embed Google Maps. */
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  frameSrc?: string[];
  /** HSTS max-age (detik). Default 2 tahun. `preload` TIDAK diaktifkan otomatis. */
  hstsMaxAge?: number;
  hstsPreload?: boolean;
};

const isDevDefault = () => process.env.NODE_ENV !== "production";

function directive(name: string, values: string[]): string {
  return `${name} ${values.join(" ")}`;
}

/**
 * Bangun nilai Content-Security-Policy.
 *
 * Catatan: tanpa nonce, Next.js membutuhkan 'unsafe-inline' untuk script hidrasi.
 * Untuk CSP tanpa 'unsafe-inline', hasilkan nonce di `proxy.ts` dan kirim lewat opsi `nonce`.
 */
export function buildCsp(opts: SecurityHeadersOptions = {}): string {
  const dev = opts.dev ?? isDevDefault();
  const script = ["'self'", ...(opts.nonce ? [`'nonce-${opts.nonce}'`] : ["'unsafe-inline'"])];
  if (dev) script.push("'unsafe-eval'");
  script.push(...(opts.scriptSrc ?? []));

  const parts = [
    directive("default-src", ["'self'"]),
    directive("script-src", script),
    directive("style-src", ["'self'", "'unsafe-inline'", ...(opts.styleSrc ?? [])]),
    directive("img-src", ["'self'", "data:", "blob:", ...(opts.imgSrc ?? [])]),
    directive("font-src", ["'self'", ...(opts.fontSrc ?? [])]),
    directive("connect-src", ["'self'", ...(opts.connectSrc ?? [])]),
    directive("frame-src", opts.frameSrc?.length ? opts.frameSrc : ["'none'"]),
    directive("object-src", ["'none'"]),
    directive("base-uri", ["'self'"]),
    directive("form-action", ["'self'"]),
    directive("frame-ancestors", ["'none'"]),
  ];
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/** Daftar header untuk `headers()` di next.config. */
export function securityHeaders(opts: SecurityHeadersOptions = {}): HeaderEntry[] {
  const dev = opts.dev ?? isDevDefault();
  const list: HeaderEntry[] = [
    { key: "Content-Security-Policy", value: buildCsp({ ...opts, dev }) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];
  if (!dev) {
    const maxAge = opts.hstsMaxAge ?? 63072000;
    list.push({
      key: "Strict-Transport-Security",
      value: `max-age=${maxAge}; includeSubDomains${opts.hstsPreload ? "; preload" : ""}`,
    });
  }
  return list;
}

/** Pakai di next.config: `async headers() { return nextSecurityHeaders(); }` */
export function nextSecurityHeaders(opts: SecurityHeadersOptions = {}) {
  return [{ source: "/:path*", headers: securityHeaders(opts) }];
}
