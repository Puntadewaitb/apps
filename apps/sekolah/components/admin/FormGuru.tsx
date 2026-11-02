"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { input } from "./ui";

export type NilaiGuru = {
  id?: number;
  name: string;
  position: string;
  subject: string;
  bio: string;
  photo: string;
  sort: number;
  active: boolean;
};

export function FormGuru({
  action,
  nilai,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: NilaiGuru;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v, c } = pembacaForm(s);
  return (
    <form action={kirim} aria-label="Form guru" encType="multipart/form-data" className="space-y-5">
      {nilai.id && <input type="hidden" name="id" value={nilai.id} />}
      <FormField label="Nama lengkap" required error={e.name}>
        <input name="name" defaultValue={v("name", nilai.name)} maxLength={100} className={input} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Jabatan" required error={e.position}>
          <input
            name="position"
            defaultValue={v("position", nilai.position)}
            maxLength={100}
            className={input}
          />
        </FormField>
        <FormField label="Mata pelajaran" error={e.subject}>
          <input
            name="subject"
            defaultValue={v("subject", nilai.subject)}
            maxLength={100}
            className={input}
          />
        </FormField>
      </div>
      <FormField label="Bio singkat" error={e.bio}>
        <textarea
          name="bio"
          rows={3}
          defaultValue={v("bio", nilai.bio)}
          maxLength={500}
          className={input}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Urutan tampil"
          required
          error={e.sort}
          hint="Angka kecil tampil lebih dulu."
        >
          <input
            name="sort"
            inputMode="numeric"
            defaultValue={v("sort", String(nilai.sort))}
            className={input}
          />
        </FormField>
        <label className="flex items-center gap-2 pt-7 text-fg">
          <input type="checkbox" name="active" defaultChecked={c("active", nilai.active)} />{" "}
          Tampilkan di situs
        </label>
      </div>
      <div className="space-y-2">
        <FormField label="Foto" error={e.foto} hint="PNG, JPG, atau WebP; maksimal 2 MB.">
          <input
            name="foto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={input}
          />
        </FormField>
        {nilai.photo && (
          <div className="flex items-center gap-3 text-sm text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nilai.photo}
              alt="Foto saat ini"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full border border-border object-cover"
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hapusFoto" /> Hapus foto saat ini
            </label>
          </div>
        )}
      </div>
      {s.pesan && (
        <p role="alert" className="text-sm text-danger">
          {s.pesan}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan"}
        </Button>
        <a
          href="/admin/guru"
          className="inline-flex items-center rounded-md px-4 py-2 text-fg underline underline-offset-2"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
