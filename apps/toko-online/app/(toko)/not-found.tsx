import type { Metadata } from "next";
import { TidakDitemukan } from "../../components/TidakDitemukan";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: true },
};

// 404 dari notFound() di dalam halaman toko (sudah dibungkus layout (toko)).
export default function NotFoundToko() {
  return <TidakDitemukan />;
}
