// Banner "versi demo" — disisipkan OLEH BUILD ke root layout salinan (scripts/demo/build.mjs), dirender oleh React
// sehingga konsisten dengan hydration. Tidak pernah ikut build versi lengkap.
export function DemoBanner() {
  const kontak = process.env.NEXT_PUBLIC_DEMO_CONTACT_URL;
  return (
    <div
      id="demo-banner"
      role="note"
      style={{
        background: "#111827",
        color: "#fff",
        font: "14px/1.5 system-ui, sans-serif",
        padding: "8px 16px",
        textAlign: "center",
      }}
    >
      <strong>Versi demo</strong> — tampilan contoh; data tidak disimpan di server dan panel admin
      tidak disertakan.
      {kontak ? (
        <>
          {" "}
          <a
            href={kontak}
            style={{ color: "#93c5fd", textDecoration: "underline", fontWeight: 600 }}
          >
            Pesan versi lengkap
          </a>
        </>
      ) : null}
    </div>
  );
}
