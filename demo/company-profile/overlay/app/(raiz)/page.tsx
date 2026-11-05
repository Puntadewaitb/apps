// OVERLAY sample statis: alihkan "/" → "/id/" (meta refresh bekerja tanpa JavaScript; tautan sebagai cadangan).
export default function Raiz() {
  const tujuan = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/id/`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${tujuan}`} />
      <p>
        Mengalihkan ke <a href="/id/">Bahasa Indonesia</a>… · <a href="/en/">English</a>
      </p>
    </>
  );
}
