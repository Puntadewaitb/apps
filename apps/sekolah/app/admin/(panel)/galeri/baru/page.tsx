import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormAlbum } from "../../../../../components/admin/FormAlbum";
import { requireAdmin } from "../../../../../lib/session";
import { simpanAlbum } from "../actions";

export const metadata: Metadata = { title: "Album Baru" };
export const dynamic = "force-dynamic";

export default async function AlbumBaru() {
  await requireAdmin("galeri", "/admin/galeri/baru");
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-fg">Album Baru</h1>
        <p className="mb-6 text-sm text-muted">
          Setelah disimpan, Anda bisa mengunggah foto ke album ini.
        </p>
        <FormAlbum action={simpanAlbum} nilai={{ title: "", description: "" }} />
      </Container>
    </main>
  );
}
