import type { Metadata } from "next";
import { Card, Container } from "@tpl/ui";
import { LogoutButton } from "../../components/admin/LogoutButton";
import { ambilRingkasan } from "../../lib/ringkasan";
import { requireAdmin } from "../../lib/session";

export const metadata: Metadata = { title: "Ringkasan" };
export const dynamic = "force-dynamic";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ akses?: string }>;
}) {
  const user = await requireAdmin("ringkasan", "/admin");
  const r = await ambilRingkasan(user.role);
  const ditolak = (await searchParams).akses === "ditolak";
  const kartu: Array<{ judul: string; nilai: number; ket: string; id: string }> = [];
  if (r.berita) {
    kartu.push({
      id: "berita-terbit",
      judul: "Berita terbit",
      nilai: r.berita.terbit,
      ket: "tampil di situs",
    });
    kartu.push({
      id: "berita-draf",
      judul: "Draf berita",
      nilai: r.berita.draf,
      ket: "belum diterbitkan",
    });
  }
  if (r.agenda)
    kartu.push({
      id: "agenda",
      judul: "Agenda mendatang",
      nilai: r.agenda.mendatang,
      ket: "kegiatan",
    });
  if (r.ppdb)
    kartu.push({
      id: "ppdb",
      judul: "Pendaftar baru",
      nilai: r.ppdb.baru,
      ket: "menunggu ditinjau",
    });
  if (r.donasi)
    kartu.push({
      id: "donasi",
      judul: "Donasi menunggu",
      nilai: r.donasi.menunggu,
      ket: "perlu diverifikasi",
    });
  return (
    <main id="isi" className="py-10">
      <Container>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-fg">Dashboard Admin</h1>
            <p className="text-sm text-muted" data-testid="info-pengguna">
              {user.name} · {user.role === "ADMIN" ? "Administrator" : "Editor"}
            </p>
          </div>
          <LogoutButton />
        </header>
        {ditolak && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-border bg-bg p-3 text-sm text-danger"
          >
            Peran Anda tidak memiliki akses ke halaman tersebut.
          </p>
        )}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="kartu-ringkasan">
          {kartu.map((k) => (
            <li key={k.id}>
              <Card className="h-full" data-testid={`ringkasan-${k.id}`}>
                <p className="text-sm text-muted">{k.judul}</p>
                <p className="mt-1 text-3xl font-bold text-primary">{k.nilai}</p>
                <p className="text-xs text-muted">{k.ket}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
