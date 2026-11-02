/** Menampilkan nama acara; tanda "&" diberi warna primer. */
export function NamaAcara({ nama }: { nama: string }) {
  const bagian = nama.split(" & ");
  return (
    <>
      {bagian.map((b, i) => (
        <span key={i}>
          {i > 0 && (
            <>
              {" "}
              <span className="text-primary">&amp;</span>{" "}
            </>
          )}
          {b}
        </span>
      ))}
    </>
  );
}
