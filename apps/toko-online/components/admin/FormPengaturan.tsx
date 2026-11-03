"use client";

import { useActionState, useState } from "react";
import { Button, FormField } from "@tpl/ui";
import { MAKS_KOTA, MAKS_REKENING } from "../../lib/pengaturan-schema";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export type NilaiPengaturan = {
  nama: string;
  tagline: string;
  whatsapp: string;
  alamat: string;
  catatanBayar: string;
  ongkirBawaan: string;
  qris: string;
  rekening: Array<{ bank: string; nomor: string; atasNama: string }>;
  kota: Array<{ nama: string; tarif: string }>;
};

let urut = 0;
const kunci = () => `p${++urut}`;

export function FormPengaturan({
  action,
  nilai,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: NilaiPengaturan;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v } = pembacaForm(s);
  const [rek, setRek] = useState(() => nilai.rekening.map((x) => ({ ...x, k: kunci() })));
  const [kota, setKota] = useState(() => nilai.kota.map((x) => ({ ...x, k: kunci() })));

  return (
    <form
      action={kirim}
      aria-label="Form pengaturan toko"
      encType="multipart/form-data"
      className="space-y-8"
    >
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Identitas toko</legend>
        <FormField label="Nama toko" required error={e.nama}>
          <input
            name="nama"
            defaultValue={v("nama", nilai.nama)}
            maxLength={80}
            className={input}
          />
        </FormField>
        <FormField label="Tagline" error={e.tagline}>
          <input
            name="tagline"
            defaultValue={v("tagline", nilai.tagline)}
            maxLength={200}
            className={input}
          />
        </FormField>
        <FormField
          label="Nomor WhatsApp"
          error={e.whatsapp}
          hint="Contoh: 081234567890. Kosongkan untuk menyembunyikan tombol WhatsApp."
        >
          <input
            name="whatsapp"
            inputMode="tel"
            defaultValue={v("whatsapp", nilai.whatsapp)}
            maxLength={20}
            className={input}
          />
        </FormField>
        <FormField label="Alamat toko" error={e.alamat}>
          <textarea
            name="alamat"
            rows={2}
            defaultValue={v("alamat", nilai.alamat)}
            maxLength={300}
            className={input}
          />
        </FormField>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Pembayaran</legend>
        <FormField label="Catatan pembayaran" error={e.catatanBayar}>
          <textarea
            name="catatanBayar"
            rows={2}
            defaultValue={v("catatanBayar", nilai.catatanBayar)}
            maxLength={300}
            className={input}
          />
        </FormField>
        <input type="hidden" name="r_count" value={rek.length} />
        {e.rekening && (
          <p role="alert" className="text-sm text-danger">
            {e.rekening}
          </p>
        )}
        {rek.map((r, i) => (
          <div
            key={r.k}
            className="grid gap-3 rounded-md bg-surface p-3 sm:grid-cols-3"
            data-testid="baris-rekening"
          >
            <FormField label="Bank" error={e[`r${i}_bank`]}>
              <input
                name={`r${i}_bank`}
                value={r.bank}
                onChange={(ev) =>
                  setRek((x) => x.map((y) => (y.k === r.k ? { ...y, bank: ev.target.value } : y)))
                }
                maxLength={60}
                className={input}
              />
            </FormField>
            <FormField label="Nomor rekening" error={e[`r${i}_nomor`]}>
              <input
                name={`r${i}_nomor`}
                inputMode="numeric"
                value={r.nomor}
                onChange={(ev) =>
                  setRek((x) => x.map((y) => (y.k === r.k ? { ...y, nomor: ev.target.value } : y)))
                }
                maxLength={30}
                className={input}
              />
            </FormField>
            <FormField label="Atas nama" error={e[`r${i}_atasNama`]}>
              <input
                name={`r${i}_atasNama`}
                value={r.atasNama}
                onChange={(ev) =>
                  setRek((x) =>
                    x.map((y) => (y.k === r.k ? { ...y, atasNama: ev.target.value } : y)),
                  )
                }
                maxLength={80}
                className={input}
              />
            </FormField>
            <button
              type="button"
              onClick={() => setRek((x) => x.filter((y) => y.k !== r.k))}
              className="text-left text-sm text-danger underline sm:col-span-3"
              aria-label={`Hapus rekening ${r.bank || i + 1}`}
            >
              Hapus rekening
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={rek.length >= MAKS_REKENING}
          onClick={() => setRek((x) => [...x, { k: kunci(), bank: "", nomor: "", atasNama: "" }])}
        >
          + Tambah rekening
        </Button>
        <FormField label="Gambar QRIS" error={e.qris} hint="PNG, JPG, atau WebP; maksimal 2 MB.">
          <input
            name="qris"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={input}
          />
        </FormField>
        {nilai.qris && (
          <div className="flex items-center gap-3 text-sm text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nilai.qris}
              alt="QRIS saat ini"
              width={64}
              height={64}
              className="h-16 w-16 rounded-md border border-border object-cover"
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hapusQris" /> Hapus QRIS
            </label>
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Ongkos kirim</legend>
        <FormField
          label="Tarif bawaan (Rp)"
          required
          error={e.ongkirBawaan}
          hint="Dipakai untuk kota yang tidak ada di daftar."
        >
          <input
            name="ongkirBawaan"
            inputMode="numeric"
            defaultValue={v("ongkirBawaan", nilai.ongkirBawaan)}
            className={input}
          />
        </FormField>
        <input type="hidden" name="k_count" value={kota.length} />
        {e.kota && (
          <p role="alert" className="text-sm text-danger">
            {e.kota}
          </p>
        )}
        {kota.map((k, i) => (
          <div
            key={k.k}
            className="grid gap-3 rounded-md bg-surface p-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
            data-testid="baris-kota"
          >
            <FormField label="Kota" error={e[`k${i}_nama`]}>
              <input
                name={`k${i}_nama`}
                value={k.nama}
                onChange={(ev) =>
                  setKota((x) => x.map((y) => (y.k === k.k ? { ...y, nama: ev.target.value } : y)))
                }
                maxLength={60}
                className={input}
              />
            </FormField>
            <FormField label="Tarif (Rp)" error={e[`k${i}_tarif`]}>
              <input
                name={`k${i}_tarif`}
                inputMode="numeric"
                value={k.tarif}
                onChange={(ev) =>
                  setKota((x) => x.map((y) => (y.k === k.k ? { ...y, tarif: ev.target.value } : y)))
                }
                className={input}
              />
            </FormField>
            <button
              type="button"
              onClick={() => setKota((x) => x.filter((y) => y.k !== k.k))}
              className="pb-2 text-sm text-danger underline"
              aria-label={`Hapus kota ${k.nama || i + 1}`}
            >
              Hapus
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={kota.length >= MAKS_KOTA}
          onClick={() => setKota((x) => [...x, { k: kunci(), nama: "", tarif: "" }])}
        >
          + Tambah kota
        </Button>
      </fieldset>

      {s.pesan && (
        <p role="alert" className="text-sm text-danger" data-testid="galat-form">
          {s.pesan}
        </p>
      )}
      <Button type="submit" disabled={menunggu}>
        {menunggu ? "Menyimpan…" : "Simpan pengaturan"}
      </Button>
    </form>
  );
}
