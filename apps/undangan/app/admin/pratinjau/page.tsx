import { Card, Container } from "@tpl/ui";
import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { activeSlug } from "../../../lib/event";
import { JENIS, resolveJenis } from "../../../lib/jenis";

export default async function PratinjauIndex() {
  await requireAdmin();
  const events = await db().event.findMany({ orderBy: { id: "asc" } });
  return (
    <main className="py-10">
      <Container className="space-y-6">
        <h1 className="text-2xl font-bold text-fg">Pratinjau Acara</h1>
        <p className="text-muted">
          Lihat tampilan tiap acara dan tema. Pratinjau bersifat baca-saja (formulir RSVP & ucapan
          dinonaktifkan). Acara yang tampil untuk publik diatur env <code>EVENT_SLUG</code>.
        </p>
        <ul className="grid gap-4 md:grid-cols-3">
          {events.map((e) => (
            <li key={e.id}>
              <Card data-testid="kartu-acara">
                <p className="text-sm text-muted">{JENIS[resolveJenis(e.jenis)].judul}</p>
                <h2 className="font-serif text-xl font-bold text-fg">{e.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  Tema: {e.tema} {e.slug === activeSlug() && "· aktif"}
                </p>
                <a
                  href={`/admin/pratinjau/${encodeURIComponent(e.slug)}`}
                  className="mt-3 inline-block text-primary underline"
                >
                  Buka pratinjau
                </a>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
