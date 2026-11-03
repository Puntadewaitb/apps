"use client";

import { useState, type FormEvent } from "react";
import { Button, FormField } from "@tpl/ui";
import { rupiah } from "../lib/format";
import { ORDER_STATUS_LABEL } from "../lib/domain";
import { TAHAP, type TampilanPesanan } from "../lib/lacak";

const input = "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg";
const tgl = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));

function Tahap({ status }: { status: string }) {
  if (status === "DIBATALKAN")
    return (
      <p
        className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
        data-testid="status-batal"
      >
        Pesanan ini dibatalkan.
      </p>
    );
  const idx = TAHAP.findIndex((t) => t === status);
  return (
    <ol className="flex flex-wrap gap-2 text-sm" aria-label="Tahapan pesanan" data-testid="tahapan">
      {TAHAP.map((t, i) => (
        <li
          key={t}
          aria-current={i === idx ? "step" : undefined}
          className={`rounded-full border px-3 py-1 ${i === idx ? "border-primary bg-primary text-primary-fg" : i < idx ? "border-primary/40 text-primary" : "border-border text-muted"}`}
        >
          {i < idx && <span aria-hidden="true">✓ </span>}
          {ORDER_STATUS_LABEL[t]}
        </li>
      ))}
    </ol>
  );
}

export function FormLacak({ kodeAwal = "" }: { kodeAwal?: string }) {
  const [kode, setKode] = useState(kodeAwal);
  const [telepon, setTelepon] = useState("");
  const [galat, setGalat] = useState("");
  const [pesanan, setPesanan] = useState<TampilanPesanan | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [bukti, setBukti] = useState<{ jenis: "ok" | "galat"; teks: string } | null>(null);
  const [mengunggah, setMengunggah] = useState(false);

  async function cek(e?: FormEvent) {
    e?.preventDefault();
    setMemuat(true);
    setGalat("");
    setBukti(null);
    try {
      const res = await fetch("/api/lacak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode, telepon }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        pesanan?: TampilanPesanan;
        galat?: string;
      };
      if (res.ok && j.pesanan) setPesanan(j.pesanan);
      else {
        setPesanan(null);
        setGalat(j.galat ?? "Gagal memeriksa pesanan.");
      }
    } catch {
      setPesanan(null);
      setGalat("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setMemuat(false);
    }
  }

  async function unggah(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // currentTarget bernilai null setelah await — simpan dulu
    const berkas = new FormData(form).get("berkas");
    if (!(berkas instanceof File) || berkas.size === 0) {
      setBukti({ jenis: "galat", teks: "Pilih berkas bukti bayar terlebih dulu." });
      return;
    }
    setMengunggah(true);
    setBukti(null);
    try {
      const fd = new FormData();
      fd.set("kode", kode);
      fd.set("telepon", telepon);
      fd.set("berkas", berkas);
      const res = await fetch("/api/lacak/bukti", { method: "POST", body: fd });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; galat?: string };
      if (res.ok && j.ok) {
        setBukti({
          jenis: "ok",
          teks: "Bukti bayar berhasil diunggah. Admin akan memverifikasi pembayaran Anda.",
        });
        setPesanan((p) => (p ? { ...p, buktiAda: true } : p));
        form.reset();
      } else setBukti({ jenis: "galat", teks: j.galat ?? "Unggahan gagal." });
    } catch {
      setBukti({ jenis: "galat", teks: "Tidak dapat terhubung ke server. Coba lagi." });
    } finally {
      setMengunggah(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={cek}
        className="grid gap-4 sm:grid-cols-2"
        aria-label="Cek pesanan"
        noValidate
      >
        <FormField label="Kode pesanan" required hint="Contoh: TKO-K7M2XQ4P">
          <input
            name="kode"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            maxLength={40}
            autoComplete="off"
            className={input}
          />
        </FormField>
        <FormField label="No. HP saat memesan" required hint="Nomor yang Anda isi di checkout">
          <input
            name="telepon"
            type="tel"
            inputMode="tel"
            value={telepon}
            onChange={(e) => setTelepon(e.target.value)}
            maxLength={30}
            autoComplete="tel"
            className={input}
          />
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={memuat || !kode.trim() || !telepon.trim()}>
            {memuat ? "Memeriksa…" : "Cek pesanan"}
          </Button>
        </div>
        {galat && (
          <p role="alert" data-testid="galat-lacak" className="text-sm text-danger sm:col-span-2">
            {galat}
          </p>
        )}
      </form>

      {pesanan && (
        <section
          aria-labelledby="hasil"
          className="space-y-6 rounded-lg border border-border p-5"
          data-testid="hasil-lacak"
        >
          <div>
            <h2 id="hasil" className="text-xl font-bold text-fg">
              Pesanan <span data-testid="hasil-kode">{pesanan.kode}</span>
            </h2>
            <p className="text-sm text-muted">
              Atas nama {pesanan.nama} · {pesanan.kota} · dibuat {tgl(pesanan.dibuat)}
            </p>
            <p className="mt-3 text-lg font-semibold text-fg" data-testid="status-label">
              Status: {pesanan.statusLabel}
            </p>
          </div>
          <Tahap status={pesanan.status} />
          <div>
            <h3 className="font-semibold text-fg">Rincian</h3>
            <ul className="mt-2 divide-y divide-border text-sm">
              {pesanan.baris.map((b, i) => (
                <li key={i} className="flex justify-between gap-3 py-2">
                  <span>
                    {b.produkNama}
                    {b.varianNama !== "Standar" && ` (${b.varianNama})`} × {b.qty}
                  </span>
                  <span className="whitespace-nowrap">{rupiah(b.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="whitespace-nowrap">{rupiah(pesanan.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Ongkir</dt>
                <dd className="whitespace-nowrap">{rupiah(pesanan.ongkir)}</dd>
              </div>
              {pesanan.diskon > 0 && (
                <div className="flex justify-between">
                  <dt>Diskon{pesanan.voucher && ` (${pesanan.voucher})`}</dt>
                  <dd>-{rupiah(pesanan.diskon)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-fg">
                <dt>Total</dt>
                <dd data-testid="hasil-total" className="whitespace-nowrap">
                  {rupiah(pesanan.total)}
                </dd>
              </div>
            </dl>
          </div>

          {pesanan.pembayaran && (
            <div className="rounded-md bg-surface p-4 text-sm" data-testid="info-bayar">
              <h3 className="font-semibold text-fg">Pembayaran</h3>
              {pesanan.pembayaran.catatan && (
                <p className="mt-1 text-muted">{pesanan.pembayaran.catatan}</p>
              )}
              <ul className="mt-2 space-y-1">
                {pesanan.pembayaran.rekening.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.bank}</span> · {r.nomor} · a.n. {r.atasNama}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-fg">Bukti pembayaran</h3>
            {pesanan.buktiAda && (
              <p className="mt-1 text-sm text-success" data-testid="bukti-ada">
                Bukti bayar sudah diunggah.
              </p>
            )}
            {pesanan.bolehUnggah ? (
              <form onSubmit={unggah} className="mt-3 space-y-3" aria-label="Formulir bukti bayar">
                <FormField
                  label={pesanan.buktiAda ? "Ganti bukti bayar" : "Unggah bukti bayar"}
                  hint="PNG, JPG, WebP, atau PDF — maksimal 2 MB"
                >
                  <input
                    name="berkas"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className={input}
                  />
                </FormField>
                <Button type="submit" disabled={mengunggah}>
                  {mengunggah ? "Mengunggah…" : "Kirim bukti"}
                </Button>
              </form>
            ) : (
              !pesanan.buktiAda && (
                <p className="mt-1 text-sm text-muted">
                  Unggah bukti bayar hanya tersedia saat pesanan menunggu pembayaran.
                </p>
              )
            )}
            {bukti && (
              <p
                role="status"
                data-testid="status-bukti"
                className={`mt-3 text-sm ${bukti.jenis === "ok" ? "text-success" : "text-danger"}`}
              >
                {bukti.teks}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
