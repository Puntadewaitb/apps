function randomBytes(n: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

/** Token acak aman (CSPRNG), base64url tanpa padding. `bytes` = entropi dalam byte (default 32). */
export function randomToken(bytes = 32): string {
  const b = randomBytes(bytes);
  let bin = "";
  for (const v of b) bin += String.fromCharCode(v);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Alfabet tanpa karakter membingungkan (0/O, 1/I/L). */
export const READABLE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Kode acak mudah dibaca (mis. kode pesanan/RSVP), tanpa modulo bias. */
export function randomCode(length = 8, alphabet = READABLE_ALPHABET): string {
  if (alphabet.length < 2 || alphabet.length > 256)
    throw new RangeError("alphabet harus 2–256 karakter");
  const limit = 256 - (256 % alphabet.length);
  let out = "";
  while (out.length < length) {
    for (const v of randomBytes(length * 2)) {
      if (v < limit) {
        out += alphabet[v % alphabet.length];
        if (out.length === length) break;
      }
    }
  }
  return out;
}
