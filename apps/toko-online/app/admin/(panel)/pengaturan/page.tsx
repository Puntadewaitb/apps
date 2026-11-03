import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { Flash } from "../../../../components/admin/Flash";
import { FormPengaturan } from "../../../../components/admin/FormPengaturan";
import { requireAdmin } from "../../../../lib/session";
import { getPengaturan } from "../../../../lib/setting";
import { simpanPengaturan } from "./actions";

export const metadata: Metadata = { title: "Pengaturan Toko" };
export const dynamic = "force-dynamic";

export default async function PengaturanPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireAdmin("pengaturan", "/admin/pengaturan");
  const s = await getPengaturan();
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold text-fg">Pengaturan Toko</h1>
        <Flash ok={(await searchParams).ok} />
        <FormPengaturan
          action={simpanPengaturan}
          nilai={{
            nama: s.nama,
            tagline: s.tagline,
            whatsapp: s.whatsapp,
            alamat: s.alamat,
            catatanBayar: s.catatanBayar,
            ongkirBawaan: String(s.ongkir.bawaan),
            qris: s.qris,
            rekening: s.rekening,
            kota: Object.entries(s.ongkir.kota).map(([nama, tarif]) => ({
              nama,
              tarif: String(tarif),
            })),
          }}
        />
      </Container>
    </main>
  );
}
