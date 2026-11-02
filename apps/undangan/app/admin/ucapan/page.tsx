import { Container } from "@tpl/ui";
import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { getActiveEvent } from "../../../lib/event";
import { moderasiUcapan } from "./actions";

const waktu = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function Aksi({
  id,
  aksi,
  label,
  warna,
}: {
  id: number;
  aksi: string;
  label: string;
  warna: string;
}) {
  return (
    <form action={moderasiUcapan} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="aksi" value={aksi} />
      <button type="submit" className={`mr-3 underline ${warna}`}>
        {label}
      </button>
    </form>
  );
}

export default async function UcapanAdminPage() {
  await requireAdmin();
  const ev = await getActiveEvent();
  if (!ev) return null;
  const wishes = await db().wish.findMany({
    where: { eventId: ev.id },
    orderBy: { id: "desc" },
    take: 500,
  });
  const menunggu = wishes.filter((w) => !w.visible).length;
  return (
    <main className="py-10">
      <Container className="space-y-6">
        <h1 className="text-2xl font-bold text-fg">Moderasi Ucapan ({wishes.length})</h1>
        <p className="text-muted" data-testid="ringkas-moderasi">
          {menunggu} ucapan disembunyikan / menunggu tinjauan. Ucapan berisi tautan otomatis
          disembunyikan.
        </p>
        <ul className="space-y-3">
          {wishes.length === 0 && <li className="text-muted">Belum ada ucapan.</li>}
          {wishes.map((w) => (
            <li
              key={w.id}
              className="rounded-lg border border-border p-4"
              data-testid="baris-ucapan"
              data-visible={w.visible}
            >
              <p className="whitespace-pre-wrap break-words text-fg">{w.message}</p>
              <p className="mt-2 text-sm text-muted">
                <strong className="text-fg">{w.name}</strong> · {waktu.format(w.createdAt)} ·{" "}
                <span className={w.visible ? "text-success" : "text-danger"}>
                  {w.visible ? "Tampil" : "Disembunyikan"}
                </span>
              </p>
              <div className="mt-2 text-sm">
                {w.visible ? (
                  <Aksi id={w.id} aksi="sembunyi" label="Sembunyikan" warna="text-primary" />
                ) : (
                  <Aksi id={w.id} aksi="tampil" label="Tampilkan" warna="text-primary" />
                )}
                <Aksi id={w.id} aksi="hapus" label="Hapus" warna="text-danger" />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
