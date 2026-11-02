/**
 * URL embed peta dari database hanya boleh berupa embed Google Maps via HTTPS
 * (mencegah iframe ke situs sembarang bila data diubah/dirusak). Selain itu → null.
 */
export function safeMapsEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.hostname !== "www.google.com" || u.port !== "") return null;
  const okPath =
    u.pathname === "/maps/embed" ||
    (u.pathname === "/maps" && u.searchParams.get("output") === "embed");
  return okPath ? u.toString() : null;
}

/** Tautan pencarian Google Maps untuk alamat (dibuka di tab baru). */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
