import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@tpl/ui";
import { Flash } from "../../../../../components/admin/Flash";
import { FormAlbum } from "../../../../../components/admin/FormAlbum";
import { FormFoto } from "../../../../../components/admin/FormFoto";
import { HapusButton } from "../../../../../components/admin/HapusButton";
import { input, tombolTabel } from "../../../../../components/admin/ui";
import { db } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/session";
import { hapusFoto, jadikanCover, simpanAlbum, tambahFoto, ubahKeterangan } from "../actions";

export const metadata: Metadata = { title: "Kelola Album" };
export const dynamic = "force-dynamic";

export default async function AlbumKelola({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const { id } = await params;
  await requireAdmin("galeri", `/admin/galeri/${id}`);
  if (!/^\d{1,9}$/.test(id)) notFound();
  const a = await db().gallery.findUnique({
    where: { id: Number(id) },
    include: { images: { orderBy: [{ sort: "asc" }, { id: "asc" }] } },
  });
  if (!a) notFound();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-4xl">
        <h1 className="mb-4 text-2xl font-bold text-fg">Kelola Album</h1>
        <Flash ok={(await searchParams).ok} />
        <section aria-labelledby="h-info" className="mb-10">
          <h2 id="h-info" className="mb-3 text-lg font-semibold text-fg">
            Informasi album
          </h2>
          <FormAlbum
            action={simpanAlbum}
            nilai={{ id: a.id, title: a.title, description: a.description }}
          />
          <p className="mt-2 text-xs text-muted">
            Alamat publik: <code>/galeri/{a.slug}</code>
          </p>
        </section>
        <section aria-labelledby="h-foto">
          <h2 id="h-foto" className="mb-3 text-lg font-semibold text-fg">
            Foto ({a.images.length})
          </h2>
          <FormFoto action={tambahFoto} albumId={a.id} />
          <ul className="mt-6 grid gap-4 sm:grid-cols-2" data-testid="foto-album">
            {a.images.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border border-border bg-bg p-3"
                data-testid="item-foto"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.src}
                  alt={f.caption || a.title}
                  width={320}
                  height={240}
                  loading="lazy"
                  className="h-auto w-full rounded"
                />
                {a.cover === f.src && (
                  <p className="mt-2 text-xs font-semibold text-primary">Sampul album</p>
                )}
                <form action={ubahKeterangan} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="fotoId" value={f.id} />
                  <input
                    name="caption"
                    defaultValue={f.caption}
                    maxLength={150}
                    aria-label={`Keterangan foto ${f.id}`}
                    placeholder="Keterangan"
                    className={input}
                  />
                  <button type="submit" className={tombolTabel}>
                    Simpan
                  </button>
                </form>
                <div className="mt-2 flex flex-wrap gap-2">
                  {a.cover !== f.src && (
                    <form action={jadikanCover}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="fotoId" value={f.id} />
                      <button type="submit" className={tombolTabel}>
                        Jadikan sampul
                      </button>
                    </form>
                  )}
                  <form action={hapusFoto}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="fotoId" value={f.id} />
                    <HapusButton konfirmasi="Hapus foto ini?" />
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </main>
  );
}
