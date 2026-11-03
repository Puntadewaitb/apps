"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, ButtonLink, FormField } from "@tpl/ui";
import { HONEYPOT_FIELD } from "@tpl/core/honeypot";
import { rupiah } from "../lib/format";
import { keranjang, useKeranjang, useSiap } from "../lib/keranjang-store";
import type { Ringkasan, Sukses } from "../lib/checkout-server";

type Props = { kotaOpsi: string[]; ongkirBawaan: number };
type Isian = {
  nama: string;
  telepon: string;
  email: string;
  alamat: string;
  kota: string;
  catatan: string;
};
const AWAL: Isian = { nama: "", telepon: "", email: "", alamat: "", kota: "", catatan: "" };
const input = "w-full rounded-md border border-border bg-bg px-3 py-2 text-fg";

/** Kunci idempotensi per percobaan kirim (mencegah pesanan ganda saat klik dua kali / jaringan mengulang). */
function kunciBaru(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function useRingkasan(
  items: Array<{ varianId: number; qty: number }>,
  kota: string,
  voucher: string,
) {
  const kunci = JSON.stringify([items, kota.trim(), voucher]);
  const [hasil, setHasil] = useState<{ kunci: string; r: Ringkasan | null; galat: string }>({
    kunci: "",
    r: null,
    galat: "",
  });
  const [ulang, setUlang] = useState(0);
  useEffect(() => {
    if (items.length === 0) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      fetch("/api/checkout/ringkasan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, kota, voucher }),
        signal: ac.signal,
      })
        .then(async (r) => {
          const j = (await r.json().catch(() => ({}))) as { ringkasan?: Ringkasan; galat?: string };
          if (!r.ok || !j.ringkasan) throw new Error(j.galat ?? "Gagal memuat ringkasan.");
          setHasil({ kunci, r: j.ringkasan, galat: "" });
        })
        .catch((e: unknown) => {
          if ((e as { name?: string }).name !== "AbortError")
            setHasil({
              kunci,
              r: null,
              galat: e instanceof Error ? e.message : "Gagal memuat ringkasan.",
            });
        });
    }, 350);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci, ulang]);
  const terkini = hasil.kunci === kunci;
  return {
    ringkasan: hasil.r,
    galat: terkini ? hasil.galat : "",
    memuat: !terkini,
    setRingkasan: (r: Ringkasan) => setHasil({ kunci, r, galat: "" }),
    muatUlang: () => setUlang((n) => n + 1),
  };
}

function Konfirmasi({ s }: { s: Sukses }) {
  return (
    <div className="mx-auto max-w-2xl" data-testid="konfirmasi">
      <h2 className="text-2xl font-bold text-fg">Pesanan berhasil dibuat 🎉</h2>
      <p className="mt-2 text-muted">
        Simpan kode pesanan Anda. Kode ini dan nomor HP dipakai untuk melacak pesanan.
      </p>
      <p
        className="mt-4 rounded-lg border border-primary/40 bg-primary/10 p-4 text-center text-2xl font-bold tracking-wider text-primary"
        data-testid="kode-pesanan"
      >
        {s.kode}
      </p>
      <section className="mt-6 rounded-lg border border-border p-4" aria-labelledby="rinci">
        <h3 id="rinci" className="font-semibold text-fg">
          Rincian
        </h3>
        <ul className="mt-2 divide-y divide-border text-sm">
          {s.baris.map((b, i) => (
            <li key={i} className="flex justify-between gap-3 py-2">
              <span>
                {b.produkNama}
                {b.varianNama !== "Standar" && ` (${b.varianNama})`} × {b.qty}
              </span>
              <span>{rupiah(b.jumlah)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{rupiah(s.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Ongkir</dt>
            <dd>{rupiah(s.ongkir)}</dd>
          </div>
          {s.diskon > 0 && (
            <div className="flex justify-between">
              <dt>Diskon</dt>
              <dd>-{rupiah(s.diskon)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-fg">
            <dt>Total bayar</dt>
            <dd data-testid="total-bayar">{rupiah(s.total)}</dd>
          </div>
        </dl>
      </section>
      <section className="mt-6 rounded-lg border border-border p-4" aria-labelledby="bayar">
        <h3 id="bayar" className="font-semibold text-fg">
          Cara pembayaran
        </h3>
        {s.catatanBayar && <p className="mt-2 text-sm text-muted">{s.catatanBayar}</p>}
        {s.rekening.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm" data-testid="daftar-rekening">
            {s.rekening.map((r, i) => (
              <li key={i} className="rounded-md bg-surface p-3">
                <span className="font-medium text-fg">{r.bank}</span> · {r.nomor}
                <br />
                a.n. {r.atasNama}
              </li>
            ))}
          </ul>
        )}
        {s.qris && (
          <figure className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.qris}
              alt="Kode QRIS pembayaran (contoh)"
              width={200}
              height={200}
              className="rounded-md border border-border"
            />
            <figcaption className="mt-1 text-xs text-muted">
              QRIS (gambar contoh pada demo ini).
            </figcaption>
          </figure>
        )}
      </section>
      <div className="mt-6 flex flex-wrap gap-3">
        {s.waUrl && (
          <ButtonLink
            href={s.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            data-testid="kirim-wa"
          >
            Kirim pesanan via WhatsApp
          </ButtonLink>
        )}
        <ButtonLink href="/produk" variant="secondary" size="lg">
          Lanjut belanja
        </ButtonLink>
      </div>
    </div>
  );
}

export function CheckoutForm({ kotaOpsi, ongkirBawaan }: Props) {
  const baris = useKeranjang();
  const siap = useSiap();
  const [f, setF] = useState<Isian>(AWAL);
  const [voucherIsi, setVoucherIsi] = useState("");
  const [voucher, setVoucher] = useState("");
  const [galatField, setGalatField] = useState<Record<string, string>>({});
  const [galatUmum, setGalatUmum] = useState("");
  const [kirim, setKirim] = useState(false);
  const [sukses, setSukses] = useState<Sukses | null>(null);
  const [kunci, setKunci] = useState(kunciBaru);
  const [dibuka] = useState(() => Date.now());
  const items = baris.map((b) => ({ varianId: b.varianId, qty: b.qty }));
  const { ringkasan, galat, memuat, setRingkasan, muatUlang } = useRingkasan(
    sukses ? [] : items,
    f.kota,
    voucher,
  );

  const set = (k: keyof Isian) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ringkasan || kirim) return;
    setKirim(true);
    setGalatUmum("");
    setGalatField({});
    try {
      const form = new FormData(e.currentTarget);
      const res = await fetch("/api/pesanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kunci,
          items,
          ...f,
          voucher,
          totalPreview: ringkasan.total,
          dibuka,
          [HONEYPOT_FIELD]: String(form.get(HONEYPOT_FIELD) ?? ""),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as Partial<Sukses> & {
        galat?: string;
        pesan?: string;
        field?: Record<string, string>;
        ringkasan?: Ringkasan;
      };
      if (res.ok && j.ok) {
        keranjang.kosongkan();
        setSukses(j as Sukses);
        window.scrollTo({ top: 0 });
        return;
      }
      if (j.field) setGalatField(j.field);
      if (j.ringkasan) setRingkasan(j.ringkasan);
      setGalatUmum(j.pesan ?? j.galat ?? "Pesanan gagal diproses. Coba lagi.");
      // Pesanan ditolak: kunci baru supaya perbaikan isian tidak dianggap pengulangan permintaan lama.
      setKunci(kunciBaru());
    } catch {
      setGalatUmum("Tidak dapat terhubung ke server. Periksa koneksi Anda lalu coba lagi.");
    } finally {
      setKirim(false);
    }
  }

  if (sukses) return <Konfirmasi s={sukses} />;
  if (!siap)
    return (
      <p className="text-muted" role="status">
        Memuat…
      </p>
    );
  if (baris.length === 0)
    return (
      <div
        className="rounded-lg border border-dashed border-border p-10 text-center"
        data-testid="checkout-kosong"
      >
        <p className="font-medium text-fg">Keranjang Anda kosong</p>
        <ButtonLink href="/produk" className="mt-5">
          Mulai belanja
        </ButtonLink>
      </div>
    );

  const bisaKirim = !!ringkasan && ringkasan.bisaPesan && !memuat && !kirim;
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
      aria-label="Formulir checkout"
    >
      <div className="space-y-5">
        {galatUmum && (
          <p
            role="alert"
            data-testid="galat-umum"
            className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
          >
            {galatUmum}
          </p>
        )}
        <FormField label="Nama lengkap" required error={galatField.nama}>
          <input
            name="nama"
            autoComplete="name"
            maxLength={100}
            value={f.nama}
            onChange={set("nama")}
            className={input}
          />
        </FormField>
        <FormField
          label="No. HP / WhatsApp"
          required
          hint="Contoh: 081234567890"
          error={galatField.telepon}
        >
          <input
            name="telepon"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={20}
            value={f.telepon}
            onChange={set("telepon")}
            className={input}
          />
        </FormField>
        <FormField label="Email (opsional)" error={galatField.email}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={f.email}
            onChange={set("email")}
            className={input}
          />
        </FormField>
        <FormField label="Alamat lengkap" required error={galatField.alamat}>
          <textarea
            name="alamat"
            autoComplete="street-address"
            rows={3}
            maxLength={300}
            value={f.alamat}
            onChange={set("alamat")}
            className={input}
          />
        </FormField>
        <FormField
          label="Kota / kabupaten"
          required
          hint={`Ongkir mengikuti tabel kota; kota lain Rp ${ongkirBawaan.toLocaleString("id-ID")}.`}
          error={galatField.kota}
        >
          <input
            name="kota"
            list="daftar-kota"
            autoComplete="address-level2"
            maxLength={60}
            value={f.kota}
            onChange={set("kota")}
            className={input}
          />
        </FormField>
        <datalist id="daftar-kota">
          {kotaOpsi.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <FormField label="Catatan untuk penjual (opsional)" error={galatField.catatan}>
          <textarea
            name="catatan"
            rows={2}
            maxLength={300}
            value={f.catatan}
            onChange={set("catatan")}
            className={input}
          />
        </FormField>
        {/* Honeypot: tersembunyi dari manusia & pembaca layar */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Jangan diisi
            <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      <aside
        className="h-fit space-y-4 rounded-lg border border-border bg-surface p-5"
        aria-labelledby="ringkasan-judul"
      >
        <h2 id="ringkasan-judul" className="text-lg font-semibold text-fg">
          Ringkasan pesanan
        </h2>
        {galat && (
          <div role="alert" className="text-sm text-danger">
            {galat}{" "}
            <button type="button" onClick={muatUlang} className="underline">
              Coba lagi
            </button>
          </div>
        )}
        {!ringkasan && !galat && (
          <p className="text-sm text-muted" role="status">
            Menghitung…
          </p>
        )}
        {ringkasan && (
          <>
            <ul className="divide-y divide-border text-sm" data-testid="ringkasan-item">
              {ringkasan.baris.map((b) => (
                <li
                  key={b.varianId}
                  className="flex justify-between gap-3 py-2"
                  data-status={b.status}
                >
                  <span className="min-w-0">
                    {b.status === "tidak-tersedia"
                      ? "Produk tidak tersedia lagi"
                      : `${b.produkNama}${b.varianNama !== "Standar" ? ` (${b.varianNama})` : ""} × ${b.qty}`}
                    {b.status === "stok-kurang" && (
                      <span className="block text-danger">Stok tersisa {b.stok}</span>
                    )}
                  </span>
                  <span>{b.status === "ok" ? rupiah(b.jumlah) : "—"}</span>
                </li>
              ))}
            </ul>
            <div>
              <label htmlFor="voucher" className="text-sm font-medium text-fg">
                Kode voucher
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="voucher"
                  value={voucherIsi}
                  onChange={(e) => setVoucherIsi(e.target.value)}
                  maxLength={32}
                  autoComplete="off"
                  className={input}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setVoucher(voucherIsi.trim())}
                  disabled={!voucherIsi.trim()}
                >
                  Terapkan
                </Button>
              </div>
              {ringkasan.voucher && (
                <p
                  role="status"
                  data-testid="status-voucher"
                  className={`mt-2 text-sm ${ringkasan.voucher.ok ? "text-success" : "text-danger"}`}
                >
                  {ringkasan.voucher.ok
                    ? `Voucher ${ringkasan.voucher.kode} diterapkan.`
                    : ringkasan.voucher.pesan}{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      setVoucher("");
                      setVoucherIsi("");
                    }}
                  >
                    Hapus voucher
                  </button>
                </p>
              )}
            </div>
            <dl className="space-y-1 text-sm" aria-live="polite">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd data-testid="co-subtotal">{rupiah(ringkasan.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Ongkir</dt>
                <dd data-testid="co-ongkir">{rupiah(ringkasan.ongkir)}</dd>
              </div>
              {ringkasan.diskon > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Diskon</dt>
                  <dd data-testid="co-diskon">-{rupiah(ringkasan.diskon)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-fg">
                <dt>Total</dt>
                <dd data-testid="co-total">{rupiah(ringkasan.total)}</dd>
              </div>
            </dl>
            {ringkasan.masalah
              .filter((m) => m !== ringkasan.voucher?.pesan)
              .map((m) => (
                <p key={m} className="text-sm text-danger" role="status">
                  {m}
                </p>
              ))}
            {ringkasan.baris.some((b) => b.status !== "ok") && (
              <a href="/keranjang" className="block text-sm underline">
                Perbaiki keranjang
              </a>
            )}
          </>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!bisaKirim}
          data-testid="buat-pesanan"
        >
          {kirim ? "Memproses…" : "Buat pesanan"}
        </Button>
        <p className="text-xs text-muted">
          Dengan membuat pesanan, stok barang dikunci untuk Anda. Total final dihitung ulang oleh
          server.
        </p>
      </aside>
    </form>
  );
}
