import { sanitizeText } from "@tpl/core";

export const DEFAULT_GUEST = "Tamu Undangan";
export const MAX_GUEST_NAME = 60;

type Param = string | string[] | undefined;

/**
 * Nama tamu dari `?to=`. Next sudah men-decode query string; di sini kita:
 * ambil nilai pertama bila diulang, buang tag HTML/karakter kontrol/zero-width, rapikan spasi,
 * potong ke MAX_GUEST_NAME, dan beri default bila kosong. Hasil adalah TEKS BIASA (React yang meng-escape saat render).
 */
export function guestNameFromParam(param: Param): string {
  const raw = Array.isArray(param) ? param[0] : param;
  if (typeof raw !== "string") return DEFAULT_GUEST;
  const name = sanitizeText(raw, { maxLength: MAX_GUEST_NAME });
  return name || DEFAULT_GUEST;
}
