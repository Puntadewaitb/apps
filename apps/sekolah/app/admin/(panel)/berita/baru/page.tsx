import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormBerita } from "../../../../../components/admin/FormBerita";
import { requireAdmin } from "../../../../../lib/session";
import { simpanBerita } from "../actions";

export const metadata: Metadata = { title: "Tulisan Baru" };
export const dynamic = "force-dynamic";

export default async function BeritaBaru() {
  await requireAdmin("berita", "/admin/berita/baru");
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Tulisan Baru</h1>
        <FormBerita
          action={simpanBerita}
          nilai={{
            title: "",
            kind: "BERITA",
            excerpt: "",
            body: "",
            image: "",
            published: false,
            publishedAt: "",
          }}
        />
      </Container>
    </main>
  );
}
