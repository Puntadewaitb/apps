import { randomToken } from "./token";

export type AllowedType =
  "image/png" | "image/jpeg" | "image/webp" | "image/gif" | "application/pdf";

const EXT: Record<AllowedType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

const startsWith = (b: Uint8Array, sig: number[], offset = 0) =>
  b.length >= offset + sig.length && sig.every((v, i) => b[offset + i] === v);

/** Deteksi tipe dari magic bytes. SVG sengaja tidak didukung (vektor XSS). */
export function detectType(bytes: Uint8Array): AllowedType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  )
    return "image/gif";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8))
    return "image/webp";
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  return null;
}

export type UploadCheck =
  | { ok: true; type: AllowedType; ext: string; size: number; safeName: string }
  | { ok: false; reason: "empty" | "too_large" | "type_not_allowed" | "type_mismatch" };

export type UploadOptions = {
  /** Batas ukuran byte. Default 5 MB. */
  maxBytes?: number;
  allowed?: AllowedType[];
  /** MIME yang diklaim klien (File.type). Bila diberikan, harus cocok dengan hasil deteksi. */
  declaredType?: string;
};

/**
 * Validasi file upload: ukuran, tipe (magic bytes — bukan ekstensi/nama), dan kecocokan dengan MIME klaim.
 * `safeName` = nama acak server-side; JANGAN pakai nama file dari klien untuk path penyimpanan.
 */
export function validateUpload(bytes: Uint8Array, opts: UploadOptions = {}): UploadCheck {
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;
  const allowed = opts.allowed ?? ["image/png", "image/jpeg", "image/webp"];
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > maxBytes) return { ok: false, reason: "too_large" };
  const type = detectType(bytes);
  if (!type || !allowed.includes(type)) return { ok: false, reason: "type_not_allowed" };
  if (opts.declaredType !== undefined) {
    const declared =
      opts.declaredType.toLowerCase() === "image/jpg"
        ? "image/jpeg"
        : opts.declaredType.toLowerCase();
    if (declared !== type) return { ok: false, reason: "type_mismatch" };
  }
  const ext = EXT[type];
  return { ok: true, type, ext, size: bytes.length, safeName: `${randomToken(16)}.${ext}` };
}
