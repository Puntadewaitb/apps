// OVERLAY sample statis: filter jenis tulisan sebagai halaman statis (menggantikan ?jenis=).
import { BeritaIsi } from "../../page";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ jenis: "berita" }, { jenis: "pengumuman" }];
}

export default async function Page({ params }: { params: Promise<{ jenis: string }> }) {
  return BeritaIsi({ jenis: (await params).jenis });
}
