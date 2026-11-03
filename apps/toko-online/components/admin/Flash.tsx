const PESAN: Record<string, string> = {
  tersimpan: "Perubahan tersimpan.",
  dihapus: "Data dihapus.",
  stok: "Stok diperbarui.",
  aktif: "Status produk diperbarui.",
  status: "Status pesanan diperbarui.",
  catatan: "Catatan disimpan.",
  pengaturan: "Pengaturan toko disimpan.",
};

const GALAT: Record<string, string> = {
  berisi:
    "Kategori tidak bisa dihapus karena masih berisi produk. Pindahkan atau hapus produknya dulu.",
  tidakada: "Data tidak ditemukan (mungkin sudah dihapus).",
  stokminus: "Stok tidak boleh menjadi kurang dari nol.",
  stoktidaksah: "Perubahan stok tidak valid.",
  statusberubah: "Status pesanan sudah berubah (mungkin diubah pengguna lain). Muat ulang halaman.",
  transisi: "Perubahan status tidak diizinkan dari status saat ini.",
  catatan: "Catatan tidak valid.",
};

/** Pesan sukses dari ?ok= (hanya kunci terdaftar — teks bebas dari URL tidak pernah ditampilkan). */
export function Flash({ ok, galat }: { ok?: string | string[]; galat?: string | string[] }) {
  const k = Array.isArray(ok) ? ok[0] : ok;
  const g = Array.isArray(galat) ? galat[0] : galat;
  const pesanGalat = g && Object.hasOwn(GALAT, g) ? GALAT[g] : null;
  if (pesanGalat)
    return (
      <p
        role="alert"
        data-testid="flash-galat"
        className="mb-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
      >
        {pesanGalat}
      </p>
    );
  const teks = k && Object.hasOwn(PESAN, k) ? PESAN[k] : null;
  if (!teks) return null;
  return (
    <p
      role="status"
      data-testid="flash"
      className="mb-4 rounded-md border border-border bg-bg p-3 text-sm text-success"
    >
      {teks}
    </p>
  );
}
