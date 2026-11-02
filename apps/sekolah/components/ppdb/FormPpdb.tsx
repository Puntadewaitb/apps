"use client";

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { Button, FormField } from "@tpl/ui";
import { ppdb } from "../../content/ppdb";
import type { HasilDaftar } from "../../app/(publik)/ppdb/actions";

const input =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg aria-[invalid=true]:border-danger";

const LANGKAH = ["Data calon siswa", "Orang tua / wali", "Dokumen", "Tinjau & kirim"] as const;
const STEP_FIELD: Record<string, number> = {
  studentName: 0,
  birthPlace: 0,
  birthDate: 0,
  gender: 0,
  previousSchool: 0,
  address: 0,
  targetGrade: 0,
  parentName: 1,
  parentPhone: 1,
  parentEmail: 1,
  parentJob: 1,
};
const stepDari = (k: string) => (k.startsWith("dok_") ? 2 : (STEP_FIELD[k] ?? 0));

const LABEL: Record<string, string> = {
  studentName: "Nama calon siswa",
  birthPlace: "Tempat lahir",
  birthDate: "Tanggal lahir",
  gender: "Jenis kelamin",
  previousSchool: "Asal sekolah",
  address: "Alamat",
  targetGrade: "Jenjang tujuan",
  parentName: "Nama orang tua/wali",
  parentPhone: "No. HP / WhatsApp",
  parentEmail: "Email",
  parentJob: "Pekerjaan",
};

type Props = { action: (prev: HasilDaftar, fd: FormData) => Promise<HasilDaftar> };

/**
 * Formulir pendaftaran 4 langkah. Tanpa JavaScript semua bagian tampil sekaligus dan formulir tetap bisa dikirim
 * (progressive enhancement). Dengan JS: validasi per langkah, ringkasan sebelum kirim, dan isian + berkas TIDAK hilang
 * saat server menolak (dikirim lewat onSubmit, bukan atribut action → React tidak mereset form).
 */
export function FormPpdb({ action }: Props) {
  const [s, kirim, menunggu] = useActionState(action, {} as HasilDaftar);
  const [langkah, setLangkah] = useState(0);
  // false saat SSR, true setelah hidrasi → mode bertahap hanya aktif bila JavaScript jalan.
  const siap = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [ringkasan, setRingkasan] = useState<Array<[string, string]>>([]);
  const form = useRef<HTMLFormElement>(null);
  const e = s.errors ?? {};

  // Server menolak → lompat ke langkah pertama yang bermasalah (disesuaikan saat render, bukan di effect).
  const [galatSebelumnya, setGalatSebelumnya] = useState(s.errors);
  if (s.errors !== galatSebelumnya) {
    setGalatSebelumnya(s.errors);
    const kunci = Object.keys(s.errors ?? {});
    if (kunci.length) setLangkah(Math.min(...kunci.map(stepDari)));
  }

  function validLangkah(i: number): boolean {
    const fs = form.current?.querySelector<HTMLFieldSetElement>(`[data-langkah="${i}"]`);
    if (!fs) return true;
    for (const el of fs.querySelectorAll<HTMLInputElement>("input, select, textarea")) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  function maju() {
    if (!validLangkah(langkah)) return;
    const berikut = langkah + 1;
    if (berikut === 3 && form.current) {
      const fd = new FormData(form.current);
      const r: Array<[string, string]> = [];
      for (const [k, lbl] of Object.entries(LABEL)) {
        const v = String(fd.get(k) ?? "").trim();
        if (v) r.push([lbl, v]);
      }
      for (const d of ppdb.dokumen) {
        const f = fd.get(`dok_${d.kind}`);
        r.push([d.label, f instanceof File && f.size > 0 ? f.name : "— tidak diunggah —"]);
      }
      setRingkasan(r);
    }
    setLangkah(berikut);
  }

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => kirim(fd));
  }

  if (s.ok && s.regNo && s.token) return <Sukses regNo={s.regNo} token={s.token} />;

  const tampil = (i: number) => !siap || langkah === i;
  const galatForm = s.pesan && s.ok === false;

  return (
    <form
      ref={form}
      action={kirim}
      onSubmit={onSubmit}
      aria-label="Form pendaftaran PPDB"
      encType="multipart/form-data"
      className="space-y-6"
    >
      {siap && (
        <ol aria-label="Langkah pendaftaran" className="flex flex-wrap gap-2" data-testid="langkah">
          {LANGKAH.map((n, i) => (
            <li
              key={n}
              aria-current={i === langkah ? "step" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${i === langkah ? "border-primary bg-primary font-semibold text-primary-fg" : i < langkah ? "border-primary text-primary" : "border-border text-muted"}`}
            >
              {i + 1}. {n}
            </li>
          ))}
        </ol>
      )}

      <fieldset data-langkah="0" hidden={!tampil(0)} className="space-y-4">
        <legend className="mb-2 text-xl font-bold text-fg">1. Data calon siswa</legend>
        <FormField label="Nama lengkap calon siswa" required error={e.studentName}>
          <input name="studentName" autoComplete="off" maxLength={100} className={input} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tempat lahir" required error={e.birthPlace}>
            <input name="birthPlace" maxLength={60} className={input} />
          </FormField>
          <FormField label="Tanggal lahir" required error={e.birthDate}>
            <input name="birthDate" type="date" className={input} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Jenis kelamin" required error={e.gender}>
            <select name="gender" defaultValue="" className={input}>
              <option value="">— Pilih —</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </FormField>
          <FormField label="Jenjang tujuan" required error={e.targetGrade}>
            <select name="targetGrade" defaultValue="" className={input}>
              <option value="">— Pilih —</option>
              {ppdb.jenjang.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Asal sekolah" error={e.previousSchool}>
          <input name="previousSchool" maxLength={100} className={input} />
        </FormField>
        <FormField
          label="Alamat lengkap"
          required
          error={e.address}
          hint="Jalan, nomor, kelurahan, kecamatan, kota."
        >
          <textarea name="address" rows={3} maxLength={320} className={input} />
        </FormField>
      </fieldset>

      <fieldset data-langkah="1" hidden={!tampil(1)} className="space-y-4">
        <legend className="mb-2 text-xl font-bold text-fg">2. Orang tua / wali</legend>
        <FormField label="Nama orang tua/wali" required error={e.parentName}>
          <input name="parentName" autoComplete="off" maxLength={100} className={input} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="No. HP / WhatsApp"
            required
            error={e.parentPhone}
            hint="Contoh: 081234567890"
          >
            <input name="parentPhone" type="tel" inputMode="tel" className={input} />
          </FormField>
          <FormField label="Email (opsional)" error={e.parentEmail}>
            <input name="parentEmail" type="email" className={input} />
          </FormField>
        </div>
        <FormField label="Pekerjaan (opsional)" error={e.parentJob}>
          <input name="parentJob" maxLength={60} className={input} />
        </FormField>
      </fieldset>

      <fieldset data-langkah="2" hidden={!tampil(2)} className="space-y-4">
        <legend className="mb-2 text-xl font-bold text-fg">3. Unggah dokumen</legend>
        <p className="text-sm text-muted">
          Format PDF, PNG, JPG, atau WebP; maksimal 2 MB per berkas.
        </p>
        {ppdb.dokumen.map((d) => (
          <FormField
            key={d.kind}
            label={d.wajib ? d.label : `${d.label} (opsional)`}
            error={e[`dok_${d.kind}`]}
          >
            <input
              name={`dok_${d.kind}`}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className={input}
            />
          </FormField>
        ))}
      </fieldset>

      <fieldset data-langkah="3" hidden={!tampil(3)} className="space-y-4">
        <legend className="mb-2 text-xl font-bold text-fg">4. Tinjau & kirim</legend>
        {siap && (
          <dl
            className="grid gap-x-6 gap-y-2 rounded-lg border border-border bg-surface p-4 text-sm sm:grid-cols-2"
            data-testid="ringkasan"
          >
            {ringkasan.map(([k, v]) => (
              <div key={k}>
                <dt className="font-medium text-fg">{k}</dt>
                <dd className="break-words text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        <label className="flex items-start gap-2 text-fg">
          <input type="checkbox" name="setuju" required className="mt-1" />
          <span>Saya menyatakan data yang diisi benar dan bersedia mengikuti ketentuan PPDB.</span>
        </label>
      </fieldset>

      {/* Honeypot: tersembunyi dari manusia & pembaca layar */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Jangan diisi
          <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {galatForm && (
        <p role="alert" data-testid="galat-form" className="text-sm text-danger">
          {s.pesan}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {siap && langkah > 0 && (
          <Button type="button" variant="secondary" onClick={() => setLangkah(langkah - 1)}>
            ← Sebelumnya
          </Button>
        )}
        {siap && langkah < 3 && (
          <Button type="button" onClick={maju}>
            Lanjut →
          </Button>
        )}
        {(!siap || langkah === 3) && (
          <Button type="submit" size="lg" disabled={menunggu}>
            {menunggu ? "Mengirim…" : "Kirim Pendaftaran"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Sukses({ regNo, token }: { regNo: string; token: string }) {
  const [tersalin, setTersalin] = useState<string | null>(null);
  async function salin(teks: string, tanda: string) {
    try {
      await navigator.clipboard.writeText(teks);
      setTersalin(tanda);
    } catch {
      setTersalin(null);
    }
  }
  return (
    <section
      aria-labelledby="sukses-judul"
      className="space-y-5 rounded-xl border border-border bg-surface p-6"
      data-testid="pendaftaran-sukses"
    >
      <h2 id="sukses-judul" className="text-2xl font-bold text-fg">
        Pendaftaran berhasil dikirim
      </h2>
      <p className="text-fg">
        <strong>Simpan data berikut sekarang.</strong> Token hanya ditampilkan satu kali dan tidak
        dapat dipulihkan — tanpa token, status pendaftaran tidak dapat diperiksa.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">Nomor pendaftaran</dt>
          <dd className="font-mono text-2xl font-bold text-primary" data-testid="no-pendaftaran">
            {regNo}
          </dd>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => salin(regNo, "nomor")}
          >
            {tersalin === "nomor" ? "Tersalin ✓" : "Salin nomor"}
          </Button>
        </div>
        <div>
          <dt className="text-sm text-muted">Token akses</dt>
          <dd className="font-mono text-2xl font-bold text-primary" data-testid="token-akses">
            {token}
          </dd>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => salin(token, "token")}
          >
            {tersalin === "token" ? "Tersalin ✓" : "Salin token"}
          </Button>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => window.print()}>
          Cetak bukti
        </Button>
        <a
          href="/ppdb/status"
          className="inline-flex items-center rounded-md px-4 py-2 font-medium text-primary underline underline-offset-2"
        >
          Cek status pendaftaran →
        </a>
      </div>
    </section>
  );
}
