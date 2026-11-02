const PESAN: Record<string, string> = {
  tersimpan: "Perubahan tersimpan.",
  dihapus: "Data dihapus.",
};

/** Pesan sukses dari ?ok= (hanya kunci terdaftar — teks bebas dari URL tidak pernah ditampilkan). */
export function Flash({ ok }: { ok?: string | string[] }) {
  const k = Array.isArray(ok) ? ok[0] : ok;
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
