export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

/** Harga efektif varian: harga varian bila diisi, selain itu harga dasar produk. */
export const hargaVarian = (produk: { price: number }, varian: { price: number | null }) =>
  varian.price ?? produk.price;
