// OVERLAY sample statis: kalender per bulan sebagai halaman statis (menggantikan ?bulan=YYYY-MM).
// Jendela bulan: lib/demo-rentang.ts (relatif waktu build; data seed juga relatif waktu seed).
import type { Metadata } from "next";
import { parseBulan } from "../../../../../lib/agenda";
import { daftarBulan } from "../../../../../lib/demo-rentang";
import { AgendaIsi } from "../../page";

type Props = { params: Promise<{ ym: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return daftarBulan().map((ym) => ({ ym }));
}

export const metadata: Metadata = {
  title: "Agenda Kegiatan",
  description: "Kalender dan daftar kegiatan sekolah.",
};

export default async function Page({ params }: Props) {
  const { ym } = await params;
  return AgendaIsi({ bulan: parseBulan(ym) ? ym : undefined });
}
