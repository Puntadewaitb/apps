"use client";

import { useActionState } from "react";
import { Button, FormField } from "@tpl/ui";
import { pembacaForm, type FormState } from "../../lib/validasi";
import { EditorMarkdown } from "./EditorMarkdown";
import { input } from "./ui";

export type NilaiBerita = {
  id?: number;
  title: string;
  kind: string;
  excerpt: string;
  body: string;
  image: string;
  published: boolean;
  publishedAt: string; // datetime-local WIB
};

export function FormBerita({
  action,
  nilai,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  nilai: NilaiBerita;
}) {
  const [s, kirim, menunggu] = useActionState(action, {} as FormState);
  const e = s.errors ?? {};
  const { v, c } = pembacaForm(s);
  return (
    <form
      action={kirim}
      aria-label="Form berita"
      encType="multipart/form-data"
      className="space-y-5"
    >
      {nilai.id && <input type="hidden" name="id" value={nilai.id} />}
      <FormField label="Judul" required error={e.title}>
        <input
          name="title"
          defaultValue={v("title", nilai.title)}
          maxLength={150}
          className={input}
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Jenis" error={e.kind}>
          <select
            key={v("kind", nilai.kind)}
            name="kind"
            defaultValue={v("kind", nilai.kind)}
            className={input}
          >
            <option value="BERITA">Berita</option>
            <option value="PENGUMUMAN">Pengumuman</option>
          </select>
        </FormField>
        <FormField
          label="Tanggal terbit (WIB)"
          hint="Kosong = sekarang. Tanggal masa depan = terjadwal."
          error={e.publishedAt}
        >
          <input
            name="publishedAt"
            type="datetime-local"
            defaultValue={v("publishedAt", nilai.publishedAt)}
            className={input}
          />
        </FormField>
      </div>
      <FormField
        label="Ringkasan"
        required
        error={e.excerpt}
        hint="20–300 karakter; tampil di daftar berita."
      >
        <textarea
          name="excerpt"
          rows={3}
          defaultValue={v("excerpt", nilai.excerpt)}
          maxLength={320}
          className={input}
        />
      </FormField>
      <FormField
        label="Isi"
        required
        error={e.body}
        hint="Markdown aman: judul, daftar, kutipan, tebal/miring, tautan. HTML mentah tidak ditampilkan."
      >
        <EditorMarkdown nama="body" nilaiAwal={v("body", nilai.body)} error={e.body} />
      </FormField>
      <div className="space-y-2">
        <FormField
          label="Gambar sampul"
          error={e.gambar}
          hint="PNG, JPG, atau WebP; maksimal 2 MB."
        >
          <input
            name="gambar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={input}
          />
        </FormField>
        {nilai.image && (
          <div className="flex items-center gap-3 text-sm text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nilai.image}
              alt="Sampul saat ini"
              width={96}
              height={54}
              className="h-14 w-auto rounded border border-border"
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hapusGambar" /> Hapus gambar saat ini
            </label>
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-fg">
        <input type="checkbox" name="published" defaultChecked={c("published", nilai.published)} />{" "}
        Terbitkan (tampil di situs publik)
      </label>
      {s.pesan && (
        <p
          role={s.ok === false ? "alert" : "status"}
          className={s.ok === false ? "text-sm text-danger" : "text-sm text-success"}
        >
          {s.pesan}
        </p>
      )}
      <div className="flex gap-3">
        <Button type="submit" disabled={menunggu}>
          {menunggu ? "Menyimpan…" : "Simpan"}
        </Button>
        <a
          href="/admin/berita"
          className="inline-flex items-center rounded-md px-4 py-2 text-fg underline underline-offset-2"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
