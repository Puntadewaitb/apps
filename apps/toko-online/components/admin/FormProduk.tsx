"use client";

import { useActionState, useState } from "react";
import { Button, FormField } from "@tpl/ui";
import { MAKS_GALERI, MAKS_VARIAN, pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export type NilaiVarian = {
  id?: number;
  name: string;
  sku: string;
  price: string;
  stock: string;
  active: boolean;
};
export type NilaiProduk = {
  id?: number;
  name: string;
  categoryId: string;
  description: string;
  price: string;
  active: boolean;
  image: string;
  galeri: string[];
  varian: NilaiVarian[];
};

let urut = 0;
const kunci = () => `r${++urut}`;

export function FormProduk({
  action,
  nilai,
  kategori,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: NilaiProduk;
  kategori: Array<{ id: number; name: string }>;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v, c } = pembacaForm(s);
  // Baris varian dikendalikan state (bukan defaultValue) supaya tidak hilang saat action gagal & tombol tambah/hapus berfungsi.
  const [baris, setBaris] = useState(() => nilai.varian.map((x) => ({ ...x, k: kunci() })));
  const ubah = (k: string, patch: Partial<NilaiVarian>) =>
    setBaris((b) => b.map((x) => (x.k === k ? { ...x, ...patch } : x)));

  return (
    <form
      action={kirim}
      aria-label={nilai.id ? "Form ubah produk" : "Form produk baru"}
      encType="multipart/form-data"
      className="space-y-6"
    >
      {nilai.id && <input type="hidden" name="id" value={nilai.id} />}
      <FormField label="Nama produk" required error={e.name}>
        <input name="name" defaultValue={v("name", nilai.name)} maxLength={120} className={input} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Kategori" required error={e.categoryId}>
          <select
            name="categoryId"
            defaultValue={v("categoryId", nilai.categoryId)}
            key={s.values?.categoryId ?? "awal"}
            className={input}
          >
            <option value="">— Pilih —</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Harga dasar (Rp)"
          required
          error={e.price}
          hint="Harga varian boleh berbeda (diisi di bagian varian)."
        >
          <input
            name="price"
            inputMode="numeric"
            defaultValue={v("price", nilai.price)}
            className={input}
          />
        </FormField>
      </div>
      <FormField label="Deskripsi" required error={e.description}>
        <textarea
          name="description"
          rows={5}
          defaultValue={v("description", nilai.description)}
          maxLength={2000}
          className={input}
        />
      </FormField>
      <label className="flex items-center gap-2 text-fg">
        <input type="checkbox" name="active" defaultChecked={c("active", nilai.active)} /> Tampilkan
        di toko
      </label>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Gambar</legend>
        <FormField
          label="Gambar utama"
          error={e.gambar}
          hint="PNG, JPG, atau WebP; maksimal 2 MB. Kosongkan untuk mempertahankan."
        >
          <input
            name="gambar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={input}
          />
        </FormField>
        {nilai.image && (
          <p className="flex items-center gap-3 text-sm text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nilai.image}
              alt="Gambar utama saat ini"
              width={64}
              height={64}
              className="h-16 w-16 rounded-md border border-border object-cover"
            />
            Gambar utama saat ini
          </p>
        )}
        {nilai.galeri.length > 0 && (
          <ul className="flex flex-wrap gap-3" aria-label="Gambar tambahan saat ini">
            {nilai.galeri.map((g) => (
              <li key={g} className="text-xs text-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g}
                  alt="Gambar tambahan"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-md border border-border object-cover"
                />
                <label className="mt-1 flex items-center gap-1">
                  <input type="checkbox" name="hapusGaleri" value={g} /> Hapus
                </label>
              </li>
            ))}
          </ul>
        )}
        <FormField
          label="Tambah gambar"
          error={e.galeri}
          hint={`Boleh pilih beberapa; total tambahan maksimal ${MAKS_GALERI}.`}
        >
          <input
            name="galeri"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className={input}
          />
        </FormField>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Varian & stok</legend>
        <input type="hidden" name="v_count" value={baris.length} />
        {e.varian && (
          <p role="alert" className="text-sm text-danger">
            {e.varian}
          </p>
        )}
        {baris.map((b, i) => (
          <div
            key={b.k}
            className="grid gap-3 rounded-md bg-surface p-3 sm:grid-cols-6"
            data-testid="baris-varian"
          >
            {b.id !== undefined && <input type="hidden" name={`v${i}_id`} value={b.id} />}
            <FormField
              label="Nama varian"
              required
              error={e[`v${i}_name`]}
              className="sm:col-span-2"
            >
              <input
                name={`v${i}_name`}
                value={b.name}
                onChange={(ev) => ubah(b.k, { name: ev.target.value })}
                maxLength={60}
                className={input}
              />
            </FormField>
            <FormField label="SKU" required error={e[`v${i}_sku`]} className="sm:col-span-2">
              <input
                name={`v${i}_sku`}
                value={b.sku}
                onChange={(ev) => ubah(b.k, { sku: ev.target.value })}
                maxLength={40}
                className={input}
              />
            </FormField>
            <FormField label="Harga varian (opsional)" error={e[`v${i}_price`]}>
              <input
                name={`v${i}_price`}
                inputMode="numeric"
                value={b.price}
                onChange={(ev) => ubah(b.k, { price: ev.target.value })}
                className={input}
              />
            </FormField>
            {b.id === undefined ? (
              <FormField label="Stok awal" required error={e[`v${i}_stock`]}>
                <input
                  name={`v${i}_stock`}
                  inputMode="numeric"
                  value={b.stock}
                  onChange={(ev) => ubah(b.k, { stock: ev.target.value })}
                  className={input}
                />
              </FormField>
            ) : (
              <p className="self-end text-sm text-muted">
                Stok: <strong data-testid="stok-saat-ini">{b.stock}</strong> (ubah di halaman{" "}
                <a href="/admin/stok" className="underline">
                  Stok
                </a>
                )
                <input type="hidden" name={`v${i}_stock`} value="0" />
              </p>
            )}
            <div className="flex items-center gap-4 sm:col-span-6">
              <label className="flex items-center gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  name={`v${i}_active`}
                  checked={b.active}
                  onChange={(ev) => ubah(b.k, { active: ev.target.checked })}
                />{" "}
                Varian aktif
              </label>
              <button
                type="button"
                disabled={baris.length <= 1}
                onClick={() => setBaris((x) => x.filter((r) => r.k !== b.k))}
                className="text-sm text-danger underline disabled:opacity-40"
                aria-label={`Hapus varian ${b.name || i + 1}`}
              >
                Hapus varian
              </button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={baris.length >= MAKS_VARIAN}
          onClick={() =>
            setBaris((b) => [
              ...b,
              { k: kunci(), name: "", sku: "", price: "", stock: "0", active: true },
            ])
          }
        >
          + Tambah varian
        </Button>
      </fieldset>

      {s.pesan && (
        <p role="alert" className="text-sm text-danger" data-testid="galat-form">
          {s.pesan}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan"}
        </Button>
        <a
          href="/admin/produk"
          className="inline-flex items-center rounded-md px-4 py-2 text-fg underline underline-offset-2"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
