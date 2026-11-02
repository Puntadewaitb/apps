const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Ambil ID video YouTube dari ID mentah atau URL (youtu.be/, watch?v=, embed/, shorts/, nocookie).
 * Mengembalikan null bila bukan YouTube / tidak valid — hanya ID 11 karakter [A-Za-z0-9_-] yang lolos.
 */
export function parseYoutubeId(input: string | null | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  if (ID_RE.test(raw)) return raw;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = u.pathname.split("/")[1] ?? null;
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = /^\/(?:embed|shorts|live)\/([^/?#]+)/.exec(u.pathname);
      id = m?.[1] ?? null;
    }
  }
  return id && ID_RE.test(id) ? id : null;
}

/** URL embed privasi (tanpa cookie pelacak sebelum diputar). */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}
