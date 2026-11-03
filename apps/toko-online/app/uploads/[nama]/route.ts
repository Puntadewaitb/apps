import { bacaUpload, mimeDariNama, NAMA_UPLOAD } from "../../../lib/upload";

export const dynamic = "force-dynamic";

/** Sajikan gambar unggahan (produk, QRIS). Nama dibatasi regex ketat (tanpa traversal); tipe dari ekstensi buatan server. Bukti bayar ada di subfolder privat dan TIDAK tersaji di sini. */
export async function GET(_req: Request, { params }: { params: Promise<{ nama: string }> }) {
  const { nama } = await params;
  const mime = NAMA_UPLOAD.test(nama) ? mimeDariNama(nama) : undefined;
  const data = mime ? await bacaUpload(nama) : null;
  if (!mime || !data) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(data.length),
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
