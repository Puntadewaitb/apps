import { notFound } from "next/navigation";
import { Undangan } from "../../../../components/Undangan";
import { requireAdmin } from "../../../../lib/admin-auth";
import { db } from "../../../../lib/db";

export default async function PratinjauPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const ev = await db().event.findUnique({ where: { slug } });
  if (!ev) notFound();
  return (
    <>
      <div
        role="note"
        className="bg-fg px-4 py-2 text-center text-sm text-bg"
        data-testid="banner-pratinjau"
      >
        Mode pratinjau — {ev.title}. Formulir dinonaktifkan.{" "}
        <a href="/admin/pratinjau" className="underline">
          Kembali
        </a>
      </div>
      <Undangan ev={ev} guestName="Tamu Undangan" tamu={null} pratinjau />
    </>
  );
}
